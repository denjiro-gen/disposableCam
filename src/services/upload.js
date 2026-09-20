import { supabase } from './supabase'

const BUCKET = 'event-photos'
const MAX_RETRIES = 3
const RETRY_DELAY = 1500

/**
 * Retry wrapper with exponential backoff.
 */
async function withRetry(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  try {
    return await fn()
  } catch (err) {
    if (retries <= 0) throw err
    await new Promise((res) => setTimeout(res, delay))
    return withRetry(fn, retries - 1, delay * 1.5)
  }
}

/**
 * Generate a collision-safe storage path for a photo.
 * Format: {sessionId}/photo-{number}-{uid}.jpg
 */
function buildStoragePath(sessionId, photoNumber) {
  const uid = Math.random().toString(36).substring(2, 10)
  return `${sessionId}/photo-${photoNumber}-${uid}.jpg`
}

/**
 * Upload a single photo blob to Supabase Storage.
 * Returns { storagePath, publicUrl }
 */
export async function uploadPhotoBlob(sessionId, photoNumber, blob, onProgress) {
  const storagePath = buildStoragePath(sessionId, photoNumber)

  const uploadFn = async () => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) throw new Error(`Upload error: ${error.message}`)

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    return {
      storagePath,
      publicUrl: urlData.publicUrl,
    }
  }

  const result = await withRetry(uploadFn)
  if (onProgress) onProgress()
  return result
}

/**
 * Save a photo record in the photos table.
 */
export async function savePhotoRecord({
  sessionId,
  photoNumber,
  storagePath,
  publicUrl,
  width,
  height,
}) {
  const { data, error } = await supabase
    .from('photos')
    .insert({
      session_id: sessionId,
      photo_number: photoNumber,
      storage_path: storagePath,
      public_url: publicUrl,
      width,
      height,
      filter_name: 'disposable-90s',
      is_public: true,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save photo record: ${error.message}`)
  return data
}

/**
 * Upload all photos in a session with individual progress tracking.
 * photos: Array of { blob, photoNumber, width, height }
 * onPhotoComplete: (photoNumber, status: 'success'|'error') => void
 * Returns array of photo records.
 */
export async function uploadAllPhotos(sessionId, photos, onPhotoComplete) {
  const results = []

  for (const photo of photos) {
    try {
      const { storagePath, publicUrl } = await uploadPhotoBlob(
        sessionId,
        photo.photoNumber,
        photo.blob
      )

      const record = await savePhotoRecord({
        sessionId,
        photoNumber: photo.photoNumber,
        storagePath,
        publicUrl,
        width: photo.width,
        height: photo.height,
      })

      results.push({ ...record, status: 'success' })
      if (onPhotoComplete) onPhotoComplete(photo.photoNumber, 'success')
    } catch (err) {
      console.error(`Failed to upload photo ${photo.photoNumber}:`, err)
      results.push({ photoNumber: photo.photoNumber, status: 'error', error: err.message })
      if (onPhotoComplete) onPhotoComplete(photo.photoNumber, 'error')
    }
  }

  return results
}
