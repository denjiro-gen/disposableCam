import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraView from '../../components/Camera/CameraView'
import PhotoPreview from '../../components/PhotoPreview/PhotoPreview'
import UploadProgress from '../../components/UploadProgress/UploadProgress'
import SessionQR from '../../components/QRCode/SessionQR'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'
import { initCamera, stopCamera, isCameraSupported } from '../../services/camera'
import { applyFilm90sFilter } from '../../services/imageFilter'
import { createSession, completeSession, getDeviceSession } from '../../services/session'
import { uploadAllPhotos } from '../../services/upload'
import { getDeviceId } from '../../utils/storage'
import { playShutterSound } from '../../utils/shutter'
import { Camera as CameraIcon, RefreshCw, XCircle, Film, Check, Download, Images, QrCode } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './CameraPage.css'

const MAX_PHOTOS = 7

// ── State machine ──────────────────────────────────────────────────────────
// idle → creating_session → camera → flash → processing → preview
// → (retake: back to camera) | (use: camera or uploading)
// uploading → complete

export default function CameraPage() {
  const navigate = useNavigate()

  // Session
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)

  // Camera
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [permissionError, setPermissionError] = useState(null)
  const cameraRef = useRef(null)

  // Photos
  const [acceptedPhotos, setAcceptedPhotos] = useState([]) // { dataUrl, blob, width, height }
  const [previewPhoto, setPreviewPhoto] = useState(null)   // { dataUrl, blob, width, height }

  // UI state
  const [phase, setPhase] = useState('creating_session') // creating_session|camera|flash|processing|preview|uploading|complete
  const [flashActive, setFlashActive] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState({})
  const [sessionCode, setSessionCode] = useState(null)

  // Refs to avoid stale closures
  const streamRef = useRef(null)
  const sessionRef = useRef(null)

  // ── Create session on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!isCameraSupported()) {
      setPermissionError('NO_CAMERA')
      setPhase('camera')
      return
    }

    const deviceId = getDeviceId()
    createSession(deviceId)
      .then((s) => {
        setSession(s)
        sessionRef.current = s
        setPhase('camera')
      })
      .catch((err) => {
        if (err.message === 'ALREADY_USED') {
          // If they already have a session, we redirect or show error
          getDeviceSession(deviceId).then(s => {
            if (s) setSessionCode(s.session_code)
            setPhase('already_used')
          })
        } else {
          console.error('Session creation failed:', err)
          setSessionError(err.message)
          setPhase('camera')
        }
      })

    return () => {
      if (streamRef.current) stopCamera(streamRef.current)
    }
  }, [])

  // ── Init camera when phase is 'camera' ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'camera') return

    const videoEl = cameraRef.current?.getVideoElement()
    if (!videoEl) return

    initCamera(videoEl, facingMode)
      .then((s) => {
        streamRef.current = s
        setStream(s)
      })
      .catch((err) => {
        if (err.message === 'PERMISSION_DENIED') setPermissionError('PERMISSION_DENIED')
        else if (err.message === 'NO_CAMERA') setPermissionError('NO_CAMERA')
        else setPermissionError(err.message)
      })
  }, [phase, facingMode])

  // ── Flip camera ──────────────────────────────────────────────────────────
  const handleFlip = useCallback(() => {
    if (streamRef.current) {
      stopCamera(streamRef.current)
      streamRef.current = null
      setStream(null)
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [])

  // ── Capture ──────────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (phase !== 'camera') return
    const videoEl = cameraRef.current?.getVideoElement()
    if (!videoEl) return

    // 1. Shutter sound
    playShutterSound()

    // 2. Flash
    setPhase('flash')
    setFlashActive(true)
    await new Promise((r) => setTimeout(r, 80))
    setFlashActive(false)

    // 3. Process filter
    setPhase('processing')
    try {
      const result = await applyFilm90sFilter(videoEl, {
        addGrain: true,
        addVignette: true,
        addLightLeak: true,
        addStamp: true,
        maxWidth: 1600,
        jpegQuality: 0.85,
      })

      setPreviewPhoto(result)
      setPhase('preview')
    } catch (err) {
      console.error('Filter failed:', err)
      setPhase('camera')
    }
  }, [phase])

  // ── Use photo ────────────────────────────────────────────────────────────
  const handleUsePhoto = useCallback(() => {
    if (!previewPhoto) return
    setAcceptedPhotos((prev) => [...prev, previewPhoto])
    setPreviewPhoto(null)

    const newCount = acceptedPhotos.length + 1
    if (newCount >= MAX_PHOTOS) {
      // All photos taken — stop camera and go to upload
      if (streamRef.current) stopCamera(streamRef.current)
      setPhase('uploading')
      startUpload([...acceptedPhotos, previewPhoto])
    } else {
      setPhase('camera')
    }
  }, [previewPhoto, acceptedPhotos])

  // ── Retake ───────────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setPreviewPhoto(null)
    setPhase('camera')
  }, [])

  // ── Upload all photos ────────────────────────────────────────────────────
  const startUpload = useCallback(async (photos) => {
    if (!sessionRef.current) {
      alert('No session found. Please try again.')
      return
    }

    // Initialize statuses
    const initial = {}
    photos.forEach((_, i) => { initial[i + 1] = 'uploading' })
    setUploadStatuses(initial)

    const uploadPayload = photos.map((p, i) => ({
      blob: p.blob,
      photoNumber: i + 1,
      width: p.width,
      height: p.height,
    }))

    await uploadAllPhotos(sessionRef.current.id, uploadPayload, (photoNum, status) => {
      setUploadStatuses((prev) => ({ ...prev, [photoNum]: status }))
    })

    await completeSession(sessionRef.current.id)
    setSessionCode(sessionRef.current.session_code)
    setPhase('complete')
  }, [])

  // ── Download all ─────────────────────────────────────────────────────────
  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip()
    acceptedPhotos.forEach((photo, i) => {
      zip.file(`23rd-anniversary-photo-${String(i + 1).padStart(2, '0')}.jpg`, photo.blob)
    })
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `23rd-anniversary-photos-${sessionRef.current?.session_code || 'session'}.zip`)
  }, [acceptedPhotos])

  // ── Render phases ─────────────────────────────────────────────────────────

  if (phase === 'creating_session') {
    return (
      <div className="camera-page">
        <LoadingSpinner message="PREPARING YOUR CAMERA..." fullScreen />
      </div>
    )
  }

  if (phase === 'uploading') {
    return (
      <div className="camera-page">
        <div className="camera-page__inner">
          <div className="camera-page__header">
            <p className="retro-text camera-page__event">23RD FOUNDING ANNIVERSARY</p>
          </div>
          <UploadProgress statuses={uploadStatuses} total={MAX_PHOTOS} />
        </div>
      </div>
    )
  }

  if (phase === 'already_used') {
    return (
      <div className="camera-page">
        <div className="camera-page__inner page-enter" style={{ justifyContent: 'center' }}>
          <div className="camera-page__complete">
            <div className="camera-page__complete-icon"><CameraIcon size={48} /></div>
            <p className="retro-text camera-page__complete-title">
              CAMERA ALREADY USED
            </p>
            <p className="camera-page__complete-sub" style={{ marginBottom: '24px' }}>
              Each device can only use one disposable camera.
            </p>
            {sessionCode && (
              <a
                href={`/session/${sessionCode}`}
                className="btn btn--primary"
              >
                <Images size={18} /> View Your Photos
              </a>
            )}
            <a href="/gallery" className="btn btn--secondary" style={{ marginTop: '12px' }}>
              <Film size={18} /> View Event Gallery
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="camera-page">
        <div className="camera-page__inner page-enter">
          <div className="camera-page__complete">
            <div className="camera-page__complete-icon"><Film size={48} /></div>
            <p className="retro-text camera-page__complete-title">
              YOUR MEMORIES ARE DEVELOPED.
            </p>
            <p className="camera-page__complete-sub">
              {MAX_PHOTOS} photos saved to the event archive.
            </p>

            {/* Photo grid */}
            <div className="photos-grid camera-page__photo-grid">
              {acceptedPhotos.map((photo, i) => (
                <div key={i} className="photo-thumb">
                  <img src={photo.dataUrl} alt={`Photo ${i + 1}`} />
                  <span className="photo-thumb__number retro-text">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            {sessionCode && (
              <div className="camera-page__qr-section">
                <h3 className="camera-page__qr-title">SCAN TO VIEW YOUR PHOTOS</h3>
                <SessionQR sessionCode={sessionCode} />
              </div>
            )}

            {/* Actions */}
            <div className="camera-page__complete-actions">
              <button className="btn btn--ghost" onClick={handleDownloadAll}>
                <Download size={18} /> Download All 7 Photos (ZIP)
              </button>
              <a
                href={`/session/${sessionCode}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn--secondary"
              >
                <Images size={18} /> View My Photos
              </a>
              <a href="/gallery" className="btn btn--secondary">
                <Film size={18} /> View Event Gallery
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'preview' && previewPhoto) {
    return (
      <div className="camera-page">
        <div className="camera-page__inner">
          <div className="camera-page__header">
            <p className="retro-text camera-page__event">23RD FOUNDING ANNIVERSARY</p>
            <p className="camera-page__desc">YOUR DIGITAL DISPOSABLE CAMERA</p>
          </div>
          <PhotoPreview
            dataUrl={previewPhoto.dataUrl}
            photoNumber={acceptedPhotos.length + 1}
            maxPhotos={MAX_PHOTOS}
            onUse={handleUsePhoto}
            onRetake={handleRetake}
          />
        </div>
      </div>
    )
  }

  // Default: camera phase (also shows during flash/processing)
  return (
    <div className="camera-page">
      <div className="camera-page__inner">
        <div className="camera-page__header">
          <p className="retro-text camera-page__event">23RD FOUNDING ANNIVERSARY</p>
          <p className="camera-page__desc">YOUR DIGITAL DISPOSABLE CAMERA — 7 SHOTS. ONE MEMORY.</p>
        </div>

        {sessionError && (
          <div className="camera-page__session-error">
            ⚠ Session error: {sessionError}. Photos may not be saved.
          </div>
        )}

        {phase === 'processing' ? (
          <div className="camera-page__processing">
            <LoadingSpinner message="DEVELOPING..." />
          </div>
        ) : (
          <CameraView
            ref={cameraRef}
            stream={stream}
            photoCount={acceptedPhotos.length}
            maxPhotos={MAX_PHOTOS}
            onCapture={handleCapture}
            onFlipCamera={handleFlip}
            facingMode={facingMode}
            flashActive={flashActive}
            disabled={phase !== 'camera' || acceptedPhotos.length >= MAX_PHOTOS}
            permissionError={permissionError}
          />
        )}
      </div>
    </div>
  )
}
