import { renderHook } from '@testing-library/react';
import { vi, MockInstance } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useSession, sessionUrl } from './useSession';

// MSW handler for GET /session
const getSessionHandler = http.get(
  sessionUrl,
  () => new HttpResponse(null, { status: 204 }),
);
const postHeartbeatHandler = http.post(
  sessionUrl,
  () => new HttpResponse(null, { status: 204 }),
);

const server = setupServer(getSessionHandler, postHeartbeatHandler);

const setupSessionHook = () => {
  return renderHook(() => useSession());
};

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

const advanceMinutesAndMs = (minutes: number, ms: number = 0) => {
  vi.advanceTimersByTime(minutes * 60 * 1000 + ms);
};

describe('useSession', () => {
  let fetchSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchSpy.mockRestore();
  });

  it('does not perform session tracking when GET /session fails on mount', () => {
    server.use(
      http.get(sessionUrl, () => new HttpResponse(null, { status: 500 })),
      http.post(sessionUrl, () => new HttpResponse(null, { status: 500 })),
    );

    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledWith(sessionUrl, expect.any(Object));

    advanceMinutesAndMs(5);
    window.dispatchEvent(new Event('click'));

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls GET /session once on mount', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );

    expect(fetchSpy).not.toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not call GET /session again if no user interaction occurs after 5 minutes', () => {
    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    advanceMinutesAndMs(6);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  describe.each([
    ['click'],
    ['scroll'],
    ['keydown'],
    ['mousemove'],
    ['wheel'],
    ['touchstart'],
  ])('useSession - throttle behavior on %s', (eventType) => {
    it(`calls GET /session on ${eventType} after 5 minutes`, () => {
      setupSessionHook();

      expect(fetchSpy).toHaveBeenCalledWith(
        sessionUrl,
        expect.objectContaining({ method: 'GET' }),
      );

      advanceMinutesAndMs(4);
      window.dispatchEvent(new Event(eventType));
      expect(fetchSpy).not.toHaveBeenCalledWith(
        sessionUrl,
        expect.objectContaining({ method: 'POST' }),
      );

      advanceMinutesAndMs(1, 1);
      window.dispatchEvent(new Event(eventType));

      expect(fetchSpy).toHaveBeenCalledWith(
        sessionUrl,
        expect.objectContaining({ method: 'POST' }),
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'GET' }),
    );

    advanceMinutesAndMs(1);
    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('wheel'));
    window.dispatchEvent(new Event('touchstart'));

    expect(fetchSpy).not.toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    advanceMinutesAndMs(4, 1);
    window.dispatchEvent(new Event('keydown'));

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'GET' }),
    );

    advanceMinutesAndMs(4);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).not.toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    advanceMinutesAndMs(1, 1);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throttles GET /session on visibilitychange to visible within 5 minutes of last call', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    advanceMinutesAndMs(2);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('calls fetch with keepalive on visibilitychange to hidden', () => {
    setupSessionHook();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      }),
    );
  });

  it('calls fetch with keepalive on pagehide', () => {
    setupSessionHook();

    window.dispatchEvent(new Event('pagehide'));

    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      }),
    );
  });
});
