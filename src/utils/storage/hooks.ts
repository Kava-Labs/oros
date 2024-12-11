import { selectMessageHistory } from '../../stores';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { LocalStorage } from './index';
import { ChatCompletionMessageParam } from 'openai/resources/index';

const storage = new LocalStorage<{ messages: ChatCompletionMessageParam[] }>(
  'chat-messages',
  {
    messages: [],
  },
);
export const useSelectMessageHistory = () => {
  const msgHistory = useSelector(selectMessageHistory);

  useEffect(() => {
    storage.write({
      messages: msgHistory,
    });
  }, [msgHistory]);

  return msgHistory;
};
