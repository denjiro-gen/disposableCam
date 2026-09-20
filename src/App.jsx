import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home/HomePage'
import CameraPage from './pages/Camera/CameraPage'
import SessionPage from './pages/Session/SessionPage'
import GalleryPage from './pages/Gallery/GalleryPage'
import AdminPage from './pages/Admin/AdminPage'
import AdminDashboard from './pages/Admin/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/camera"             element={<CameraPage />} />
        <Route path="/session/:sessionCode" element={<SessionPage />} />
        <Route path="/gallery"            element={<GalleryPage />} />
        <Route path="/admin"              element={<AdminPage />} />
        <Route path="/admin/dashboard"    element={<AdminDashboard />} />
        <Route path="*"                   element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      textAlign: 'center',
      padding: '24px',
    }}>
      <p style={{ fontFamily: 'VT323, monospace', fontSize: '4rem', color: 'var(--film-amber)' }}>404</p>
      <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Page not found</h1>
      <a href="/" className="btn btn--primary" style={{ marginTop: '8px' }}>← Back Home</a>
    </div>
  )
}
