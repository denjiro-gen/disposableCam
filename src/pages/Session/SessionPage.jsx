import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'
import { getSessionByCode } from '../../services/session'
import { Download, Film, ShieldAlert, Images, X, ChevronLeft, ChevronRight } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './SessionPage.css'

export default function SessionPage() {
  const { sessionCode } = useParams()
  const [session, setSession] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    if (!sessionCode) return
    setLoading(true)
    getSessionByCode(sessionCode.toUpperCase())
      .then(({ session, photos }) => {
        setSession(session)
        setPhotos(photos)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [sessionCode])

  const downloadAll = async () => {
    setDownloading(true)
    try {
      const zip = new JSZip()
      await Promise.all(
        photos.map(async (photo, i) => {
          const resp = await fetch(photo.public_url)
          const blob = await resp.blob()
          zip.file(`23rd-anniversary-photo-${String(i + 1).padStart(2, '0')}.jpg`, blob)
        })
      )
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `23rd-anniversary-${sessionCode}.zip`)
    } catch (err) {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const downloadSingle = async (photo, index) => {
    try {
      const resp = await fetch(photo.public_url)
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `23rd-anniversary-photo-${String(index + 1).padStart(2, '0')}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed.')
    }
  }

  if (loading) {
    return (
      <div className="session-page">
        <Header minimal />
        <LoadingSpinner message="LOADING YOUR PHOTOS..." fullScreen />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="session-page">
        <Header minimal />
        <div className="session-page__error">
          <div className="session-page__error-icon"><ShieldAlert size={48} /></div>
          <h2>Session Not Found</h2>
          <p>{error || 'This session does not exist or has been removed.'}</p>
          <Link to="/" className="btn btn--primary">Go Home</Link>
        </div>
      </div>
    )
  }

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div className="session-page">
      <Header minimal />

      <main className="session-page__main">
        <div className="container--narrow">
          {/* Header */}
          <div className="session-page__header">
            <p className="retro-text session-page__event">23RD FOUNDING ANNIVERSARY</p>
            <h1 className="session-page__title">YOUR PHOTOS</h1>
            <p className="retro-text session-page__code">{session.session_code}</p>
            <p className="session-page__date">
              {new Date(session.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="session-page__empty">
              <p>No photos in this session yet.</p>
              <Link to="/camera" className="btn btn--primary">Take Photos</Link>
            </div>
          ) : (
            <>
              {/* Photo grid */}
              <div className="session-page__grid">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="session-page__photo-card film-card"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={photo.public_url}
                      alt={`Photo ${photo.photo_number}`}
                      loading="lazy"
                    />
                    <div className="session-page__photo-footer">
                      <span className="retro-text session-page__photo-num">
                        {String(photo.photo_number).padStart(2, '0')}
                      </span>
                      <button
                        className="btn btn--ghost btn--sm session-page__dl-btn"
                        onClick={(e) => { e.stopPropagation(); downloadSingle(photo, index) }}
                        aria-label="Download this photo"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="session-page__actions">
                <button
                  className="btn btn--primary btn--lg"
                  onClick={downloadAll}
                  disabled={downloading}
                >
                  <Download size={18} /> {downloading ? 'Preparing ZIP...' : `Download All ${photos.length} Photos`}
                </button>
                <Link to="/gallery" className="btn btn--secondary">
                  <Film size={18} /> View Event Gallery
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {currentPhoto && (
        <div className="session-lightbox" onClick={() => setLightboxIndex(null)}>
          <button
            className="session-lightbox__close btn btn--icon"
            onClick={() => setLightboxIndex(null)}
          ><X size={24} /></button>
          {lightboxIndex > 0 && (
            <button
              className="session-lightbox__nav session-lightbox__nav--prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1) }}
            ><ChevronLeft size={36} /></button>
          )}
          <img
            src={currentPhoto.public_url}
            alt={`Photo ${lightboxIndex + 1}`}
            className="session-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex < photos.length - 1 && (
            <button
              className="session-lightbox__nav session-lightbox__nav--next"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1) }}
            ><ChevronRight size={36} /></button>
          )}
          <button
            className="btn btn--ghost btn--sm session-lightbox__download"
            onClick={(e) => { e.stopPropagation(); downloadSingle(currentPhoto, lightboxIndex) }}
          ><Download size={14} /> Download</button>
          <div className="session-lightbox__counter retro-text">
            {String(lightboxIndex + 1).padStart(2,'0')} / {String(photos.length).padStart(2,'0')}
          </div>
        </div>
      )}
    </div>
  )
}
