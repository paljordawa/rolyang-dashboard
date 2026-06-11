# Rolyang Admin Dashboard - Full Documentation

## 1. System Overview
The Rolyang Admin Dashboard is a Next.js application built to serve as the control center for the Rolyang Music App. It bypasses Row Level Security (RLS) using the Supabase Service Role Key to give administrators unhindered CRUD capabilities across the entire database.

## 2. Authentication Architecture
The dashboard uses an **Isolated Master Password System** to keep admin access entirely separate from the main Rolyang App's user base.

- **Storage:** The password is set via the `ADMIN_PASSWORD` environment variable.
- **Verification:** `src/app/login/actions.ts` verifies the entered password.
- **State:** A secure, HTTP-only cookie (`rolyang_admin_session`) is created upon successful login.
- **Protection:** Next.js Middleware (`src/middleware.ts`) intercepts all routes (except `/login`). If the cookie is missing or invalid, the user is redirected to the login portal.

## 3. Database Management

### 3.1 Users Management
- **Table:** Supabase `auth.users`
- **Features:** View email, join date, last login, and OAuth Provider.
- **Tier Toggling:** Admins can manually toggle users between `Free` and `Paid`. This data is saved directly to `user_metadata.tier`, which the main Rolyang app reads.

### 3.2 Artist Management
- **Tables:** `artists`, `albums`, `tracks`
- **Features:** 
  - Create new artists with biographies, social links, and cover photos.
  - Drill down into specific artists to edit their media.
  - Manage all albums and tracks belonging to that artist.
- **Storage:** Images are stored in the `media/artists/` and `media/albums/` buckets.

### 3.3 Media Uploads
- **Storage Buckets:** Everything is stored under the single unified `media` bucket, separated by folders (`audio/`, `artists/`, `banners/`, `albums/`).
- **Features:** 
  - Bulk track uploading for albums.
  - Real-time conversion mapping to associate audio files with database `tracks` records.

### 3.4 Marketing & Banners
- **Table:** `banners`
- **Features:** 
  - Upload promotional images.
  - Link banners to external URLs.
  - Drag-and-drop reordering (updates the `sort_order` column).
- **Rolyang App Sync:** The mobile app fetches banners ordered by `sort_order` to display in the home carousel.

## 4. UI/UX Design System
The dashboard employs a modern, dark-themed glassmorphism aesthetic.
- **Components:** Reusable UI components (Buttons, Inputs, Cards) located in `src/components/ui/`.
- **Layout:** A persistent `Sidebar.tsx` and sticky Header wrapped in a `(dashboard)` Route Group to isolate it from public pages like Login.

## 5. Security Considerations
- **Environment Variables:** The `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed to the client-side (`NEXT_PUBLIC_`). It is strictly used in Server Actions.
- **Media Safety:** File uploads sanitize filenames using random strings (`Math.random().toString(36)`) to prevent overwrite collisions in the storage bucket.
