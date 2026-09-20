/**
 * Build the full URL for a session gallery page.
 * Used by QR code generator.
 */
export function getSessionUrl(sessionCode) {
  const base = window.location.origin
  return `${base}/session/${sessionCode}`
}

/**
 * Build the gallery URL.
 */
export function getGalleryUrl() {
  return `${window.location.origin}/gallery`
}
