import { render, screen } from '@testing-library/react';
import { Mock } from 'vitest';
import { INTRO_MESSAGE, Messages } from './Messages';

import {
  useMessageHistoryStore,
} from '../../../stores';

vi.mock('../../../stores', () => ({
  useMessageHistoryStore: vi.fn(),
  useHasTokenGenerationInProgress: vi.fn(),
}));


describe('Messages Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders messages from history', () => {
    const history = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    (useMessageHistoryStore as Mock).mockImplementation(() => {
      return [history];
    });

    render(<Messages />);

    // Messages with role 'user' and 'assistant' should be rendered
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();

    // Messages with role 'system' should not be rendered
    expect(screen.queryByText('System message')).not.toBeInTheDocument();
  });

  it('renders the INTRO_MESSAGE as a StaticMessage', () => {
    (useMessageHistoryStore as Mock).mockImplementation(() => {
      return [[{ role: 'system', content: 'system' }]];
    });

    render(<Messages />);

    // Check that the INTRO_MESSAGE is rendered
    expect(screen.getByText(INTRO_MESSAGE)).toBeInTheDocument();

    expect(screen.queryByText(/system/)).not.toBeInTheDocument();
  });

  it('skips tool call related messages', () => {
    const history = [
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

    (useMessageHistoryStore as Mock).mockImplementation(() => {
      return [history];
    });

    render(<Messages />);

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
