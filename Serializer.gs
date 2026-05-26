const SNAPSHOT_SCHEMA_VERSION = 1;
const GLOBALS_SHEET_NAME = 'globals';

function serializeActiveSpreadsheet() {
  const ss = SpreadsheetApp.getActive();
  const sheets = {};
  const all = ss.getSheets();
  for (let i = 0; i < all.length; i++) {
    const sheet = all[i];
    const name = sheet.getName();
    sheets[name] = (name === GLOBALS_SHEET_NAME)
      ? serializeGlobalsSheet_(sheet)
      : serializeTabularSheet_(sheet);
  }
  return {
    meta: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      spreadsheetName: ss.getName(),
    },
    sheets: sheets,
  };
}

function serializeTabularSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  const range = sheet.getRange(1, 1, lastRow, lastCol);
  const formulas = range.getFormulas();
  const values = range.getValues();

  const headers = new Array(lastCol);
  for (let c = 0; c < lastCol; c++) {
    const h = values[0][c];
    headers[c] = (h === '' || h == null) ? null : String(h);
  }

  const rows = new Array(lastRow - 1);
  for (let r = 1; r < lastRow; r++) {
    const row = {};
    for (let c = 0; c < lastCol; c++) {
      const header = headers[c];
      if (header == null) continue;
      const f = formulas[r][c];
      const v = values[r][c];
      if (!f && (v === '' || v == null)) continue;
      row[header] = f ? { value: v, formula: f } : v;
    }
    rows[r - 1] = row;
  }
  return rows;
}

function serializeGlobalsSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) return {};
  const range = sheet.getRange(1, 1, lastRow, 2);
  const formulas = range.getFormulas();
  const values = range.getValues();
  const result = {};
  for (let r = 0; r < lastRow; r++) {
    const key = values[r][0];
    if (key === '' || key == null) continue;
    const f = formulas[r][1];
    const v = values[r][1];
    result[String(key)] = f ? { value: v, formula: f } : v;
  }
  return result;
}
