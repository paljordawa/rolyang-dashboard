-- 1. Create Invite Codes Table
CREATE TABLE IF NOT EXISTS public.invite_codes (
  code text PRIMARY KEY,
  role public.user_role_type DEFAULT 'artist'::public.user_role_type NOT NULL CHECK (role IN ('artist', 'contributor')),
  is_used boolean DEFAULT false NOT NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Create Policies for invite_codes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can check invite codes during signup' AND tablename = 'invite_codes') THEN
    CREATE POLICY "Anyone can check invite codes during signup" ON public.invite_codes
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage invite codes' AND tablename = 'invite_codes') THEN
    CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;


-- 2. Create Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_id text,
  details text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies for admin_audit_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view audit logs' AND tablename = 'admin_audit_logs') THEN
    CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;


-- 3. Alter Banners Table to support dates & clicks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='start_date') THEN
    ALTER TABLE public.banners ADD COLUMN start_date timestamp with time zone;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='end_date') THEN
    ALTER TABLE public.banners ADD COLUMN end_date timestamp with time zone;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='click_count') THEN
    ALTER TABLE public.banners ADD COLUMN click_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;


-- 4. Create increment_banner_clicks function to safely track clicks without bypassing RLS for updates
CREATE OR REPLACE FUNCTION public.increment_banner_clicks(banner_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.banners
  SET click_count = click_count + 1
  WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 5. Enable RLS on Banners and add policy for public select
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public banners are viewable by everyone' AND tablename = 'banners') THEN
    CREATE POLICY "Public banners are viewable by everyone" ON public.banners
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage banners' AND tablename = 'banners') THEN
    CREATE POLICY "Admins can manage banners" ON public.banners
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'::public.user_role_type
        )
      );
  END IF;
END $$;

