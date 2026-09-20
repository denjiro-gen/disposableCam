import { useState, useEffect, useRef, useCallback } from 'react'
import { ImageOff, Expand, Images } from 'lucide-react'
import './GalleryGrid.css'

/**
 * Masonry-style gallery grid with lazy loading and lightbox trigger.
 * photos: Array of photo objects from Supabase
 * onPhotoClick: (photo, index) => void
 * onLoadMore: () => void
 * hasMore: boolean
 * loading: boolean
 */
export default function GalleryGrid({ photos, onPhotoClick, onLoadMore, hasMore, loading }) {
  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!onLoadMore || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = sentinelRef.current
    if (sentinel) observerRef.current.observe(sentinel)

    return () => {
      if (sentinel && observerRef.current) observerRef.current.unobserve(sentinel)
    }
  }, [onLoadMore, hasMore, loading])

  if (!loading && photos.length === 0) {
    return (
      <div className="gallery-grid__empty">
        <div className="gallery-grid__empty-icon"><Images size={48} /></div>
        <h3>No photos yet</h3>
        <p>Be the first to capture a memory!</p>
      </div>
    )
  }

  return (
    <div className="gallery-grid__outer">
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <GalleryItem
            key={photo.id}
            photo={photo}
            index={index}
            onClick={() => onPhotoClick(photo, index)}
          />
        ))}

        {/* Skeleton placeholders while loading */}
        {loading &&
          [...Array(8)].map((_, i) => (
            <div key={`skel-${i}`} className="gallery-item gallery-item--skeleton skeleton" />
          ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="gallery-grid__sentinel" />}

      {!hasMore && photos.length > 0 && (
        <p className="gallery-grid__end retro-text">— END OF ARCHIVE —</p>
      )}
    </div>
  )
}

function GalleryItem({ photo, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`gallery-item ${loaded ? 'loaded' : ''}`} onClick={onClick}>
      {!loaded && !error && <div className="gallery-item__placeholder skeleton" />}
      {!error ? (
        <img
          src={photo.public_url}
          alt={`Photo from session ${photo.photo_sessions?.session_code || ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className="gallery-item__img"
        />
      ) : (
        <div className="gallery-item__error"><ImageOff size={32} /></div>
      )}
      <div className="gallery-item__overlay">
        <span className="gallery-item__expand"><Expand size={24} /></span>
      </div>
    </div>
  )
}
