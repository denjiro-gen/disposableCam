import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import './Lightbox.css'

/**
 * Full-screen photo lightbox.
 * photos: array of photo objects
 * currentIndex: current photo index
 * onClose, onNext, onPrev
 */
export default function Lightbox({ photos, currentIndex, onClose, onNext, onPrev }) {
  const photo = photos[currentIndex]
  const total = photos.length

  // Keyboard navigation
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight') onNext()
    if (e.key === 'ArrowLeft') onPrev()
  }, [onClose, onNext, onPrev])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  if (!photo) return null

  const downloadPhoto = async () => {
    try {
      const response = await fetch(photo.public_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anniversary-photo-${currentIndex + 1}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="lightbox" onClick={onClose}>
      {/* Counter */}
      <div className="lightbox__counter retro-text" onClick={e => e.stopPropagation()}>
        {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {/* Close */}
      <button
        className="lightbox__close btn btn--icon"
        onClick={onClose}
        aria-label="Close"
      ><X size={24} /></button>

      {/* Download */}
      <button
        className="lightbox__download btn btn--ghost btn--sm"
        onClick={(e) => { e.stopPropagation(); downloadPhoto() }}
      >
        <Download size={14} /> Download
      </button>

      {/* Prev */}
      {currentIndex > 0 && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Previous photo"
        ><ChevronLeft size={36} /></button>
      )}

      {/* Image */}
      <div className="lightbox__img-wrap" onClick={e => e.stopPropagation()}>
        <img
          src={photo.public_url}
          alt={`Photo ${currentIndex + 1}`}
          className="lightbox__img"
        />
      </div>

      {/* Next */}
      {currentIndex < total - 1 && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Next photo"
        ><ChevronRight size={36} /></button>
      )}
    </div>
  )
}
