# Rolyang Admin Dashboard

The official Admin Dashboard for the **Rolyang Music App**. 
This project is an internal management tool designed to have direct access to the main Rolyang Supabase database, allowing administrators to manage users, artists, tracks, and marketing banners with ease.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS & Custom UI Components
- **Backend & Storage:** Supabase (Service Role)
- **Authentication:** Custom Master Password (Cookie-based)

## Connection to Rolyang App
This dashboard shares the same Supabase backend as the main Rolyang Music App. Changes made in this dashboard instantly reflect in the mobile app. For example:
- **Audio Files:** Tracks uploaded here are streamed directly by the mobile app.
- **User Tiers:** Toggling a user to "Paid" immediately unlocks premium features for them in the Rolyang app.
- **Featured Banners:** Reordering banners instantly updates the mobile app's home screen carousel.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_PASSWORD=your_secure_master_password
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Documentation
For detailed architecture and feature breakdowns, see `documentation.md`.
For future plans and features, see `roadmap.md`.
