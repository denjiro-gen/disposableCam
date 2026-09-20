import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import GalleryGrid from '../../components/Gallery/GalleryGrid'
import Lightbox from '../../components/Gallery/Lightbox'
import { getPublicPhotos } from '../../services/session'
import './GalleryPage.css'

const PAGE_SIZE = 24

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(null)
  const [error, setError] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const loadPhotos = async (pageNum = 0, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const { photos: newPhotos, total: newTotal } = await getPublicPhotos({
        page: pageNum,
        pageSize: PAGE_SIZE,
      })
      setTotal(newTotal)
      setPhotos((prev) => append ? [...prev, ...newPhotos] : newPhotos)
      setHasMore((pageNum + 1) * PAGE_SIZE < newTotal)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadPhotos(0, false)
  }, [])

  const handleLoadMore = () => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadPhotos(nextPage, true)
  }

  const handlePhotoClick = (photo, index) => {
    setLightboxIndex(index)
  }

  return (
    <div className="gallery-page">
      <Header />

      <main className="gallery-page__main">
        <div className="container">
          {/* Header */}
          <div className="gallery-page__header">
            <p className="retro-text gallery-page__event">23RD FOUNDING ANNIVERSARY</p>
            <h1 className="gallery-page__title">THE PHOTO ARCHIVE</h1>
            <p className="gallery-page__sub">
              A collection of moments captured during our celebration.
            </p>
            {total !== null && (
              <p className="retro-text gallery-page__count">
                {total} PHOTO{total !== 1 ? 'S' : ''} IN THE ARCHIVE
              </p>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="gallery-page__error">
              <p>⚠ Failed to load photos: {error}</p>
              <button className="btn btn--ghost btn--sm" onClick={() => loadPhotos(0, false)}>
                Retry
              </button>
            </div>
          )}

          {/* Gallery grid */}
          <GalleryGrid
            photos={photos}
            onPhotoClick={handlePhotoClick}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        </div>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((i) => Math.min(i + 1, photos.length - 1))}
          onPrev={() => setLightboxIndex((i) => Math.max(i - 1, 0))}
        />
      )}
    </div>
  )
}
