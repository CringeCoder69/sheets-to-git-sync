const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

function GitHubError(status, body) {
  this.name = 'GitHubError';
  this.status = status;
  this.body = body;
  this.message = 'GitHub ' + status + ': ' + (body && body.message ? body.message : 'request failed');
}
GitHubError.prototype = Object.create(Error.prototype);

function _request(method, url) {
  const pat = getPat();
  const response = UrlFetchApp.fetch(url, {
    method: method,
    headers: {
      'Authorization': 'token ' + pat,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    muteHttpExceptions: true,
    followRedirects: true,
  });
  const status = response.getResponseCode();
  const text = response.getContentText();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
  }
  if (status < 200 || status >= 300) {
    throw new GitHubError(status, body);
  }
  return { status, body, headers: response.getAllHeaders() };
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
  let url = GITHUB_API + '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member';
  while (url) {
    const res = _request('get', url);
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
    url = _parseNextLink(res.headers);
  }
  return results;
}
