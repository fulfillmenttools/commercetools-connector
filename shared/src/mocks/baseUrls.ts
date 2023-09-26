import { readConfiguration } from '../utils';

export function ctApi(path: string) {
  return `https://api.${readConfiguration().region}.commercetools.com/${readConfiguration().projectKey}${path}`;
}

export function ctAuth() {
  return `https://auth.${readConfiguration().region}.commercetools.com/oauth/token`;
}

export function fftAuth() {
  return 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
}

export function fftApi(path: string) {
  return `https://${readConfiguration().fftProjectId}.api.fulfillmenttools.com/api${path}`;
}
