import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from './PromptInput';
import { createStore } from '../../../stores';
import { AppContextProvider } from '../../../contexts/AppContext';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

describe('PromptInput Component', () => {
  const mockSubmitUserMessage = vi.fn();
  const mockCancelStream = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders input field and submit button', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    expect(
      screen.getByPlaceholderText('Enter your prompt here...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    const inputElement = screen.getByPlaceholderText(
      'Enter your prompt here...',
    ) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: 'Hello' } });
    expect(inputElement.value).toBe('Hello');
  });

  it('calls submitUserMessage on form submit and clears input', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    const inputElement = screen.getByPlaceholderText(
      'Enter your prompt here...',
    ) as HTMLInputElement;
    const formElement = screen.getByRole('form');

    fireEvent.change(inputElement, { target: { value: 'Test message' } });
    fireEvent.submit(formElement);

    expect(mockSubmitUserMessage).toHaveBeenCalledWith('Test message');
    expect(inputElement.value).toBe('');
  });

  it('calls cancelStream when cancel button is clicked', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={mockCancelStream}
        />
      </AppContextProvider>,
    );

    const buttonElement = screen.getByText('Cancel');
    fireEvent.click(buttonElement);

    expect(mockCancelStream).toHaveBeenCalled();
    expect(mockSubmitUserMessage).not.toHaveBeenCalled();
  });

  it('calls submitUserMessage when submit button is clicked and input is not empty', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    const inputElement = screen.getByPlaceholderText(
      'Enter your prompt here...',
    ) as HTMLInputElement;
    const buttonElement = screen.getByText('Submit');

    fireEvent.change(inputElement, { target: { value: 'Hello' } });
    fireEvent.click(buttonElement);

    expect(mockSubmitUserMessage).toHaveBeenCalledWith('Hello');
    expect(inputElement.value).toBe('');
  });

  it('does not call submitUserMessage when input is empty', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    const buttonElement = screen.getByText('Submit');

    fireEvent.click(buttonElement);

    expect(mockSubmitUserMessage).not.toHaveBeenCalled();
  });

  it('renders Cancel button when cancelStream is provided', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={() => {}}
        />
      </AppContextProvider>,
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Submit button when cancelStream is null', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('disables the Submit button when there is a tool_call in progress', () => {
    render(
      <AppContextProvider
        streamingMessageStore={createStore<string>('')}
        messageHistoryStore={createStore<ChatCompletionMessageParam[]>([
          { role: 'system', content: 'the system prompt' },
          { role: 'user', content: 'tool_call' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                type: 'function',
                function: { name: '', arguments: '' },
                id: '',
              },
            ],
          },
        ])}
      >
        <PromptInput
          submitUserMessage={mockSubmitUserMessage}
          cancelStream={null}
        />
      </AppContextProvider>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
