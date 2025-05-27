// utils/sheets.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'thamwy-a9f5381a8f1a.json'),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

export async function appendRow(sheetName, values) {
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
  return response;
}

export async function getSheetData(sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A1:Z1000`,
  });
  return response.data.values;
}

export async function updateCell(sheetName, cell, value) {
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });
  return response;
}
