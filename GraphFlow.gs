const COMMITS_PAGE_SIZE = 50;

function getCommitGraph(req) {
  const owner = req.owner;
  const repo = req.repo;
  const branch = req.branch;

  const raw = listCommits(owner, repo, branch, COMMITS_PAGE_SIZE);
  const commits = raw.map(function (c) {
    return {
      sha: c.sha,
      message: (c.message || '').split('\n', 1)[0],
      author: c.author,
      date: c.date,
    };
  });

  return {
    head: commits.length ? commits[0].sha : null,
    branch: branch,
    commits: commits,
  };
}
