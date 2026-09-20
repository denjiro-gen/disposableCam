/**
 * Compress an image Blob to a target max width and JPEG quality.
 * @param {Blob} blob - Source image blob
 * @param {number} maxWidth - Max output width in pixels
 * @param {number} quality - JPEG quality 0–1
 * @returns {Promise<Blob>}
 */
export async function compressImage(blob, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (compressed) => {
          if (!compressed) reject(new Error('Compression failed'))
          else resolve(compressed)
        },
        'image/jpeg',
        quality
      )

      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Convert a dataURL to a Blob.
 */
export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}
