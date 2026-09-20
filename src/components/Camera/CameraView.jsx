import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import './CameraView.css'

const CameraView = forwardRef(function CameraView(
  {
    stream,
    photoCount,
    maxPhotos,
    onCapture,
    onFlipCamera,
    facingMode,
    flashActive,
    disabled,
    permissionError,
  },
  ref
) {
  const videoRef = useRef(null)

  // Expose video element ref to parent
  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
  }))

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const photosLeft = maxPhotos - photoCount
  const photoLabel = String(photoCount + 1).padStart(2, '0')
  const maxLabel = String(maxPhotos).padStart(2, '0')

  if (permissionError) {
    return (
      <div className="camera-view camera-view--error">
        <div className="camera-view__error-inner">
          <div className="camera-view__error-icon">🚫</div>
          <h2>Camera Access Required</h2>
          <p>
            {permissionError === 'PERMISSION_DENIED'
              ? 'Please allow camera access in your browser settings and reload the page.'
              : permissionError === 'NO_CAMERA'
              ? 'No camera was found on this device.'
              : `Camera error: ${permissionError}`}
          </p>
          <button className="btn btn--secondary" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-view">
      {/* ── Flash overlay ── */}
      <div className={`camera-view__flash ${flashActive ? 'active' : ''}`} />

      {/* ── Viewfinder frame ── */}
      <div className="camera-view__frame">
        {/* Corner brackets */}
        <div className="camera-view__corner camera-view__corner--tl" />
        <div className="camera-view__corner camera-view__corner--tr" />
        <div className="camera-view__corner camera-view__corner--bl" />
        <div className="camera-view__corner camera-view__corner--br" />

        <video
          ref={videoRef}
          className="camera-view__video"
          autoPlay
          playsInline
          muted
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* ── HUD overlay ── */}
        <div className="camera-view__hud">
          <div className="camera-view__hud-top">
            <span className="camera-view__event retro-text">23RD FOUNDING ANNIVERSARY</span>
            <span className={`camera-view__rec retro-text ${!disabled ? 'blinking' : ''}`}>
              ● REC
            </span>
          </div>
          <div className="camera-view__hud-bottom">
            <span className="camera-view__counter retro-text">
              {photoLabel} / {maxLabel}
            </span>
            <span className="camera-view__shots retro-text">
              {photosLeft} SHOT{photosLeft !== 1 ? 'S' : ''} LEFT
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="camera-view__controls">
        {/* Flip camera button */}
        <button
          className="btn btn--ghost btn--icon camera-view__flip"
          onClick={onFlipCamera}
          disabled={disabled}
          aria-label="Flip camera"
          title="Flip camera"
        >
          🔄
        </button>

        {/* Shutter button */}
        <button
          className={`camera-view__shutter ${disabled ? 'disabled' : ''}`}
          onClick={onCapture}
          disabled={disabled}
          aria-label="Take photo"
        >
          <div className="camera-view__shutter-ring" />
          <div className="camera-view__shutter-btn" />
        </button>

        {/* Spacer */}
        <div style={{ width: 44 }} />
      </div>

      {/* ── Photo dots strip ── */}
      <div className="camera-view__dots">
        {[...Array(maxPhotos)].map((_, i) => (
          <div
            key={i}
            className={`camera-view__dot ${i < photoCount ? 'taken' : i === photoCount ? 'next' : ''}`}
          />
        ))}
      </div>
    </div>
  )
})

export default CameraView
