import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import './AdminPage.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2024'

export default function AdminPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('dc_admin_auth', 'true')
      navigate('/admin/dashboard')
    } else {
      setError(true)
      setShaking(true)
      setPassword('')
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <div className="admin-login">
      <div className={`admin-login__card card ${shaking ? 'shake' : ''}`}>
        <div className="admin-login__icon"><Lock size={48} /></div>
        <h1 className="admin-login__title">Admin Access</h1>
        <p className="admin-login__sub retro-text">23RD FOUNDING ANNIVERSARY</p>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <input
            id="admin-password"
            type="password"
            className="input"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="admin-login__error">Incorrect password. Try again.</p>
          )}
          <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
            Enter Dashboard
          </button>
        </form>

        <a href="/" className="admin-login__back">← Back to Camera</a>
      </div>
    </div>
  )
}
