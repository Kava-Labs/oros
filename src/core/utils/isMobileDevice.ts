/**
 * Detects if the current device is a mobile device based on user agent and viewport width
 * @returns boolean - true if the device is mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  //  Use regex to detect mobile
  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent,
    );

  const isMobileViewport = window.innerWidth <= 768;

  //  But also confirm the viewport (chrome devtools throws a false positive based on agent-alone)
  return isMobileUserAgent && isMobileViewport;
}
