// utils/sheets.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Ensure we're using the same environment variable name throughout
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

if (!SPREADSHEET_ID) {
  throw new Error('SPREADSHEET_ID environment variable is not set');
}

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
export async function getFirstSheetName() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
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

    const sheetName = await getFirstSheetName();
    console.log('Fetching data from sheet:', sheetName);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1000`,
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
        spreadsheetId: SPREADSHEET_ID,
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
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });

    return response.data.values?.[0] || [];
  } catch (error) {
    console.error('Error fetching headers:', error);
    throw error;
  }
}

export async function findRowByValue(columnName, value) {
  try {
    console.log('Finding row with:', { columnName, value });
    
    const sheetName = await getFirstSheetName();
    console.log('Using sheet:', sheetName);
    
    const headers = await getHeaders();
    console.log('Sheet Headers:', headers);
    
    const columnIndex = headers.findIndex(h => h.toLowerCase() === columnName.toLowerCase());
    console.log('Column Index:', columnIndex);
    
    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found in sheet`);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1000`,
    });

    const rows = response.data.values || [];
    console.log('Total rows:', rows.length);

    if (rows.length === 0) {
      throw new Error('No data found in sheet');
    }

    // Start from index 1 to skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[columnIndex] === value) {
        console.log('Found matching row:', i + 1);
        return i + 1; // Return 1-based row number
      }
    }

    console.log('No matching row found');
    return null;
  } catch (error) {
    console.error('Error in findRowByValue:', error);
    throw error;
  }
}

export async function getRowData(sheetName, rowNumber) {
  if (!rowNumber) {
    throw new Error('Row number is required');
  }

  return withRetry(
    async () => {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });
      return response.data.values?.[0] || null;
    },
    'getRowData'
  );
}

export async function updateRowScore(rowIndex, newScore) {
  if (!rowIndex) {
    throw new Error('Row index is required');
  }

  const sheetName = await getFirstSheetName();
  const headers = await getHeaders();
  const scoreColumnIndex = headers.findIndex(h => h.toLowerCase() === 'score');
  
  if (scoreColumnIndex === -1) {
    throw new Error('Score column not found in sheet');
  }

  const columnLetter = String.fromCharCode(65 + scoreColumnIndex); // Convert index to column letter
  return updateCell(sheetName, `${columnLetter}${rowIndex}`, newScore);
}
