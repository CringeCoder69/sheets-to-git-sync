function applySnapshot(snapshot) {
  if (!snapshot || !snapshot.meta || snapshot.meta.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    throw { name: 'AppError', code: 'BadSnapshot', message: 'Unsupported snapshot schema version' };
  }
  if (!snapshot.sheets || typeof snapshot.sheets !== 'object') {
    throw { name: 'AppError', code: 'BadSnapshot', message: 'Snapshot has no sheets' };
  }
  const names = Object.keys(snapshot.sheets);
  if (names.length === 0) throw { name: 'AppError', code: 'BadSnapshot', message: 'Snapshot has no sheets' };

  const ss = SpreadsheetApp.getActive();
  const existing = {};
  ss.getSheets().forEach(function (s) { existing[s.getName()] = s; });

  // create missing sheets first, so >=1 sheet always survives the delete pass
  names.forEach(function (name) { if (!existing[name]) existing[name] = ss.insertSheet(name); });

  // rewrite each sheet's content
  names.forEach(function (name) {
    const sheet = existing[name];
    sheet.clearContents();                       // keeps formatting; clears values+formulas
    if (name === GLOBALS_SHEET_NAME) writeGlobalsSheet_(sheet, snapshot.sheets[name]);
    else writeTabularSheet_(sheet, snapshot.sheets[name]);
  });

  // delete sheets not in the snapshot
  ss.getSheets().forEach(function (s) { if (names.indexOf(s.getName()) === -1) ss.deleteSheet(s); });

  // reorder to snapshot key order (tab order)
  names.forEach(function (name, i) { ss.setActiveSheet(existing[name]); ss.moveActiveSheet(i + 1); });
}

function cellToSheetValue_(cell) {
  return (cell && typeof cell === 'object' && 'formula' in cell) ? cell.formula : cell;
}

function writeGlobalsSheet_(sheet, dict) {
  const keys = Object.keys(dict || {});
  if (keys.length === 0) return;
  const out = keys.map(function (k) { return [k, cellToSheetValue_(dict[k])]; });
  sheet.getRange(1, 1, out.length, 2).setValues(out);
}

function writeTabularSheet_(sheet, rows) {
  rows = rows || [];
  if (rows.length === 0) return;
  const headers = [], seen = {};                 // union of keys, insertion order
  rows.forEach(function (row) {
    Object.keys(row || {}).forEach(function (k) { if (!seen[k]) { seen[k] = true; headers.push(k); } });
  });
  if (headers.length === 0) return;
  const matrix = [headers.slice()];
  rows.forEach(function (row) {
    row = row || {};
    matrix.push(headers.map(function (h) { return (h in row) ? cellToSheetValue_(row[h]) : ''; }));
  });
  sheet.getRange(1, 1, matrix.length, headers.length).setValues(matrix);
}
