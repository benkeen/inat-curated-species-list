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

export const validateBaselineSpecies = () => {
  return fetch(getApiUrl('validate-baseline-species'));
};

export const getCuratorReviewCount = (taxonId: number) => {
  return fetch(getApiUrl(`curator-review-count/${taxonId}`));
};
