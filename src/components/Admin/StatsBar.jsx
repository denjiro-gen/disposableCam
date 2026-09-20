import { Camera, Film, Calendar, Activity } from 'lucide-react'
import './StatsBar.css'

export default function StatsBar({ stats, loading }) {
  const items = [
    { label: 'TOTAL SESSIONS',  value: stats?.totalSessions  ?? '—', icon: <Camera size={24} /> },
    { label: 'TOTAL PHOTOS',    value: stats?.totalPhotos    ?? '—', icon: <Film size={24} /> },
    { label: "TODAY'S PHOTOS",  value: stats?.todayPhotos    ?? '—', icon: <Calendar size={24} /> },
    { label: 'ACTIVE SESSIONS', value: stats?.activeSessions ?? '—', icon: <Activity size={24} /> },
  ]

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div key={item.label} className={`stats-bar__card ${loading ? 'skeleton' : ''}`}>
          <span className="stats-bar__icon">{item.icon}</span>
          <span className="stats-bar__value retro-text">
            {loading ? ' ' : item.value}
          </span>
          <span className="stats-bar__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
