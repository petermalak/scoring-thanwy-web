// utils/sheets.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Cache for headers and column indices with shorter duration
const cache = {
  headers: new Map(),
  lastUpdated: new Map(),
  CACHE_DURATION: 30 * 1000, // 30 seconds for real-time updates
};

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
};

// Cache for sheet data
let sheetDataCache = null;
let lastFetchTime = null;
const CACHE_DURATION_SHEET = 5 * 60 * 1000; // 5 minutes

// Retry helper function
async function withRetry(operation, operationName) {
  let lastError;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed for ${operationName}:`, error);
      
      if (attempt < RETRY_CONFIG.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
      }
    }
  }

  throw new Error(`Failed after ${RETRY_CONFIG.maxAttempts} attempts: ${lastError.message}`);
}

// Batch operations queue
let batchQueue = [];
let batchTimeout = null;

// Process batch operations
async function processBatchQueue() {
  if (batchQueue.length === 0) return;
  
  const batch = batchQueue;
  batchQueue = [];
  
  try {
    const requests = batch.map(op => ({
      range: `${op.sheetName}!${op.range}`,
      values: [[op.value]],
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: requests,
      },
    });
  } catch (error) {
    console.error('Batch update failed:', error);
    // Retry individual operations
    for (const op of batch) {
      try {
        await updateCell(op.sheetName, op.range, op.value);
      } catch (err) {
        console.error(`Failed to update ${op.sheetName}!${op.range}:`, err);
      }
    }
  }
}

export async function appendRow(sheetName, values) {
  return withRetry(
    async () => {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [values],
        },
      });
      return response;
    },
    'appendRow'
  );
}

// Get the first sheet name
async function getFirstSheetName() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    return response.data.sheets[0].properties.title;
  } catch (error) {
    console.error('Error getting sheet name:', error);
    throw error;
  }
}

export async function getSheetData() {
  try {
    // Check if we have valid cached data
    if (sheetDataCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION_SHEET)) {
      return sheetDataCache;
    }

    // Get the first sheet name
    const sheetName = await getFirstSheetName();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A1:Z1000`, // Use the actual sheet name
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return [];
    }

    // Get headers from the first row
    const headers = rows[0];
    
    // Transform the data into objects
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.toLowerCase()] = row[index] || '';
      });
      return obj;
    });

    // Update cache
    sheetDataCache = data;
    lastFetchTime = Date.now();

    return data;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

export async function updateCell(sheetName, cell, value) {
  return withRetry(
    async () => {
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `${sheetName}!${cell}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });
      return response;
    },
    'updateCell'
  );
}

export async function getHeaders() {
  try {
    const sheetName = await getFirstSheetName();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A1:Z1`, // Use the actual sheet name
    });

    return response.data.values?.[0] || [];
  } catch (error) {
    console.error('Error fetching headers:', error);
    throw error;
  }
}

export async function findRowByValue(value) {
  try {
    const data = await getSheetData();
    return data.find(row => row.qrcode === value);
  } catch (error) {
    console.error('Error finding row:', error);
    throw error;
  }
}

export async function getRowData(sheetName, rowNumber) {
  return withRetry(
    async () => {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });
      return response.data.values?.[0] || null;
    },
    'getRowData'
  );
}

export async function updateRowScore(rowIndex, newScore) {
  try {
    const sheetName = await getFirstSheetName();
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!D${rowIndex + 2}`, // Use the actual sheet name
      valueInputOption: 'RAW',
      resource: {
        values: [[newScore.toString()]]
      }
    });

    // Invalidate cache
    sheetDataCache = null;
    lastFetchTime = null;
  } catch (error) {
    console.error('Error updating score:', error);
    throw error;
  }
}
