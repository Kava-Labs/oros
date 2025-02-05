import { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/index';

export const useSummarizeChat = (
  client: OpenAI,
  messages: ChatCompletionMessageParam[],
): string => {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!messages?.length) return;

    const generateSummary = async () => {
      const initialMessages = messages.slice(0, 3);

      try {
        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Generate a brief, descriptive title (max 60 chars) for this chat based on the first user message.',
            },
            ...initialMessages,
          ],
        });

        setSummary(completion.choices[0].message.content as string);
      } catch (error) {
        console.error('Error generating summary:', error);
        const firstMessage = initialMessages.find(
          (m) => m.role === 'user',
        )?.content;
        setSummary(firstMessage?.slice(0, 57) + '...' || 'New Chat');
      }
    };

    generateSummary();
  }, [messages, client]);

  return summary;
};
