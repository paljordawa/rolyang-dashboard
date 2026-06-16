import { createClient, createAdminClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage(props: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role || 'listener';
  const artistId = user.user_metadata?.artist_id || null;

  let currentProfile = {
    name: user.user_metadata?.stage_name || user.email?.split('@')[0] || '',
    bio: '',
    imageUrl: user.user_metadata?.avatar_url || '',
  };

  // If the user is an artist, pull their actual bio and details from the artists database table
  if (role === 'artist' && artistId) {
    const { data: artist } = await adminSupabase
      .from('artists')
      .select('name, bio, image_url')
      .eq('id', artistId)
      .single();

    if (artist) {
      currentProfile = {
        name: artist.name,
        bio: artist.bio || '',
        imageUrl: artist.image_url || '',
      };
    }
  }

  return (
    <div className="w-full py-10 px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Profile <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-zinc-400 text-lg">Update your stage name, biographical information, and profile picture.</p>
      </div>

      <ProfileForm 
        initialProfile={currentProfile} 
        role={role}
        success={searchParams?.success}
        error={searchParams?.error}
      />
    </div>
  );
}
