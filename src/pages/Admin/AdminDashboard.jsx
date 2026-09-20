import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import StatsBar from '../../components/Admin/StatsBar'
import SessionTable from '../../components/Admin/SessionTable'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'
import {
  getAdminStats,
  getAllSessions,
  getAllPhotos,
  togglePhotoVisibility,
  deletePhoto,
} from '../../services/session'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (sessionStorage.getItem('dc_admin_auth') !== 'true') {
      navigate('/admin')
    }
  }, [navigate])

  const [tab, setTab] = useState('sessions') // sessions | photos
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsPage, setSessionsPage] = useState(0)
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [photos, setPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosPage, setPhotosPage] = useState(0)
  const [photosTotal, setPhotosTotal] = useState(0)
  const [busy, setBusy] = useState(null)

  const PAGE_SIZE = 20

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadSessions = useCallback(async (page = 0) => {
    setSessionsLoading(true)
    try {
      const { sessions: data, total } = await getAllSessions({ page, pageSize: PAGE_SIZE })
      setSessions(page === 0 ? data : (prev) => [...prev, ...data])
      setSessionsTotal(total)
      setSessionsPage(page)
    } catch (err) {
      console.error('Sessions error:', err)
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  const loadPhotos = useCallback(async (page = 0) => {
    setPhotosLoading(true)
    try {
      const { photos: data, total } = await getAllPhotos({ page, pageSize: PAGE_SIZE })
      setPhotos(page === 0 ? data : (prev) => [...prev, ...data])
      setPhotosTotal(total)
      setPhotosPage(page)
    } catch (err) {
      console.error('Photos error:', err)
    } finally {
      setPhotosLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadSessions(0)
  }, [loadStats, loadSessions])

  useEffect(() => {
    if (tab === 'photos') loadPhotos(0)
  }, [tab, loadPhotos])

  const handleToggleVisibility = async (photo) => {
    setBusy(photo.id)
    try {
      await togglePhotoVisibility(photo.id, !photo.is_public)
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, is_public: !p.is_public } : p))
      )
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusy(null)
    }
  }

  const handleDeletePhoto = async (photo) => {
    if (!window.confirm('Permanently delete this photo?')) return
    setBusy(photo.id)
    try {
      await deletePhoto(photo.id, photo.storage_path)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      setPhotosTotal((t) => t - 1)
      loadStats()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusy(null)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('dc_admin_auth')
    navigate('/admin')
  }

  return (
    <div className="admin-dash">
      <Header minimal />

      <main className="admin-dash__main container">
        {/* Top bar */}
        <div className="admin-dash__topbar">
          <div>
            <h1 className="admin-dash__title">Admin Dashboard</h1>
            <p className="admin-dash__subtitle retro-text">23RD FOUNDING ANNIVERSARY</p>
          </div>
          <div className="admin-dash__topbar-actions">
            <button className="btn btn--ghost btn--sm" onClick={() => { loadStats(); loadSessions(0) }}>
              ↻ Refresh
            </button>
            <button className="btn btn--danger btn--sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Tabs */}
        <div className="admin-dash__tabs">
          <button
            className={`admin-dash__tab ${tab === 'sessions' ? 'active' : ''}`}
            onClick={() => setTab('sessions')}
          >
            Sessions ({sessionsTotal})
          </button>
          <button
            className={`admin-dash__tab ${tab === 'photos' ? 'active' : ''}`}
            onClick={() => setTab('photos')}
          >
            Photos ({photosTotal})
          </button>
        </div>

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <div className="admin-dash__panel">
            {sessionsLoading && sessions.length === 0 ? (
              <LoadingSpinner message="Loading sessions..." />
            ) : (
              <>
                <SessionTable
                  sessions={sessions}
                  onRefresh={() => { loadSessions(0); loadStats() }}
                />
                {sessions.length < sessionsTotal && (
                  <div className="admin-dash__load-more">
                    <button
                      className="btn btn--ghost"
                      onClick={() => loadSessions(sessionsPage + 1)}
                      disabled={sessionsLoading}
                    >
                      {sessionsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Photos tab */}
        {tab === 'photos' && (
          <div className="admin-dash__panel">
            {photosLoading && photos.length === 0 ? (
              <LoadingSpinner message="Loading photos..." />
            ) : (
              <>
                <div className="admin-photos-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className={`admin-photo-card ${!photo.is_public ? 'hidden' : ''}`}>
                      <div className="admin-photo-card__img-wrap">
                        <img src={photo.public_url} alt="" loading="lazy" />
                        {!photo.is_public && (
                          <div className="admin-photo-card__hidden-badge">HIDDEN</div>
                        )}
                      </div>
                      <div className="admin-photo-card__info">
                        <span className="retro-text admin-photo-card__session">
                          {photo.photo_sessions?.session_code || '—'}
                        </span>
                        <span className="admin-photo-card__num">#{photo.photo_number}</span>
                      </div>
                      <div className="admin-photo-card__actions">
                        <button
                          className={`btn btn--sm ${photo.is_public ? 'btn--ghost' : 'btn--primary'}`}
                          onClick={() => handleToggleVisibility(photo)}
                          disabled={busy === photo.id}
                        >
                          {busy === photo.id ? '...' : photo.is_public ? 'Hide' : 'Show'}
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={busy === photo.id}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {photos.length < photosTotal && (
                  <div className="admin-dash__load-more">
                    <button
                      className="btn btn--ghost"
                      onClick={() => loadPhotos(photosPage + 1)}
                      disabled={photosLoading}
                    >
                      {photosLoading ? 'Loading...' : `Load More (${photosTotal - photos.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
