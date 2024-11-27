//  This test should not run in jsdom browser
// /**
//  * @vitest-environment node
//  */
import 'openai/shims/node'
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it } from 'vitest';

const PROXY_ENDPOINT= process.env.PROXY_ENDPOINT ?? "http://localhost:5555/openai/";
const API_KEY = process.env.VITE_OPENAI_API_KEY
// const BYPASS_PROXY = process.env.BYPASS_PROXY === 'true';
const BYPASS_PROXY = true;

function createOpenApiClient(): OpenAI {
  //  This random key is used by our proxy API for tracing and logging
  //  It is NOT our real, secure OpenAI Key
  const sessionAPIKey = `kavachat:${uuidv4()}:${uuidv4()}`;

  if (BYPASS_PROXY) {
    return new OpenAI({ apiKey: API_KEY })
  }

  return new OpenAI({
    apiKey: sessionAPIKey,
    baseURL: PROXY_ENDPOINT,
  });
}

describe('OpenAI Client', () => {
  it('non-streaming response with appropriate text is built from a user\'s prompt', async () => {
    const userPrompt = 'Say this is a test';
    const expectedContent = 'This is a test';
    const expectedRole = 'assistant';

    const client = createOpenApiClient();

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: userPrompt }],
      model: 'gpt-4o-mini',
    });

    const { id, choices } = chatCompletion;

    const responseMessage = choices[0].message;

    expect(id).toBeDefined();
    expect(choices).toHaveLength(1);
    //  use toMatch here because sometimes the model replies with additional text,
    //  like 'This is a test - how can I help you today?'
    expect(responseMessage.content).toMatch(expectedContent);
    expect(responseMessage.role).toStrictEqual(expectedRole);
  });

  it('streaming response assembles chunks into a response appropriate text', async () => {
    const userPrompt = 'Say this is a test';
    const expectedContent = 'This is a test';

    const client = createOpenApiClient();

    const chatStream = await client.chat.completions.create({
      messages: [{ role: 'user', content: userPrompt }],
      model: 'gpt-4o-mini',
      stream: true,
    });

    //  Use this string to assemble the chunks into a singular message
    let output = '';

    for await (const chunk of chatStream) {
      const { choices, id } = chunk;

      const responseMessage = choices[0].delta;

      expect(id).toBeDefined();
      expect(choices).toHaveLength(1);

      if (responseMessage.content) {
        output = output.concat(responseMessage.content);
      }
    }

    expect(output).toMatch(expectedContent);
  });
})

