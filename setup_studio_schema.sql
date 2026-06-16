-- 1. Create User Roles Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM ('listener', 'artist', 'contributor', 'admin');
  END IF;
END $$;

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role_type DEFAULT 'listener'::user_role_type NOT NULL,
  artist_id text, -- Links to artists.id if role is artist
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can update their own profiles" ON public.user_profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 3. Trigger to automatically create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role_type, 'listener'::public.user_role_type)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 4. Artist and Contributor Applications Table
CREATE TABLE IF NOT EXISTS public.artist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  real_name text NOT NULL,
  bio text NOT NULL,
  profile_image_url text NOT NULL,
  social_links jsonb,
  requested_role user_role_type DEFAULT 'artist'::user_role_type NOT NULL CHECK (requested_role IN ('artist', 'contributor')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on artist_applications
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- Create Policies for artist_applications
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own applications' AND tablename = 'artist_applications') THEN
    CREATE POLICY "Users can view their own applications" ON public.artist_applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can submit applications' AND tablename = 'artist_applications') THEN
    CREATE POLICY "Users can submit applications" ON public.artist_applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all applications' AND tablename = 'artist_applications') THEN
    CREATE POLICY "Admins can manage all applications" ON public.artist_applications
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::user_role_type
        )
      );
  END IF;
END $$;

-- 5. Extend Tracks Table for Upload Moderation
DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tracks' AND column_name='status') THEN
    ALTER TABLE public.tracks ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
    -- Set existing tracks to approved so they don't get hidden
    UPDATE public.tracks SET status = 'approved' WHERE status IS NULL;
    ALTER TABLE public.tracks ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.tracks ALTER COLUMN status SET DEFAULT 'pending'; -- New uploads start as pending
  END IF;

  -- Add uploaded_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tracks' AND column_name='uploaded_by') THEN
    ALTER TABLE public.tracks ADD COLUMN uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Lyric Submissions / Timings Table
CREATE TABLE IF NOT EXISTS public.lyric_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id text REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  language text NOT NULL CHECK (language IN ('en', 'bo')),
  lyrics jsonb NOT NULL, -- Array of LyricLine
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on lyric_submissions
ALTER TABLE public.lyric_submissions ENABLE ROW LEVEL SECURITY;

-- Create Policies for lyric_submissions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lyric submissions are readable by everyone' AND tablename = 'lyric_submissions') THEN
    CREATE POLICY "Lyric submissions are readable by everyone" ON public.lyric_submissions
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can submit lyrics' AND tablename = 'lyric_submissions') THEN
    CREATE POLICY "Authenticated users can submit lyrics" ON public.lyric_submissions
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all lyric submissions' AND tablename = 'lyric_submissions') THEN
    CREATE POLICY "Admins can manage all lyric submissions" ON public.lyric_submissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::user_role_type
        )
      );
  END IF;
END $$;
