const COMMITS_PAGE_SIZE = 50;

function getCommitGraph(req) {
  const owner = req.owner;
  const repo = req.repo;

  const branches = listBranches(owner, repo);

  // Aggregate commits across all branches into a single DAG, deduped by sha.
  // Per branch we fetch up to COMMITS_PAGE_SIZE commits (known limit: deep
  // histories beyond that page are not shown).
  const bySha = {};
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const raw = listCommits(owner, repo, b.name, COMMITS_PAGE_SIZE);
    for (let j = 0; j < raw.length; j++) {
      const c = raw[j];
      if (!bySha[c.sha]) {
        bySha[c.sha] = {
          sha: c.sha,
          message: (c.message || '').split('\n', 1)[0],
          author: c.author,
          date: c.date,
          parents: c.parents || [],
          refs: [],
        };
      }
    }
  }

  // Attach branch-name refs to each branch tip (a sha may be the tip of more
  // than one branch).
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const tip = bySha[b.sha];
    if (tip) tip.refs.push(b.name);
  }

  // Newest-first; gitgraph.import() expects reverse-chronological order.
  const commits = Object.keys(bySha).map(function (sha) { return bySha[sha]; });
  commits.sort(function (a, b) {
    return (a.date < b.date) ? 1 : (a.date > b.date) ? -1 : 0;
  });

  return { commits: commits };
}
