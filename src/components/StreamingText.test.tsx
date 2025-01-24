import { render, screen, act } from '@testing-library/react';
import { StreamingText } from './StreamingText';
import { TextStreamStore } from '../textStreamStore';

describe('StreamingText', () => {
  it('renders with the initial snapshot of the store', () => {
    const store = new TextStreamStore();
    store.setText('Initial Text');

    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span data-testid="output">{text}</span>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('Initial Text');
  });

  it('updates when the store text changes via setText', () => {
    const store = new TextStreamStore();
    store.setText('Initial');

    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span data-testid="output">{text}</span>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('Initial');

    act(() => {
      store.setText('Updated');
    });

    expect(screen.getByTestId('output')).toHaveTextContent('Updated');
  });

  it('updates when the store text changes via appendText', () => {
    const store = new TextStreamStore();
    store.setText('Hello');

    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span data-testid="output">{text}</span>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('Hello');

    act(() => {
      store.appendText(' World');
    });

    expect(screen.getByTestId('output')).toHaveTextContent('Hello World');
  });

  it('displays empty content if the store is empty', () => {
    const store = new TextStreamStore();
    // No setText called, so it should be an empty string
    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span data-testid="output">{text}</span>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('');
  });

  it('handles multiple updates in quick succession', () => {
    const store = new TextStreamStore();
    store.setText('Initial');

    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span data-testid="output">{text}</span>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('Initial');

    act(() => {
      store.setText('Update 1');
      store.appendText(' + Update 2');
      store.setText('Update 3');
    });

    expect(screen.getByTestId('output')).toHaveTextContent('Update 3');
  });

  it('allows custom formatting via children prop', () => {
    const store = new TextStreamStore();
    store.setText('Hello');

    render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <strong data-testid="output">**{text}**</strong>}
      </StreamingText>,
    );

    expect(screen.getByTestId('output')).toHaveTextContent('**Hello**');

    act(() => {
      store.setText('World');
    });

    expect(screen.getByTestId('output')).toHaveTextContent('**World**');
  });

  it('cleans up subscription on unmount', () => {
    const store = new TextStreamStore();
    const unsubscribeSpy = vi.fn();

    // Spy on the subscribe method to capture the returned unsubscribe function
    const originalSubscribe = store.subscribe.bind(store);
    store.subscribe = (listener) => {
      const unsubscribe = originalSubscribe(listener);
      return () => {
        unsubscribe();
        unsubscribeSpy();
      };
    };

    const { unmount } = render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {(text) => <span>{text}</span>}
      </StreamingText>,
    );

    // Unmount the component and ensure unsubscribe was called
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not update after unmount even if store changes', () => {
    const store = new TextStreamStore();
    store.setText('Initial');
    const renderFn = vi.fn((text: string) => <span>{text}</span>);

    const { unmount } = render(
      <StreamingText store={store} onRendered={vi.fn()}>
        {renderFn}
      </StreamingText>,
    );

    expect(renderFn).toHaveBeenCalledTimes(1);

    unmount();

    // Update the store after unmount
    act(() => {
      store.setText('Updated After Unmount');
    });

    // Since the component is unmounted, no re-render should occur
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  it('should not re-render the parent when the store updates', () => {
    const store = new TextStreamStore();
    store.setText('Initial');

    // We'll track how many times the parent renders.
    // Using a ref-like variable outside the component so we can expect it later.
    let parentRenderCount = 0;

    const Parent: React.FC = () => {
      parentRenderCount++;
      return (
        <div data-testid="parent">
          <StreamingText store={store} onRendered={vi.fn()}>
            {(text) => <span data-testid="child">{text}</span>}
          </StreamingText>
          ,
        </div>
      );
    };

    render(<Parent />);

    // After initial render:
    expect(parentRenderCount).toBe(1);
    expect(screen.getByTestId('child')).toHaveTextContent('Initial');

    act(() => {
      store.setText('Updated');
    });

    // The child text should have updated
    expect(screen.getByTestId('child')).toHaveTextContent('Updated');
    // Check the parent's render count
    expect(parentRenderCount).toBe(1);
  });
});
