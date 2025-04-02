import { renderHook } from '@testing-library/react';
import { vi, MockInstance } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useSession, sessionUrl, heartbeatUrl } from './useSession';

// MSW handler for GET /session
const getSessionHandler = http.get(
  sessionUrl,
  () => new HttpResponse(null, { status: 204 }),
);
const postHeartbeatHandler = http.post(
  heartbeatUrl,
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
      http.get(sessionUrl, () => new HttpResponse(null, { status: 500 })),
      http.post(heartbeatUrl, () => new HttpResponse(null, { status: 500 })),
    );

    setupSessionHook();

    // GET /session should have been attempted
    expect(fetchSpy).toHaveBeenCalledWith(sessionUrl, expect.any(Object));

    // No POST yet (we haven't hit the 5-minute mark)
    expect(fetchSpy).not.toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    // Advance time and simulate user activity
    advanceMinutesAndMs(5);
    window.dispatchEvent(new Event('click'));

    // Heartbeat should still be fired — backend will decide what to do
    expect(fetchSpy).toHaveBeenCalledWith(
      heartbeatUrl,
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
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not call GET /session again if no user interaction occurs after 5 minutes', () => {
    setupSessionHook();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 6 minutes — no interaction
    advanceMinutesAndMs(6);

    // Still only 1 call should have happened
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );
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

      // Initial mount should trigger GET /session
      expect(fetchSpy).toHaveBeenCalledWith(
        sessionUrl,
        expect.objectContaining({ method: 'GET' }),
      );

      // First interaction within throttle window – should NOT trigger POST
      advanceMinutesAndMs(4);
      window.dispatchEvent(new Event(eventType));
      expect(fetchSpy).not.toHaveBeenCalledWith(
        heartbeatUrl,
        expect.objectContaining({ method: 'POST' }),
      );

      // Advance time to pass 5 minutes
      advanceMinutesAndMs(1, 1);
      window.dispatchEvent(new Event(eventType));

      // Now heartbeat POST should be called
      expect(fetchSpy).toHaveBeenCalledWith(
        heartbeatUrl,
        expect.objectContaining({ method: 'POST' }),
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    setupSessionHook();

    // Initial GET on mount
    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'GET' }),
    );

    // Trigger multiple events within 5 minutes
    advanceMinutesAndMs(1);
    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('wheel'));
    window.dispatchEvent(new Event('touchstart'));

    // Should NOT have sent a POST yet
    expect(fetchSpy).not.toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    // Now move past 5-minute mark and trigger one more event
    advanceMinutesAndMs(4, 1); // t = 5:00.001
    window.dispatchEvent(new Event('keydown'));

    // Now it should send the heartbeat
    expect(fetchSpy).toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    // Total calls = 1 GET + 1 POST
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // Visibility triggers
  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    setupSessionHook();

    // Initial call on mount (GET)
    expect(fetchSpy).toHaveBeenCalledWith(
      sessionUrl,
      expect.objectContaining({ method: 'GET' }),
    );

    // Simulate visibilitychange to visible within 5 minutes — should NOT POST
    advanceMinutesAndMs(4);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchSpy).not.toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    // Advance time past 5-minute threshold
    advanceMinutesAndMs(1, 1);
    document.dispatchEvent(new Event('visibilitychange'));

    // Now it should POST
    expect(fetchSpy).toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({ method: 'POST' }),
    );

    // Total calls: 1 GET on mount + 1 POST after 5 min
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
    expect(beaconSpy).toHaveBeenCalledWith(heartbeatUrl);
  });

  it('calls navigator.sendBeacon on pagehide', () => {
    setupSessionHook();

    window.dispatchEvent(new Event('pagehide'));
    expect(beaconSpy).toHaveBeenCalledWith(heartbeatUrl);
  });
});
