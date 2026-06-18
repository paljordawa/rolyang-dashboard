import LyricsEditor from '@/components/LyricsEditor';
import { createClient } from '@/lib/server';
import { cookies } from 'next/headers';

export default async function LyricsPage() {
  const cookieStore = await cookies();
  const isAdminCookie = cookieStore.get('rolyang_admin_session')?.value === 'true';

  let role = 'listener';
  let artistId: string | null = null;
  let userId: string | null = null;

  if (isAdminCookie) {
    role = 'admin';
  } else {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        role = user.user_metadata?.role || 'listener';
        artistId = user.user_metadata?.artist_id || null;
        userId = user.id;
      }
    } catch (err) {
      console.error('Error fetching role in lyrics/page.tsx:', err);
    }
  }

  return <LyricsEditor userId={userId} userRole={role} artistId={artistId} />;
}
