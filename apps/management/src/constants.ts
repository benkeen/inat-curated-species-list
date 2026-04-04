// bump this anytime you roll out changes to the store, it'll ensure redux-persist purges anything in local storage
// TODO... this should actually get bumped anytime the flatfiles are changed too
export const APP_STATE_VERSION = 3;

export const API_PORT = 3000;
export const INAT_API_BASE_URL = 'https://api.inaturalist.org/v1';
export const INAT_SPECIES_URL = 'https://www.inaturalist.org/taxa';
