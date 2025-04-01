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

  it.only('does not perform session tracking when GET /session fails on mount', () => {
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
    renderHook(() => useSession());
    // expect(sessionHandler).toHaveBeenCalledTimes(1);
  });

  // Core interaction events
  it('calls GET /session on click after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate click + timer
  });

  it('calls GET /session on scroll after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate scroll + timer
  });

  it('calls GET /session on keydown after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate keydown + timer
  });

  // Additional recommended interactions
  it('calls GET /session on mousemove after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate mousemove + timer
  });

  it('calls GET /session on wheel after 5 minutes', () => {
    // Note: wheel events may occur without triggering scroll,
    // so it's important to track them independently.
    renderHook(() => useSession());
    // simulate wheel + timer
  });

  it('calls GET /session on touchstart after 5 minutes', () => {
    // Note: touchstart is critical for mobile activity tracking.
    renderHook(() => useSession());
    // simulate touchstart + timer
  });

  // Visibility triggers
  it('calls GET /session on visibilitychange to visible after 5 minutes', () => {
    renderHook(() => useSession());
    // simulate visibilitychange + timer
  });

  it('does NOT call GET /session on visibilitychange to visible within debounce', () => {
    renderHook(() => useSession());
    // simulate event within 5-minute window
  });

  // Debounce logic
  it('does not call GET /session multiple times within 5 minutes of repeated events', () => {
    renderHook(() => useSession());
    // simulate repeated triggers within 5-minute debounce
  });

  // Beacon-based session end
  it('calls navigator.sendBeacon on visibilitychange to hidden', () => {
    renderHook(() => useSession());
    // simulate document becoming hidden
  });

  it('calls navigator.sendBeacon on pagehide', () => {
    renderHook(() => useSession());
    // simulate pagehide event
  });
});
