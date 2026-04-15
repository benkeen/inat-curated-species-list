import { API_PORT } from '../constants';

export const getApiUrl = (path: string) => {
  return `http://localhost:${API_PORT}/${path}`;
};

export const getMainConfig = () => {
  return fetch(getApiUrl('backup-settings'));
};

export const updateMainConfig = (content: any) => {
  return fetch(getApiUrl('backup-settings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
};

export const getMainSettings = () => {
  return fetch(getApiUrl('project-settings'));
};

export const updateMainSettings = (content: any) => {
  return fetch(getApiUrl('project-settings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
};

export const getBaselineSpecies = () => {
  return fetch(getApiUrl('baseline-species'));
};

export const updateBaselineSpecies = (content: any) => {
  return fetch(getApiUrl('baseline-species'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
};

export const appendBaselineSpecies = (content: any) => {
  return fetch(getApiUrl('baseline-species/append'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
};

export const validateBaselineSpecies = () => {
  return fetch(getApiUrl('validate-baseline-species'));
};

export const getCuratorReviewCount = (taxonId: number) => {
  return fetch(getApiUrl(`curator-review-count/${taxonId}`));
};

export const generateCuratorSummary = () => {
  return fetch(getApiUrl('generate-curator-summary'), { method: 'POST' });
};

export const getNewAdditionsData = () => {
  return fetch(getApiUrl('new-additions-data'));
};

export const getSpeciesData = () => {
  return fetch(getApiUrl('species-data'));
};

export const getTaxonChangesData = () => {
  return fetch(getApiUrl('taxon-changes-data'));
};

export const getUnconfirmedSpecies = () => {
  return fetch(getApiUrl('unconfirmed-species'));
};

export const removeUnconfirmedSpecies = (taxonId: string) => {
  return fetch(getApiUrl(`unconfirmed-species/${taxonId}`), { method: 'DELETE' });
};

export const startUnconfirmedSpeciesCheck = () => {
  return fetch(getApiUrl('start-unconfirmed-species-check'), { method: 'POST' });
};

export const getNewAdditionsSettings = () => {
  return fetch(getApiUrl('new-additions-settings'));
};

export const updateNewAdditionsSettings = (content: { enabled: boolean }) => {
  return fetch(getApiUrl('new-additions-settings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
};

export const getTaxonChangesSettings = () => {
  return fetch(getApiUrl('taxon-changes-settings'));
};

export const updateTaxonChangesSettings = (content: { enabled: boolean }) => {
  return fetch(getApiUrl('taxon-changes-settings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
};

export const generateCuratedSpecies = () => {
  return fetch(getApiUrl('generate-curated-species'), { method: 'POST' });
};

export const getCuratedSpeciesData = () => {
  return fetch(getApiUrl('curated-species'));
};
