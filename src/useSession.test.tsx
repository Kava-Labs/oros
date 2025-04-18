import { renderHook } from '@testing-library/react';
import { vi, MockInstance } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  useSession,
  sessionUrl,
  buildSessionUrlWithQueryParams,
  resetLandingPageUrlQueryParams,
} from './useSession';

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

const MOCK_RAILS_URL = 'http://localhost:3000/session';
const MOCK_ROOT_APP_URL = 'https://chat.kava.io';
const LANDING_URL = MOCK_ROOT_APP_URL + '?utm_source=twitter&utm_campaign=test';
const REFERRER_URL = 'https://referrer.com/some/path';

const setupSessionHook = () => {
  return renderHook(() => useSession());
};

const advanceMinutesAndMs = (minutes: number, ms: number = 0) => {
  vi.advanceTimersByTime(minutes * 60 * 1000 + ms);
};

beforeAll(() => server.listen());
afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

describe('useSession', () => {
  let fetchSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    // Simulate a local, same-origin URL so replaceState doesn't throw
    window.history.pushState({}, '', '?utm_source=twitter&utm_campaign=test');
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

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.any(Object),
    );

    advanceMinutesAndMs(5);
    window.dispatchEvent(new Event('click'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls GET /session once on mount', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends GET /session without query params if none are present', () => {
    Object.defineProperty(document, 'referrer', {
      value: '',
      configurable: true,
    });

    const expectedUrl = buildSessionUrlWithQueryParams(
      MOCK_RAILS_URL,
      window.location.href,
      'null',
    );

    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      expectedUrl,
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

  it('sends GET /session with landing_page_url and referrer_url as query params and resets the url', () => {
    const pushSpy = vi.spyOn(window.history, 'replaceState');
    const queryParams = '/?utm_source=twitter&utm_campaign=test';
    window.history.pushState({}, '', queryParams);
    const campaignUrl = window.location.href + queryParams;

    Object.defineProperty(document, 'referrer', {
      value: REFERRER_URL,
      configurable: true,
    });

    const expectedUrl = buildSessionUrlWithQueryParams(
      MOCK_RAILS_URL,
      window.location.href,
      REFERRER_URL,
    );

    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );

    expect(fetchSpy).not.toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    const cleaned = resetLandingPageUrlQueryParams(campaignUrl);
    expect(pushSpy).toHaveBeenCalledWith({}, '', cleaned);
    expect(cleaned).toBe(window.location.href);
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
        expect.stringContaining(sessionUrl),
        expect.objectContaining({ method: 'GET' }),
      );

      advanceMinutesAndMs(4);
      window.dispatchEvent(new Event(eventType));
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(sessionUrl),
        expect.objectContaining({ method: 'POST' }),
      );

      advanceMinutesAndMs(1, 1);
      window.dispatchEvent(new Event(eventType));

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(sessionUrl),
        expect.objectContaining({ method: 'POST' }),
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
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
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'POST' }),
    );

    advanceMinutesAndMs(4, 1);
    window.dispatchEvent(new Event('keydown'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'POST' }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'GET' }),
    );

    advanceMinutesAndMs(4);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
      expect.objectContaining({ method: 'POST' }),
    );

    advanceMinutesAndMs(1, 1);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(sessionUrl),
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

describe('buildSessionUrlWithQueryParams', () => {
  it('includes encoded landing_page_url and referrer_url', () => {
    const result = buildSessionUrlWithQueryParams(
      MOCK_RAILS_URL,
      LANDING_URL,
      REFERRER_URL,
    );

    expect(result).toContain(encodeURIComponent(LANDING_URL));
    expect(result).toContain(encodeURIComponent(REFERRER_URL));
  });

  it('uses "null" if referrer_url is missing', () => {
    const result = buildSessionUrlWithQueryParams(
      MOCK_RAILS_URL,
      LANDING_URL,
      'null',
    );
    expect(result).toContain('referrer_url=null');
  });
});

describe('resetLandingPageUrlQueryParams', () => {
  it('removes utm_* params but preserves others', () => {
    const dirtyUrl =
      'https://example.com?utm_source=twitter&utm_campaign=test&ref=abc&debug=true';
    const cleaned = resetLandingPageUrlQueryParams(dirtyUrl);
    expect(cleaned).toBe('https://example.com/?ref=abc&debug=true');
  });

  it('returns original url if no query params exist', () => {
    const url = 'https://example.com/';
    const cleaned = resetLandingPageUrlQueryParams(url);
    expect(cleaned).toBe(url);
  });
});
