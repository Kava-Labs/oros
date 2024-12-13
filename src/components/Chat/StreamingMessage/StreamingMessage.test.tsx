import React from 'react';
import { render, screen } from '@testing-library/react';
import { StreamingMessage } from './StreamingMessage';
import { createStore } from '../../../stores';
import { AppContextProvider } from '../../../contexts/AppContext';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

vi.mock('marked', () => ({
  marked: {
    parse: vi.fn((content) => `parsed: ${content}`),
  },
}));

describe('StreamingMessage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('returns null when content is empty', () => {
    const chatContainerRef = React.createRef<HTMLDivElement>();

    const { container } = render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <StreamingMessage chatContainerRef={chatContainerRef} />
      </AppContextProvider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders content with parsed markdown', () => {
    const content = 'Streaming content';

    const chatContainerRef = React.createRef<HTMLDivElement>();
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>(content)}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <StreamingMessage chatContainerRef={chatContainerRef} />
      </AppContextProvider>,
    );

    // Verify that the content is rendered parsed
    expect(screen.getByText(`parsed: ${content}`)).toBeInTheDocument();
  });
});
