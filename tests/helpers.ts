import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const PROXY_ENDPOINT = process.env.PROXY_ENDPOINT;
const BYPASS_PROXY = process.env.BYPASS_PROXY === 'true';

export function createOpenApiClient(): OpenAI {
  //  This random key is used by our proxy API for tracing and logging
  //  It is NOT our real, secure OpenAI Key
  const sessionAPIKey = `kavachat:${uuidv4()}:${uuidv4()}`;

  if (BYPASS_PROXY) {
    return new OpenAI();
  }

  return new OpenAI({
    apiKey: sessionAPIKey,
    baseURL: PROXY_ENDPOINT ?? 'http://localhost:5555/openai/v1',
  });
}
