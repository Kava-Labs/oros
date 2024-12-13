import React from 'react';
import { render, screen } from '@testing-library/react';
import { Mock } from 'vitest';
import { StreamingMessage } from './StreamingMessage';
import { useStreamingMessageStore } from '../../../stores';

vi.mock('../../../stores', () => ({
  useStreamingMessageStore: vi.fn(),
}));

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
    (useStreamingMessageStore as Mock).mockImplementation(() => {
      return [''];
    });

    const chatContainerRef = React.createRef<HTMLDivElement>();

    const { container } = render(
      <StreamingMessage chatContainerRef={chatContainerRef} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders content with parsed markdown', () => {
    const content = 'Streaming content';

    (useStreamingMessageStore as Mock).mockImplementation(() => {
      return [content];
    });

    const chatContainerRef = React.createRef<HTMLDivElement>();
    render(<StreamingMessage chatContainerRef={chatContainerRef} />);

    // Verify that the content is rendered parsed
    expect(screen.getByText(`parsed: ${content}`)).toBeInTheDocument();
  });
});
