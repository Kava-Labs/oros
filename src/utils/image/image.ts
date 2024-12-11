import OpenAI from 'openai';
import { getToken } from '../token/token';
import { saveImage } from '../idb/idb';

export type GenerateImageParams = {
  prompt: string;
};

export type GenerateImageResponse = { id: string; message: string };

export const generateImage = async ({
  prompt,
}: GenerateImageParams): Promise<GenerateImageResponse> => {
  const client = new OpenAI({
    baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
    apiKey: getToken(),
    dangerouslyAllowBrowser: true,
  });

  const res = await client.images.generate({
    model: 'dall-e-2',
    prompt,
    response_format: 'b64_json',
  });

  const b64ImageData = res.data[0].b64_json!;

  const id = await saveImage(b64ImageData);

  return {
    id,
    message:
      'success: the image is now visible to the user, respond with max 2 sentences describing the prompt used to generate the image',
  };
};
