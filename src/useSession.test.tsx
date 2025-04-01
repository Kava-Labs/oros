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
   * These core events have potential to be table style tests
   * since the output assertions should really be the same
   */
  it('calls GET /session on click after 5 minutes', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => useSession());

    // Initial mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 4 minutes — not enough
    vi.advanceTimersByTime(4 * 60 * 1000);

    // First click — should NOT trigger a call yet
    window.dispatchEvent(new Event('click'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 1 more minute
    vi.advanceTimersByTime(1 * 60 * 1000 + 1); // now total = 5:00.001

    // Second click — NOW should trigger another call
    window.dispatchEvent(new Event('click'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('calls GET /session on scroll after 5 minutes', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => useSession());

    // Initial ping on mount
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance 4 minutes — not enough
    vi.advanceTimersByTime(4 * 60 * 1000);
    window.dispatchEvent(new Event('scroll'));

    // Still only 1 call
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance just over 1 minute more
    vi.advanceTimersByTime(60 * 1000 + 1); // now total = 5:00.001
    window.dispatchEvent(new Event('scroll'));

    // Should now trigger second ping
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it.skip('calls GET /session on keydown after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate keydown + timer
  });

  // Additional recommended interactions
  it.skip('calls GET /session on mousemove after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate mousemove + timer
  });

  it.skip('calls GET /session on wheel after 5 minutes', () => {
    // Note: wheel events may occur without triggering scroll,
    // so it's important to track them independently.
    renderHook(() => useSession());
    // simulate wheel + timer
  });

  it.skip('calls GET /session on touchstart after 5 minutes', () => {
    // Note: touchstart is critical for mobile activity tracking.
    renderHook(() => useSession());
    // simulate touchstart + timer
  });

  it.skip('only calls GET /session once when multiple user events occur within 5 minutes', () => {
    // const fetchSpy = vi.spyOn(globalThis, 'fetch');
    // renderHook(() => useSession());
    // // Initial call on mount
    // expect(fetchSpy).toHaveBeenCalledTimes(1);
    // // Advance a safe amount — 1 minute
    // vi.advanceTimersByTime(60 * 1000);
    // // Trigger multiple different events
    // window.dispatchEvent(new Event('click'));
    // window.dispatchEvent(new Event('scroll'));
    // window.dispatchEvent(new Event('keydown'));
    // window.dispatchEvent(new Event('mousemove'));
    // window.dispatchEvent(new Event('wheel'));
    // // Still within 5-minute window — no additional call should happen
    // expect(fetchSpy).toHaveBeenCalledTimes(1);
    // vi.advanceTimersByTime(60 * 5 * 1000);
    // expect(fetchSpy).toHaveBeenCalledTimes(2);
    // fetchSpy.mockRestore();
  });

  // Visibility triggers
  it.skip('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate visibilitychange + timer
  });

  it.skip('does NOT call GET /session on visibilitychange to visible within debounce', () => {
    renderHook(() => useSession());
    // simulate event within 5-minute window
  });

  // Debounce logic
  it.skip('does not call GET /session multiple times within 5 minutes of repeated events', () => {
    renderHook(() => useSession());
    // simulate repeated triggers within 5-minute debounce
  });

  // Beacon-based session end
  it.skip('calls navigator.sendBeacon on visibilitychange to hidden', () => {
    renderHook(() => useSession());
    // simulate document becoming hidden
  });

  it.skip('calls navigator.sendBeacon on pagehide', () => {
    renderHook(() => useSession());
    // simulate pagehide event
  });
});
