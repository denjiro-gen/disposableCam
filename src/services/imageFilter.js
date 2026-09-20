/**
 * 90s Disposable Camera Film Filter
 * Processes a video frame through a series of canvas-based effects:
 *   1. Color grading (warm, lifted blacks, slight desaturation, green-yellow tint)
 *   2. Film grain (randomized per-pixel noise)
 *   3. Vignette (radial gradient darkening)
 *   4. Light leak (warm orange glow on one edge)
 *   5. Optional date/event stamp
 *
 * @param {HTMLVideoElement|HTMLCanvasElement|ImageBitmap} source
 * @param {object} options
 * @param {boolean} options.addGrain      - Enable film grain (default: true)
 * @param {boolean} options.addVignette   - Enable vignette (default: true)
 * @param {boolean} options.addLightLeak  - Enable light leak (default: true)
 * @param {boolean} options.addStamp      - Enable date/event stamp (default: true)
 * @param {number}  options.maxWidth      - Max output width in px (default: 1600)
 * @param {number}  options.jpegQuality   - JPEG output quality 0–1 (default: 0.85)
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number}>}
 */
export async function applyFilm90sFilter(source, options = {}) {
  const {
    addGrain = true,
    addVignette = true,
    addLightLeak = true,
    addStamp = true,
    maxWidth = 1600,
    jpegQuality = 0.85,
  } = options

  // ── Determine source dimensions ──────────────────────────────────────────
  const srcWidth = source.videoWidth || source.width || source.naturalWidth
  const srcHeight = source.videoHeight || source.height || source.naturalHeight

  // Scale to maxWidth if needed
  let outWidth = srcWidth
  let outHeight = srcHeight
  if (outWidth > maxWidth) {
    const scale = maxWidth / outWidth
    outWidth = Math.round(outWidth * scale)
    outHeight = Math.round(outHeight * scale)
  }

  // ── Draw source to canvas ────────────────────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  // Draw source to canvas (un-mirrored, so text is readable in selfies)
  ctx.drawImage(source, 0, 0, outWidth, outHeight)

  // ── Pixel-level color grading ────────────────────────────────────────────
  const imageData = ctx.getImageData(0, 0, outWidth, outHeight)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // 1. Lift blacks (avoid true black — disposable cameras never had true black)
    r = Math.max(r, 20)
    g = Math.max(g, 16)
    b = Math.max(b, 10)

    // 2. Warm shift + yellow-green tint (classic 90s disposable film)
    r = clamp(r + 22)
    g = clamp(g + 10)
    b = clamp(b - 20)

    // 3. Slight desaturation (reduce digital vibrancy by 18%)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    r = Math.round(r * 0.82 + lum * 0.18)
    g = Math.round(g * 0.82 + lum * 0.18)
    b = Math.round(b * 0.82 + lum * 0.18)

    // 4. Contrast: gentle S-curve (crush shadows slightly, open highlights)
    r = sCurve(r)
    g = sCurve(g)
    b = sCurve(b)

    // 5. Film grain
    if (addGrain) {
      const noise = (Math.random() - 0.5) * 28
      r = clamp(r + noise)
      g = clamp(g + noise * 0.9)
      b = clamp(b + noise * 0.8)
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  ctx.putImageData(imageData, 0, 0)

  // ── Vignette ─────────────────────────────────────────────────────────────
  if (addVignette) {
    const cx = outWidth / 2
    const cy = outHeight / 2
    const radius = Math.sqrt(cx * cx + cy * cy)

    const vignette = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(0.6, 'rgba(0,0,0,0.05)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.42)')

    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, outWidth, outHeight)
  }

  // ── Light leak (warm orange top-left) ────────────────────────────────────
  if (addLightLeak) {
    const leak = ctx.createRadialGradient(0, 0, 0, outWidth * 0.15, outHeight * 0.08, outWidth * 0.55)
    leak.addColorStop(0, 'rgba(220, 130, 50, 0.22)')
    leak.addColorStop(0.4, 'rgba(200, 100, 30, 0.08)')
    leak.addColorStop(1, 'rgba(180, 80, 20, 0)')
    ctx.fillStyle = leak
    ctx.fillRect(0, 0, outWidth, outHeight)
  }

  // ── Dust/scratch overlay (very subtle) ───────────────────────────────────
  addDustOverlay(ctx, outWidth, outHeight)

  // ── Date/event stamp ─────────────────────────────────────────────────────
  if (addStamp) {
    drawStamp(ctx, outWidth, outHeight)
  }

  // ── Export ────────────────────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export photo'))
          return
        }
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality)
        resolve({ blob, dataUrl, width: outWidth, height: outHeight })
      },
      'image/jpeg',
      jpegQuality
    )
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v, min = 0, max = 255) {
  return Math.min(max, Math.max(min, Math.round(v)))
}

/**
 * Gentle S-curve contrast: darken shadows, lift highlights slightly.
 */
function sCurve(v) {
  const x = v / 255
  let out
  if (x < 0.5) {
    out = 2 * x * x * (1 - 0.08) + x * 0.08
  } else {
    out = 1 - 2 * (1 - x) * (1 - x) * (1 - 0.08) - (1 - x) * 0.08
  }
  return clamp(out * 255)
}

/**
 * Add a handful of tiny dust dots / scratches.
 */
function addDustOverlay(ctx, w, h) {
  ctx.save()
  // Dust dots
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = Math.random() * 1.2 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(240,225,190,${Math.random() * 0.25 + 0.05})`
    ctx.fill()
  }
  // Tiny scratch lines
  for (let i = 0; i < 3; i++) {
    if (Math.random() > 0.6) {
      const x1 = Math.random() * w
      const y1 = Math.random() * h
      const x2 = x1 + (Math.random() - 0.5) * 80
      const y2 = y1 + (Math.random() - 0.5) * 30
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(255,240,200,${Math.random() * 0.15 + 0.03})`
      ctx.lineWidth = Math.random() * 0.8 + 0.2
      ctx.stroke()
    }
  }
  ctx.restore()
}

/**
 * Draw retro date/event stamp in the bottom-right corner.
 */
function drawStamp(ctx, w, h) {
  const now = new Date()
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const dateStr = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2,'0')} '${String(now.getFullYear()).slice(2)}`

  const fontSize = Math.round(w * 0.028)
  const pad = Math.round(w * 0.018)

  ctx.save()

  // Text shadow for that old amber glow
  ctx.font = `${fontSize}px 'VT323', monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'

  // Glow / shadow
  ctx.shadowColor = 'rgba(230, 160, 30, 0.8)'
  ctx.shadowBlur = 6

  ctx.fillStyle = '#E8A020'
  ctx.fillText(dateStr, w - pad, h - pad)

  // Second line: event short name
  ctx.font = `${Math.round(fontSize * 0.78)}px 'VT323', monospace`
  ctx.fillStyle = 'rgba(230, 160, 30, 0.75)'
  ctx.fillText("23RD ANNIV", w - pad, h - pad - fontSize - 2)

  ctx.restore()
}
