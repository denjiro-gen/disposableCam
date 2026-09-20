import { Link, useLocation } from 'react-router-dom'
import { Camera, Film } from 'lucide-react'
import './Header.css'

export default function Header({ minimal = false }) {
  const location = useLocation()

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link to="/" className="site-header__logo">
          <span className="site-header__logo-icon">◉</span>
          <span className="site-header__logo-text">
            <span className="site-header__logo-main">23rd</span>
            <span className="site-header__logo-sub">Founding Anniversary</span>
          </span>
        </Link>

        {!minimal && (
          <nav className="site-header__nav">
            <Link
              to="/camera"
              className={`site-header__nav-link ${location.pathname === '/camera' ? 'active' : ''}`}
            >
              <Camera size={14} /> Camera
            </Link>
            <Link
              to="/gallery"
              className={`site-header__nav-link ${location.pathname === '/gallery' ? 'active' : ''}`}
            >
              <Film size={14} /> Gallery
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
