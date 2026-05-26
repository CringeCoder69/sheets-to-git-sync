function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Git Sync')
    .addItem('Open sidebar', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService
    .createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('Git Sync');
  SpreadsheetApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
