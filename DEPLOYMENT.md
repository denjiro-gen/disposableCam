# 23rd Founding Anniversary — Disposable Camera
# Deployment & Setup Guide

## 1. Run the SQL Migration

Open your Supabase project → SQL Editor → paste and run the entire contents of:

```
supabase/migrations/001_init.sql
```

This creates:
- `photo_sessions` table
- `photos` table
- All indexes
- Row Level Security policies
- `event-photos` storage bucket (public)
- Storage bucket policies

## 2. Verify Storage Bucket

Go to Supabase Dashboard → Storage → confirm `event-photos` bucket exists and is set to **Public**.

If the SQL bucket creation didn't work (some Supabase tiers restrict this), create it manually:
- Name: `event-photos`
- Public: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

## 3. Local Development

```bash
npm install
npm run dev
```

Open: http://localhost:5173

## 4. Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo in the Vercel dashboard.

**Environment Variables to set in Vercel:**
```
VITE_SUPABASE_URL=https://ahjszqtcxuugvgqriifj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_PASSWORD=admin2024
```

## 5. Deploy to Netlify

```bash
npm run build
```

Drag the `dist/` folder into Netlify dashboard. Or connect GitHub.

Add the same environment variables in Netlify → Site settings → Environment variables.

## 6. Deploy to Cloudflare Pages

```bash
npm run build
```

Upload `dist/` via Cloudflare Pages dashboard.

## 7. Admin Access

Go to `/admin` → enter the password from `VITE_ADMIN_PASSWORD`.

Default: `admin2024` — **change this before your event!**

## 8. User Flow

1. Open `/` → START CAMERA
2. Allow camera in browser
3. Take up to 7 photos (unlimited retakes)
4. Upload completes automatically
5. Scan QR code with phone
6. View photos at `/session/{code}`
7. All public photos visible at `/gallery`

## 9. Routes

| URL | Page |
|-----|------|
| `/` | Landing page |
| `/camera` | Take photos |
| `/session/:code` | Personal photo gallery |
| `/gallery` | Public event archive |
| `/admin` | Admin login |
| `/admin/dashboard` | Admin dashboard |

## 10. Security Notes

- The `VITE_SUPABASE_ANON_KEY` is intentionally public — it's the anonymous key, not the service role key
- The admin password (`VITE_ADMIN_PASSWORD`) is the only protection for admin actions
- RLS policies allow any anon user to insert/read — appropriate for a public event system
- For stricter security, add Supabase Auth + admin role after the event

## 11. Concurrent Users

Each user gets a unique `session_code` (format: `DC-XXXXXX`).
Photos are stored at `event-photos/{session_uuid}/photo-{n}-{uid}.jpg` — collision-proof.
Multiple users uploading simultaneously is fully supported.

## 12. Photo Moderation

In Admin Dashboard → Photos tab:
- **Hide**: sets `is_public = false` (photo disappears from gallery, stays in session page)
- **Show**: sets `is_public = true` (photo reappears in gallery)
- **Delete**: permanently removes from storage and database

## 13. Storage Estimates

| Sessions | Photos | Estimated Storage |
|----------|--------|-------------------|
| 50 | 350 | ~500 MB |
| 100 | 700 | ~1 GB |
| 500 | 3,500 | ~5 GB |

Photos are compressed to max 1600px JPEG at 85% quality (~200-800 KB each).

Supabase free tier includes 1 GB storage.
Supabase Pro includes 100 GB storage.
