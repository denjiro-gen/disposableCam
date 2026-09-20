import './PhotoPreview.css'

/**
 * Shows a processed/filtered photo for user approval.
 * User can accept (USE PHOTO) or retake.
 */
export default function PhotoPreview({ dataUrl, photoNumber, maxPhotos, onUse, onRetake }) {
  const label = String(photoNumber).padStart(2, '0')
  const maxLabel = String(maxPhotos).padStart(2, '0')

  return (
    <div className="photo-preview page-enter">
      <div className="photo-preview__label retro-text">
        PHOTO {label} / {maxLabel} — PREVIEW
      </div>

      <div className="photo-preview__film-card">
        <div className="photo-preview__img-wrap">
          <img src={dataUrl} alt={`Photo ${photoNumber}`} />
        </div>
        <div className="photo-preview__film-footer">
          <span className="retro-text photo-preview__number">{label}</span>
          <span className="photo-preview__event">23rd Anniversary</span>
        </div>
      </div>

      <div className="photo-preview__actions">
        <button className="btn btn--secondary" onClick={onRetake}>
          ↩ Retake
        </button>
        <button className="btn btn--primary btn--lg" onClick={onUse}>
          ✓ Use Photo
        </button>
      </div>

      <p className="photo-preview__hint">
        Retakes are unlimited — only accepted photos count.
      </p>
    </div>
  )
}
