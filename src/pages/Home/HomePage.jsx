import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { Camera, Film, Zap, Sparkles, QrCode } from 'lucide-react'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <Header />

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__bg" aria-hidden="true">
          <div className="home-hero__grain" />
          <div className="home-hero__vignette" />
          {/* Film strip decorative */}
          <div className="home-hero__filmstrip home-hero__filmstrip--top">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="home-hero__filmhole" />
            ))}
          </div>
          <div className="home-hero__filmstrip home-hero__filmstrip--bottom">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="home-hero__filmhole" />
            ))}
          </div>
        </div>

        <div className="home-hero__inner container">
          {/* Camera icon */}
          <div className="home-hero__camera-icon" aria-hidden="true">
            <div className="home-hero__camera-body">
              <div className="home-hero__camera-lens">
                <div className="home-hero__camera-lens-inner" />
              </div>
              <div className="home-hero__camera-flash" />
            </div>
          </div>

          <div className="home-hero__tag retro-text">DIGITAL DISPOSABLE CAMERA</div>

          <h1 className="home-hero__title">
            <span className="home-hero__title-line home-hero__title-line--small">23rd</span>
            <span className="home-hero__title-line home-hero__title-line--main">FOUNDING</span>
            <span className="home-hero__title-line home-hero__title-line--main">ANNIVERSARY</span>
          </h1>

          <p className="home-hero__tagline">
            CAPTURE THE MOMENT. KEEP THE MEMORY.
          </p>

          <p className="home-hero__sub">
            A digital disposable camera for our 23rd Founding Anniversary.<br />
            7 shots. One memory.
          </p>

          <div className="home-hero__actions">
            <Link to="/camera" className="btn btn--primary btn--lg home-hero__cta">
              <Camera size={18} /> Start Camera
            </Link>
            <Link to="/gallery" className="btn btn--secondary btn--lg">
              <Film size={18} /> View Photo Archive
            </Link>
          </div>

          <div className="home-hero__info retro-text">
            NO ACCOUNT NEEDED — JUST TAKE 7 PHOTOS
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="home-how">
        <div className="container">
          <h2 className="home-how__title">HOW IT WORKS</h2>
          <div className="home-how__steps">
            {STEPS.map((step) => (
              <div key={step.num} className="home-how__step">
                <div className="home-how__step-num retro-text">{step.num}</div>
                <div className="home-how__step-icon"><step.icon size={32} /></div>
                <h3 className="home-how__step-title">{step.title}</h3>
                <p className="home-how__step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="home-cta-bottom">
        <div className="container home-cta-bottom__inner">
          <div>
            <h2 className="home-cta-bottom__title retro-text">READY TO CAPTURE?</h2>
            <p className="home-cta-bottom__sub">7 shots. One memory. No regrets.</p>
          </div>
          <Link to="/camera" className="btn btn--primary btn--lg">
            <Camera size={18} /> Start Camera
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="container home-footer__inner">
          <span className="retro-text home-footer__text">
            23RD FOUNDING ANNIVERSARY — {new Date().getFullYear()}
          </span>
          <div className="home-footer__links">
            <Link to="/gallery">Gallery</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const STEPS = [
  { num: '01', icon: Camera, title: 'Open Camera', desc: 'Allow camera access and your session starts automatically. No account needed.' },
  { num: '02', icon: Zap, title: 'Take 7 Photos', desc: 'Click the shutter up to 7 times. Preview each shot and retake if needed.' },
  { num: '03', icon: Sparkles, title: '90s Filter Applied', desc: 'Each photo gets the classic disposable-camera look: grain, warmth, vignette.' },
  { num: '04', icon: QrCode, title: 'Scan Your QR Code', desc: 'After 7 photos, scan the QR code to view and download your memories on your phone.' },
]
