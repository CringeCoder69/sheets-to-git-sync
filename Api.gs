function _ok(data) {
  return { ok: true, data: data || {} };
}

function _fail(code, message) {
  return { ok: false, error: { code, message } };
}

function _wrap(fn) {
  try {
    return _ok(fn());
  } catch (e) {
    if (e && e.name === 'GitHubError') {
      return _fail('GitHubError', e.message);
    }
    if (e && e.name === 'AppError' && e.code) {
      return _fail(e.code, e.message || e.code);
    }
    return _fail('Unexpected', (e && e.message) || String(e));
  }
}

function apiBootstrap() {
  return _wrap(function () {
    return {
      hasPat: !!getPat(),
      repoBinding: getRepoBinding(),
    };
  });
}

function apiSavePat(pat) {
  return _wrap(function () {
    const trimmed = (pat || '').trim();
    if (!trimmed) throw { name: 'AppError', message: 'PAT is empty', code: 'EmptyPat' };
    setPat(trimmed);
    return {};
  });
}

function apiClearPat() {
  return _wrap(function () {
    clearPat();
    return {};
  });
}

function apiListRepos() {
  return _wrap(function () {
    if (!getPat()) throw { name: 'AppError', message: 'PAT is not set', code: 'NoPat' };
    return { repos: listRepos() };
  });
}

function apiBindRepo(req) {
  return _wrap(function () {
    const owner = req && typeof req.owner === 'string' ? req.owner.trim() : '';
    const name = req && typeof req.name === 'string' ? req.name.trim() : '';
    if (!owner || !name) throw { name: 'AppError', message: 'owner and name are required', code: 'BadInput' };
    setRepoBinding({ providerType: 'github', owner, name });
    return {};
  });
}

function apiUnbindRepo() {
  return _wrap(function () {
    clearRepoBinding();
    return {};
  });
}

function apiListBranches() {
  return _wrap(function () {
    if (!getPat()) throw { name: 'AppError', message: 'PAT is not set', code: 'NoPat' };
    const binding = getRepoBinding();
    if (!binding) throw { name: 'AppError', message: 'Repo not bound', code: 'NoBinding' };
    return { branches: listBranches(binding.owner, binding.name) };
  });
}

function apiCommit(req) {
  return _wrap(function () {
    if (!getPat()) throw { name: 'AppError', message: 'PAT is not set', code: 'NoPat' };
    const binding = getRepoBinding();
    if (!binding) throw { name: 'AppError', message: 'Repo not bound', code: 'NoBinding' };
    const branch = req && typeof req.branch === 'string' ? req.branch.trim() : '';
    const message = req && typeof req.message === 'string' ? req.message.trim() : '';
    const expectedParentSha = req && typeof req.expectedParentSha === 'string' ? req.expectedParentSha.trim() : '';
    if (!branch) throw { name: 'AppError', message: 'branch is required', code: 'BadInput' };
    if (!message) throw { name: 'AppError', message: 'commit message is required', code: 'BadInput' };
    if (!expectedParentSha) throw { name: 'AppError', message: 'expectedParentSha is required', code: 'BadInput' };
    return commitSnapshot({
      owner: binding.owner,
      repo: binding.name,
      branch: branch,
      expectedParentSha: expectedParentSha,
      message: message,
    });
  });
}

function apiGetGraph(req) {
  return _wrap(function () {
    if (!getPat()) throw { name: 'AppError', message: 'PAT is not set', code: 'NoPat' };
    const binding = getRepoBinding();
    if (!binding) throw { name: 'AppError', message: 'Repo not bound', code: 'NoBinding' };
    return getCommitGraph({ owner: binding.owner, repo: binding.name });
  });
}

function apiCheckout(req) {
  return _wrap(function () {
    if (!getPat()) throw { name: 'AppError', message: 'PAT is not set', code: 'NoPat' };
    const binding = getRepoBinding();
    if (!binding) throw { name: 'AppError', message: 'Repo not bound', code: 'NoBinding' };
    const ref = req && typeof req.ref === 'string' ? req.ref.trim() : '';
    if (!ref) throw { name: 'AppError', message: 'ref is required', code: 'BadInput' };
    return checkoutCommit({ owner: binding.owner, repo: binding.name, ref: ref });
  });
}
