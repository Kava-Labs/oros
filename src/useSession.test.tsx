import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useSession } from './useSession';

// MSW handler for GET /session
const sessionHandler = vi.fn((_req) => {
  return new HttpResponse(null, { status: 204 });
});

const server = setupServer(http.get('/session', sessionHandler));

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  sessionHandler.mockClear();
});
afterAll(() => server.close());

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'sendBeacon', {
      writable: true,
      value: vi.fn(() => true),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not perform session tracking when GET /session fails on mount', () => {
    // Override the MSW handler to simulate API failure
    server.use(
      http.get('/session', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const beaconSpy = vi.spyOn(navigator, 'sendBeacon');

    // Mount the hook – this will try the initial GET /session
    renderHook(() => useSession());
    expect(fetchSpy).toHaveBeenCalledWith('/session', expect.any(Object));
    expect(beaconSpy).not.toHaveBeenCalled();

    // Simulate interaction to verify no side effects occur
    vi.advanceTimersByTime(5 * 60 * 1000);
    window.dispatchEvent(new Event('click'));

    // Still no beacon activity — session tracking failed gracefully
    expect(beaconSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    beaconSpy.mockRestore();
  });

  it('calls GET /session once on mount', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderHook(() => useSession());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/session',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );

    fetchSpy.mockRestore();
  });

  it('does not call GET /session again if no user interaction occurs after 5 minutes', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderHook(() => useSession());
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 6 minutes — no interaction
    vi.advanceTimersByTime(6 * 60 * 1000);

    // Still only 1 call should have happened
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
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
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      renderHook(() => useSession());

      // Initial call on mount
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Advance time to just under 5 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);
      window.dispatchEvent(new Event(eventType));

      // Should still be just the initial call
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Advance to just past 5 minutes total
      vi.advanceTimersByTime(1 * 60 * 1000 + 1);
      window.dispatchEvent(new Event(eventType));

      // Now the second call should happen
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      fetchSpy.mockRestore();
    });
  });

  it('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => useSession());
    // Initial call on mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // Advance a safe amount — 1 minute
    vi.advanceTimersByTime(60 * 1000);
    // Trigger multiple different events
    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('wheel'));
    // Still within 5-minute window — no additional call should happen
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4 * 60 * 1000 + 1); // total = 5:00.001 since initial
    window.dispatchEvent(new Event('keydown'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  // Visibility triggers
  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => useSession());

    // Initial mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance time < 5 minutes
    vi.advanceTimersByTime(4 * 60 * 1000);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance to pass 5 minutes
    vi.advanceTimersByTime(60 * 1000 + 1); // total = 5:00.001 since initial
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('throttles GET /session on visibilitychange to visible within 5 minutes of last call', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => useSession());

    // Initial call on mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Simulate visibilitychange before 5 minutes
    vi.advanceTimersByTime(2 * 60 * 1000);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Still within throttle window
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  // Beacon-based session end
  it('calls navigator.sendBeacon on visibilitychange to hidden', () => {
    const beaconSpy = vi.spyOn(navigator, 'sendBeacon');

    renderHook(() => useSession());

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(beaconSpy).toHaveBeenCalledWith('/session');

    beaconSpy.mockRestore();
  });

  it('calls navigator.sendBeacon on pagehide', () => {
    const beaconSpy = vi.spyOn(navigator, 'sendBeacon');

    renderHook(() => useSession());

    window.dispatchEvent(new Event('pagehide'));

    expect(beaconSpy).toHaveBeenCalledWith('/session');

    beaconSpy.mockRestore();
  });
});
