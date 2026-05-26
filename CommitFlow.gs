const STORAGE_FILENAME = 'spreadsheet.json';

function commitSnapshot(req) {
  const owner = req.owner;
  const repo = req.repo;
  const branch = req.branch;
  const message = req.message;

  const parentSha = getRef(owner, repo, branch).sha;

  const snapshot = serializeActiveSpreadsheet();
  const content = JSON.stringify(snapshot, null, 2);

  const blob = createBlob(owner, repo, content);
  const parentTreeSha = getCommit(owner, repo, parentSha).treeSha;
  const tree = createTree(owner, repo, parentTreeSha, [{
    path: STORAGE_FILENAME,
    mode: '100644',
    type: 'blob',
    sha: blob.sha,
  }]);
  const commit = createCommit(owner, repo, message, tree.sha, parentSha);
  updateRef(owner, repo, branch, commit.sha);

  return { newSha: commit.sha };
}
