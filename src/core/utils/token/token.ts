import { v4 as uuidv4 } from 'uuid';

export const IDKEY = 'id';

export const USE_LITELLM_TOKEN =
  import.meta.env.VITE_FEAT_USE_LITELLM_TOKEN === 'true';

/**
 * Retrieves an ID from the specified storage (localStorage or sessionStorage).
 * If no ID exists, a new UUID is generated, stored, and returned.
 *
 * @param {Storage} storage - The storage object (localStorage or sessionStorage).
 * @returns {string} The retrieved or newly generated ID.
 */
export function getIDFromStorage(storage: Storage) {
  let id = '';
  try {
    const clientId = storage.getItem(IDKEY);
    if (clientId) {
      id = clientId;
    } else {
      id = uuidv4();
      storage.setItem(IDKEY, id);
    }
  } catch (err) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
    // It is very rare but possible that localStorage or sessionStorage access fails.
    // In that case, we fall back to an in-memory solution.
    if (!id) id = uuidv4();
    console.log(err);
  }
  return id;
}

/**
 * Generates or returns token by combining uuids from localStorage and sessionStorage.
 * @returns {string} The token in the format "kavachat:{clientID}:{sessionID}".
 */
export function getToken() {
  if (USE_LITELLM_TOKEN) {
    // using LiteLLM service account token here is no different from a security standpoint
    // form having an unauthenticated endpoint. the benefit here is we could rotate the key
    // on deployment. When the need arises, we can implement custom auth middleware and fetch
    // the token here.
    return import.meta.env.VITE_LITELLM_API_KEY;
  }
  const clientToken = getIDFromStorage(window.localStorage);
  const sessionToken = getIDFromStorage(window.sessionStorage);
  return `kavachat:${clientToken}:${sessionToken}`;
}
