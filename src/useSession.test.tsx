import { renderHook } from '@testing-library/react';
import { vi, MockInstance } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useSession } from './useSession';

// MSW handler for GET /session
const sessionHandler = vi.fn((_req) => {
  return new HttpResponse(null, { status: 204 });
});

const setupSessionHook = () => {
  return renderHook(() => useSession());
};

const server = setupServer(http.get('/session', sessionHandler));

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  sessionHandler.mockClear();
});
afterAll(() => server.close());

const advanceMinutesAndMs = (minutes: number, ms: number = 0) => {
  vi.advanceTimersByTime(minutes * 60 * 1000 + ms);
};

describe('useSession', () => {
  let fetchSpy: MockInstance;
  let beaconSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();

    fetchSpy = vi.spyOn(globalThis, 'fetch');

    // Define navigator.sendBeacon if not present
    if (typeof navigator.sendBeacon !== 'function') {
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        configurable: true,
        value: vi.fn(() => true),
      });
    }

    // Now that it's defined, spy on it
    beaconSpy = vi.spyOn(navigator, 'sendBeacon');
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchSpy.mockRestore();
    beaconSpy.mockRestore();
  });

  it('does not perform session tracking when GET /session fails on mount', () => {
    // Override the MSW handler to simulate API failure
    server.use(
      http.get('/session', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    // Mount the hook – this will try the initial GET /session
    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledWith('/session', expect.any(Object));
    expect(beaconSpy).not.toHaveBeenCalled();

    // Simulate interaction to verify no side effects occur
    advanceMinutesAndMs(5);
    window.dispatchEvent(new Event('click'));

    // Still no beacon activity — session tracking failed gracefully
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it('calls GET /session once on mount', () => {
    setupSessionHook();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/session',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('does not call GET /session again if no user interaction occurs after 5 minutes', () => {
    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 6 minutes — no interaction
    advanceMinutesAndMs(6);

    // Still only 1 call should have happened
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // Core interaction events
  /**
   * wheel is used for tracking mouse wheel scrolls
   * touchstart is used to track mobile scrolling
   */
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

      // Initial call on mount
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Advance time to just under 5 minutes
      advanceMinutesAndMs(4);
      window.dispatchEvent(new Event(eventType));

      // Should still be just the initial call
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Advance to just past 5 minutes total
      advanceMinutesAndMs(1, 1);
      window.dispatchEvent(new Event(eventType));

      // Now the second call should happen
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    setupSessionHook();
    // Initial call on mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // Advance a safe amount — 1 minute
    advanceMinutesAndMs(1);
    // Trigger multiple different events
    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('wheel'));
    // Still within 5-minute window — no additional call should happen
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    advanceMinutesAndMs(4, 1); // total = 5:00.001 since initial
    window.dispatchEvent(new Event('keydown'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // Visibility triggers
  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    setupSessionHook();

    // Initial mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance time < 5 minutes
    advanceMinutesAndMs(4);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance to pass 5 minutes
    advanceMinutesAndMs(1, 1); // total = 5:00.001 since initial
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throttles GET /session on visibilitychange to visible within 5 minutes of last call', () => {
    setupSessionHook();

    // Initial call on mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Simulate visibilitychange before 5 minutes
    advanceMinutesAndMs(2);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Still within throttle window
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // Beacon-based session end
  it('calls navigator.sendBeacon on visibilitychange to hidden', () => {
    setupSessionHook();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(beaconSpy).toHaveBeenCalledWith('/session');
  });

  it('calls navigator.sendBeacon on pagehide', () => {
    setupSessionHook();

    window.dispatchEvent(new Event('pagehide'));
    expect(beaconSpy).toHaveBeenCalledWith('/session');
  });
});
