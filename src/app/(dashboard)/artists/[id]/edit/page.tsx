import { supabaseAdmin } from '@/lib/supabase';
import ArtistForm from '@/components/ArtistForm';
import { redirect } from 'next/navigation';

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch artist details
  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();

  if (artistError || !artist) {
    redirect('/artists');
  }

  return <ArtistForm initialData={artist} />;
}
