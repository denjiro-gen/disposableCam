/**
 * Play a shutter click sound using the Web Audio API.
 * No external file required — generated programmatically.
 */
export function playShutterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Create a short noise burst (the "click")
    const bufferSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      // Exponential decay envelope on white noise
      const decay = Math.exp(-i / (ctx.sampleRate * 0.012))
      data[i] = (Math.random() * 2 - 1) * decay * 0.7
    }

    // Add a low-frequency thud
    const thudBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const thudData = thudBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      const decay = Math.exp(-i / (ctx.sampleRate * 0.05))
      thudData[i] = Math.sin(2 * Math.PI * 180 * t) * decay * 0.4
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer

    const thudSource = ctx.createBufferSource()
    thudSource.buffer = thudBuffer

    // Apply a bandpass filter to shape the click
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2800
    filter.Q.value = 0.5

    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    noiseSource.connect(filter)
    filter.connect(gainNode)
    thudSource.connect(gainNode)
    gainNode.connect(ctx.destination)

    noiseSource.start()
    thudSource.start()

    // Clean up
    noiseSource.onended = () => ctx.close()
  } catch (e) {
    console.warn('Shutter sound not available:', e)
  }
}
