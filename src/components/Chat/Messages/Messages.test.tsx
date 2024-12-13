import { render, screen } from '@testing-library/react';
import { INTRO_MESSAGE, Messages } from './Messages';
import { AppContextProvider } from '../../../contexts/AppContext';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { createStore } from '../../../stores';

describe('Messages Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders messages from history', () => {
    const history: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>(history)}
      >
        <Messages history={history} />
      </AppContextProvider>,
    );

    // Messages with role 'user' and 'assistant' should be rendered
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();

    // Messages with role 'system' should not be rendered
    expect(screen.queryByText('System message')).not.toBeInTheDocument();
  });

  it('renders the INTRO_MESSAGE as a StaticMessage', () => {
    const history: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'system' },
    ];
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>(history)}
      >
        <Messages history={history} />
      </AppContextProvider>,
    );

    // Check that the INTRO_MESSAGE is rendered
    expect(screen.getByText(INTRO_MESSAGE)).toBeInTheDocument();

    expect(screen.queryByText(/system/)).not.toBeInTheDocument();
  });

  it('skips tool call related messages', () => {
    const history: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'What is my balance?' },
      {
        content: null,
        role: 'assistant',
        function_call: null,
        tool_calls: [
          {
            id: 'call_4ntfprsIyMoTs9PZ1ThYbkFy',
            function: {
              name: 'getAccountBalances',
              arguments: '{"address":"mock-address"}',
            },
            type: 'function',
          },
        ],
      },
      {
        role: 'tool',
        content: '{"kava":"1000","hard":"34142"}',
        tool_call_id: 'call_4ntfprsIyMoTs9PZ1ThYbkFy',
      },
      {
        role: 'assistant',
        content: 'your balance is 1000 kava, and 34142 hard',
      },
    ];

    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>(history)}
      >
        <Messages history={history} />
      </AppContextProvider>,
    );

    expect(
      screen.queryByText('{"kava":"1000","hard":"34142"}'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('getAccountBalances')).not.toBeInTheDocument();

    expect(screen.queryByText('What is my balance?')).toBeInTheDocument();
    expect(
      screen.queryByText('your balance is 1000 kava, and 34142 hard'),
    ).toBeInTheDocument();
  });
});
