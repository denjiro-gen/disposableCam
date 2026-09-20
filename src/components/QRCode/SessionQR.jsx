import { QRCodeSVG } from 'qrcode.react'
import { getSessionUrl } from '../../utils/qr'
import './SessionQR.css'

export default function SessionQR({ sessionCode }) {
  const url = getSessionUrl(sessionCode)

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {})
  }

  return (
    <div className="session-qr">
      <div className="session-qr__card">
        <div className="session-qr__qr-wrap">
          <QRCodeSVG
            value={url}
            size={200}
            bgColor="#F3EBDD"
            fgColor="#102A20"
            level="H"
            includeMargin
          />
        </div>
        <div className="session-qr__info">
          <p className="retro-text session-qr__code">{sessionCode}</p>
          <p className="session-qr__hint">Scan with your phone to view your photos</p>
          <div className="session-qr__url-row">
            <span className="session-qr__url">{url}</span>
            <button
              className="btn btn--ghost btn--sm"
              onClick={copyLink}
              title="Copy link"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
