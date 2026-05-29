function checkoutCommit(req) {
  const owner = req.owner, repo = req.repo, ref = req.ref;

  const file = getContents(owner, repo, STORAGE_FILENAME, ref);
  let base64 = file.content;
  if (!base64 || file.encoding !== 'base64') {       // >1 MB → Contents API returns no content
    base64 = getBlob(owner, repo, file.sha).content;
  }
  const bytes = Utilities.base64Decode(String(base64).replace(/\n/g, ''));
  const json = Utilities.newBlob(bytes).getDataAsString('UTF-8');
  const snapshot = JSON.parse(json);

  applySnapshot(snapshot);
  return { ref: ref, sha: file.sha };
}
