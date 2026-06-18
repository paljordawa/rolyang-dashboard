-- add_dashboard_extensions.sql
-- Run this script in the Supabase SQL Editor to add advanced dashboard features support.

-- 1. System Notifications Table
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('global', 'direct')),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'sent' NOT NULL CHECK (status IN ('sent', 'read')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own direct or global notifications' AND tablename = 'system_notifications') THEN
    CREATE POLICY "Users can view their own direct or global notifications" ON public.system_notifications
      FOR SELECT USING (
        type = 'global' OR auth.uid() = recipient_id OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage notifications' AND tablename = 'system_notifications') THEN
    CREATE POLICY "Admins can manage notifications" ON public.system_notifications
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;


-- 2. Royalty Payments Table
CREATE TABLE IF NOT EXISTS public.royalty_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id text NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  stream_count integer NOT NULL DEFAULT 0,
  payout_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.royalty_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists can view their own royalties' AND tablename = 'royalty_payments') THEN
    CREATE POLICY "Artists can view their own royalties" ON public.royalty_payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.artist_id = royalty_payments.artist_id
        ) OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage royalties' AND tablename = 'royalty_payments') THEN
    CREATE POLICY "Admins can manage royalties" ON public.royalty_payments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;


-- 3. Content Dispute Center Table
CREATE TABLE IF NOT EXISTS public.content_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id text NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_type text NOT NULL CHECK (claim_type IN ('copyright', 'metadata', 'inappropriate', 'other')),
  description text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  moderator_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.content_disputes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own reports' AND tablename = 'content_disputes') THEN
    CREATE POLICY "Users can view their own reports" ON public.content_disputes
      FOR SELECT USING (
        auth.uid() = reporter_id OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can submit disputes' AND tablename = 'content_disputes') THEN
    CREATE POLICY "Authenticated users can submit disputes" ON public.content_disputes
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND auth.uid() = reporter_id
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage disputes' AND tablename = 'content_disputes') THEN
    CREATE POLICY "Admins can manage disputes" ON public.content_disputes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;


-- 4. Track Plays Table (Streaming Insights / Analytics)
CREATE TABLE IF NOT EXISTS public.track_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id text NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listener_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listener_location text NOT NULL, -- Location name like Lhasa, Dharamshala, New York
  played_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.track_plays ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Track plays are viewable by everyone' AND tablename = 'track_plays') THEN
    CREATE POLICY "Track plays are viewable by everyone" ON public.track_plays
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can log a track play' AND tablename = 'track_plays') THEN
    CREATE POLICY "Anyone can log a track play" ON public.track_plays
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
