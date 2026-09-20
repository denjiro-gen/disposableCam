import { supabase } from './supabase'

/**
 * Generate a human-readable session code like DC-A8F3K2
 */
export function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'DC-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new photo session in Supabase.
 * Returns the full session object.
 */
export async function createSession(deviceId) {
  // First, check if a session already exists for this device
  const existing = await getDeviceSession(deviceId)
  if (existing) {
    throw new Error('ALREADY_USED')
  }

  const sessionCode = generateSessionCode()

  const { data, error } = await supabase
    .from('photo_sessions')
    .insert({
      session_code: sessionCode,
      device_id: deviceId,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    // If collision (unlikely but possible), retry
    if (error.code === '23505') {
      return createSession(deviceId)
    }
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return data
}

/**
 * Mark a session as completed.
 */
export async function completeSession(sessionId) {
  const { error } = await supabase
    .from('photo_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to complete session:', error)
  }
}

/**
 * Check if a device already has a session (active or completed).
 */
export async function getDeviceSession(deviceId) {
  const { data, error } = await supabase
    .from('photo_sessions')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching device session:', error)
  }

  return data || null
}

/**
 * Fetch a session + its photos by session_code.
 */
export async function getSessionByCode(sessionCode) {
  const { data: session, error: sessionError } = await supabase
    .from('photo_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single()

  if (sessionError) {
    throw new Error(`Session not found: ${sessionError.message}`)
  }

  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('session_id', session.id)
    .order('photo_number', { ascending: true })

  if (photosError) {
    throw new Error(`Failed to load photos: ${photosError.message}`)
  }

  return { session, photos }
}

/**
 * Fetch public photos for the gallery with pagination.
 */
export async function getPublicPhotos({ page = 0, pageSize = 24 } = {}) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('photos')
    .select('*, photo_sessions(session_code, created_at)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`Failed to load gallery: ${error.message}`)
  }

  return { photos: data, total: count }
}

/**
 * Admin: get all sessions with photo counts.
 */
export async function getAllSessions({ page = 0, pageSize = 20 } = {}) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('photo_sessions')
    .select('*, photos(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { sessions: data, total: count }
}

/**
 * Admin: get all photos with session info.
 */
export async function getAllPhotos({ page = 0, pageSize = 30 } = {}) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('photos')
    .select('*, photo_sessions(session_code)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { photos: data, total: count }
}

/**
 * Admin: toggle is_public on a photo.
 */
export async function togglePhotoVisibility(photoId, isPublic) {
  const { error } = await supabase
    .from('photos')
    .update({ is_public: isPublic })
    .eq('id', photoId)

  if (error) throw new Error(error.message)
}

/**
 * Admin: delete a photo record (storage file should be deleted separately).
 */
export async function deletePhoto(photoId, storagePath) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('event-photos')
    .remove([storagePath])

  if (storageError) {
    console.warn('Storage deletion error:', storageError)
  }

  // Delete from DB
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) throw new Error(error.message)
}

/**
 * Admin: delete an entire session + all its photos.
 */
export async function deleteSession(sessionId) {
  // Get all photos first to delete from storage
  const { data: photos } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('session_id', sessionId)

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path)
    await supabase.storage.from('event-photos').remove(paths)
  }

  // Cascade delete (photos deleted via FK cascade)
  const { error } = await supabase
    .from('photo_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
}

/**
 * Admin: get aggregate stats.
 */
export async function getAdminStats() {
  const [{ count: totalSessions }, { count: totalPhotos }, { count: activeSessions }] =
    await Promise.all([
      supabase.from('photo_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase
        .from('photo_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayPhotos } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  return {
    totalSessions: totalSessions ?? 0,
    totalPhotos: totalPhotos ?? 0,
    activeSessions: activeSessions ?? 0,
    todayPhotos: todayPhotos ?? 0,
  }
}
