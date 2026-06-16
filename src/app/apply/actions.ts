'use server'

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const stageName = formData.get('stageName') as string;
  const realName = formData.get('realName') as string;
  const bio = formData.get('bio') as string;
  const profileImageUrl = formData.get('profileImageUrl') as string;
  const requestedRole = formData.get('requestedRole') as string;
  const youtube = formData.get('youtube') as string;
  const soundcloud = formData.get('soundcloud') as string;

  if (!stageName || !realName || !bio || !profileImageUrl || !requestedRole) {
    return redirect('/apply?error=Required fields are missing.');
  }

  const socialLinks = {
    youtube: youtube || '',
    soundcloud: soundcloud || '',
  };

  const { error } = await supabase.from('artist_applications').insert({
    user_id: user.id,
    stage_name: stageName,
    real_name: realName,
    bio,
    profile_image_url: profileImageUrl,
    requested_role: requestedRole,
    social_links: socialLinks,
    status: 'pending',
  });

  if (error) {
    return redirect(`/apply?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/apply');
  redirect('/apply');
}
