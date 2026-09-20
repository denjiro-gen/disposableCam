import { useState } from 'react'
import { deleteSession, togglePhotoVisibility, deletePhoto } from '../../services/session'
import './SessionTable.css'

export default function SessionTable({ sessions, onRefresh }) {
  const [expanding, setExpanding] = useState(null)
  const [busy, setBusy] = useState(null)

  const handleDelete = async (session) => {
    if (!window.confirm(`Delete session ${session.session_code} and all its photos? This cannot be undone.`)) return
    setBusy(session.id)
    try {
      await deleteSession(session.id)
      onRefresh()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setBusy(null)
    }
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="session-table__empty">
        <p>No sessions found.</p>
      </div>
    )
  }

  return (
    <div className="session-table-wrap">
      <table className="session-table">
        <thead>
          <tr>
            <th>Session Code</th>
            <th>Photos</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const photoCount = session.photos?.[0]?.count ?? session.photos?.length ?? '—'
            return (
              <tr key={session.id}>
                <td>
                  <span className="retro-text session-table__code">{session.session_code}</span>
                </td>
                <td>{photoCount} / 7</td>
                <td>
                  <span className={`badge badge--${session.status}`}>
                    {session.status}
                  </span>
                </td>
                <td className="session-table__date">
                  {new Date(session.created_at).toLocaleString()}
                </td>
                <td>
                  <div className="session-table__actions">
                    <a
                      href={`/session/${session.session_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn--ghost btn--sm"
                    >
                      View
                    </a>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(session)}
                      disabled={busy === session.id}
                    >
                      {busy === session.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
