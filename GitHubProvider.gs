const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

function GitHubError(status, body) {
  this.name = 'GitHubError';
  this.status = status;
  this.body = body;
  this.message = 'GitHub ' + status + ': ' + (body && body.message ? body.message : 'request failed');
}
GitHubError.prototype = Object.create(Error.prototype);

function _request(method, path, body) {
  const pat = getPat();
  const url = path.indexOf('http') === 0 ? path : (GITHUB_API + path);
  const opts = {
    method: method,
    headers: {
      'Authorization': 'token ' + pat,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    muteHttpExceptions: true,
    followRedirects: true,
  };
  if (body != null) {
    opts.contentType = 'application/json';
    opts.payload = JSON.stringify(body);
  }
  const response = UrlFetchApp.fetch(url, opts);
  const status = response.getResponseCode();
  const text = response.getContentText();
  let parsed = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch (e) { parsed = { raw: text }; }
  }
  if (status < 200 || status >= 300) {
    throw new GitHubError(status, parsed);
  }
  return { status: status, body: parsed, headers: response.getAllHeaders() };
}

function _parseNextLink(headers) {
  const link = headers && (headers.Link || headers.link);
  if (!link) return null;
  const parts = String(link).split(',');
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i].match(/<([^>]+)>\s*;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

function listRepos() {
  const results = [];
  let path = '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member';
  while (path) {
    const res = _request('get', path, null);
    const page = res.body || [];
    for (let i = 0; i < page.length; i++) {
      const r = page[i];
      results.push({
        providerType: 'github',
        owner: r.owner && r.owner.login,
        name: r.name,
        fullName: r.full_name,
        private: !!r.private,
        defaultBranch: r.default_branch,
      });
    }
    path = _parseNextLink(res.headers);
  }
  return results;
}

function listBranches(owner, repo) {
  const results = [];
  let path = '/repos/' + owner + '/' + repo + '/branches?per_page=100';
  while (path) {
    const res = _request('get', path, null);
    const page = res.body || [];
    for (let i = 0; i < page.length; i++) {
      const b = page[i];
      results.push({
        name: b.name,
        sha: b.commit && b.commit.sha,
        protected: !!b.protected,
      });
    }
    path = _parseNextLink(res.headers);
  }
  return results;
}

function listCommits(owner, repo, branch, perPage) {
  const n = Math.max(1, Math.min(perPage || 50, 100));
  const path = '/repos/' + owner + '/' + repo + '/commits' +
    '?sha=' + encodeURIComponent(branch) +
    '&per_page=' + n;
  const res = _request('get', path, null);
  const page = res.body || [];
  const out = [];
  for (let i = 0; i < page.length; i++) {
    const c = page[i];
    const commit = c.commit || {};
    const a = commit.author || {};
    out.push({
      sha: c.sha,
      message: commit.message || '',
      author: a.name || (c.author && c.author.login) || '',
    });
  }
  return out;
}

function getCommit(owner, repo, sha) {
  const res = _request('get', '/repos/' + owner + '/' + repo + '/git/commits/' + sha, null);
  const b = res.body;
  return {
    sha: b.sha,
    treeSha: b.tree && b.tree.sha,
    message: b.message,
    parents: (b.parents || []).map(function (p) { return p.sha; }),
  };
}

function createBlob(owner, repo, content) {
  const res = _request('post', '/repos/' + owner + '/' + repo + '/git/blobs', {
    content: content,
    encoding: 'utf-8',
  });
  return { sha: res.body.sha };
}

function createTree(owner, repo, baseTreeSha, entries) {
  const payload = { tree: entries };
  if (baseTreeSha) payload.base_tree = baseTreeSha;
  const res = _request('post', '/repos/' + owner + '/' + repo + '/git/trees', payload);
  return { sha: res.body.sha };
}

function createCommit(owner, repo, message, treeSha, parentSha) {
  const payload = {
    message: message,
    tree: treeSha,
    parents: parentSha ? [parentSha] : [],
  };
  const res = _request('post', '/repos/' + owner + '/' + repo + '/git/commits', payload);
  return { sha: res.body.sha };
}

function updateRef(owner, repo, branch, sha) {
  const res = _request('patch', '/repos/' + owner + '/' + repo + '/git/refs/heads/' + encodeURIComponent(branch), {
    sha: sha,
    force: false,
  });
  return { sha: res.body.object && res.body.object.sha };
}
