/**
 * Camera service — wraps MediaDevices.getUserMedia
 */

let currentStream = null

/**
 * Start camera and attach to video element.
 * @param {HTMLVideoElement} videoEl
 * @param {'user'|'environment'} facingMode
 * @returns {MediaStream}
 */
export async function initCamera(videoEl, facingMode = 'user') {
  // Stop any existing stream
  if (currentStream) {
    stopCamera(currentStream)
  }

  const constraints = {
    video: {
      facingMode,
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      aspectRatio: { ideal: 16 / 9 },
    },
    audio: false,
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    currentStream = stream
    videoEl.srcObject = stream
    await videoEl.play()
    return stream
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('PERMISSION_DENIED')
    }
    if (err.name === 'NotFoundError') {
      throw new Error('NO_CAMERA')
    }
    throw new Error(`Camera error: ${err.message}`)
  }
}

/**
 * Stop all tracks in a stream.
 */
export function stopCamera(stream) {
  if (!stream) return
  stream.getTracks().forEach((track) => track.stop())
  currentStream = null
}

/**
 * Capture the current frame of a video element to a canvas.
 * Returns the canvas element (do not display, just process).
 * @param {HTMLVideoElement} videoEl
 * @returns {HTMLCanvasElement}
 */
export function captureFrame(videoEl) {
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.videoWidth || 1280
  canvas.height = videoEl.videoHeight || 720
  const ctx = canvas.getContext('2d')

  // Mirror the capture to match preview (front camera)
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height)
  ctx.restore()

  return canvas
}

/**
 * Check if the browser supports getUserMedia.
 */
export function isCameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Enumerate available camera devices.
 * Returns 'user' and/or 'environment' as available facing modes.
 */
export async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((d) => d.kind === 'videoinput')
    return videoDevices
  } catch {
    return []
  }
}
