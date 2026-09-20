import './LoadingSpinner.css'

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const inner = (
    <div className="loading-spinner">
      <div className="loading-spinner__film">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="loading-spinner__frame" style={{ '--i': i }} />
        ))}
        <div className="loading-spinner__lens">◉</div>
      </div>
      {message && <p className="loading-spinner__msg retro-text">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className="loading-spinner__overlay">{inner}</div>
  }

  return inner
}
