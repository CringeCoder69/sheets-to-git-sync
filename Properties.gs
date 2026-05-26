const PROP_PAT = 'pat';
const PROP_PROVIDER_TYPE = 'providerType';
const PROP_REPO_OWNER = 'repoOwner';
const PROP_REPO_NAME = 'repoName';

function getPat() {
  return PropertiesService.getUserProperties().getProperty(PROP_PAT);
}

function setPat(pat) {
  PropertiesService.getUserProperties().setProperty(PROP_PAT, pat);
}

function clearPat() {
  PropertiesService.getUserProperties().deleteProperty(PROP_PAT);
}

function getRepoBinding() {
  const props = PropertiesService.getDocumentProperties();
  const providerType = props.getProperty(PROP_PROVIDER_TYPE);
  const owner = props.getProperty(PROP_REPO_OWNER);
  const name = props.getProperty(PROP_REPO_NAME);
  if (!providerType || !owner || !name) return null;
  return { providerType, owner, name };
}

function setRepoBinding(binding) {
  PropertiesService.getDocumentProperties().setProperties({
    [PROP_PROVIDER_TYPE]: binding.providerType,
    [PROP_REPO_OWNER]: binding.owner,
    [PROP_REPO_NAME]: binding.name,
  });
}

function clearRepoBinding() {
  const props = PropertiesService.getDocumentProperties();
  props.deleteProperty(PROP_PROVIDER_TYPE);
  props.deleteProperty(PROP_REPO_OWNER);
  props.deleteProperty(PROP_REPO_NAME);
}
