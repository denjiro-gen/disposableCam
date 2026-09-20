import './UploadProgress.css'

const STATUS_ICONS = {
  pending:    '○',
  uploading:  '↑',
  success:    '✓',
  error:      '✗',
}

/**
 * Shows per-photo upload progress.
 * statuses: { [photoNumber]: 'pending'|'uploading'|'success'|'error' }
 */
export default function UploadProgress({ statuses, total }) {
  const done = Object.values(statuses).filter(s => s === 'success').length
  const failed = Object.values(statuses).filter(s => s === 'error').length

  return (
    <div className="upload-progress page-enter">
      <div className="upload-progress__header">
        <p className="retro-text upload-progress__title">DEVELOPING YOUR PHOTOS...</p>
        <p className="upload-progress__subtitle">
          Please keep this page open while your photos upload.
        </p>
      </div>

      <div className="upload-progress__bar-wrap">
        <div
          className="upload-progress__bar-fill"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <p className="upload-progress__count retro-text">
        {done} / {total} UPLOADED
      </p>

      <div className="upload-progress__list">
        {[...Array(total)].map((_, i) => {
          const num = i + 1
          const status = statuses[num] || 'pending'
          return (
            <div key={num} className={`upload-progress__item upload-progress__item--${status}`}>
              <span className="upload-progress__item-icon retro-text">
                {STATUS_ICONS[status]}
              </span>
              <span className="retro-text">PHOTO {String(num).padStart(2, '0')}</span>
              <span className="upload-progress__item-status">
                {status === 'pending'   && 'Waiting...'}
                {status === 'uploading' && 'Uploading...'}
                {status === 'success'   && 'Saved ✓'}
                {status === 'error'     && 'Failed — retrying'}
              </span>
            </div>
          )
        })}
      </div>

      {failed > 0 && (
        <p className="upload-progress__warning">
          ⚠ {failed} photo{failed > 1 ? 's' : ''} failed. Retrying automatically...
        </p>
      )}
    </div>
  )
}
