'use server'

import { createClient, createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const role = user.user_metadata?.role || 'listener';
  const artistId = user.user_metadata?.artist_id || null;

  const displayName = formData.get('displayName') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatarFile') as File | null;
  let avatarUrl = formData.get('currentAvatarUrl') as string || '';

  if (!displayName) {
    return redirect('/profile?error=Display name is required.');
  }

  try {
    // 1. Upload avatar image if a new one is selected
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop() || 'jpg';
      let filePath = `users/${user.id}/profile_${Date.now()}.${fileExt}`;
      
      if (role === 'artist' && artistId) {
        filePath = `artists/${artistId}/profile_${Date.now()}.${fileExt}`;
      }
      
      const { error: uploadErr } = await adminSupabase.storage
        .from('media')
        .upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        });

      if (uploadErr) {
        throw new Error(`Failed to upload avatar: ${uploadErr.message}`);
      }

      const { data: publicUrlData } = adminSupabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      // Clean up the old avatar from storage if it exists
      if (avatarUrl) {
        try {
          const urlObj = new URL(avatarUrl);
          const pathParts = urlObj.pathname.split('/media/');
          if (pathParts.length > 1) {
            const oldPath = decodeURIComponent(pathParts[1]);
            // Only delete if it's in our managed storage structure (e.g. artists/, users/, or avatars/)
            if (oldPath.startsWith('artists/') || oldPath.startsWith('users/') || oldPath.startsWith('avatars/')) {
              await adminSupabase.storage.from('media').remove([oldPath]);
            }
          }
        } catch (e) {
          console.warn("Failed to clean up old avatar file:", e);
        }
      }

      avatarUrl = newAvatarUrl;
    }

    // 2. If user is an artist, update the artists table
    if (role === 'artist' && artistId) {
      const { error: artistErr } = await adminSupabase
        .from('artists')
        .update({
          name: displayName,
          bio: bio || '',
          image_url: avatarUrl || '',
        })
        .eq('id', artistId);

      if (artistErr) throw artistErr;
    }

    // 3. Update user metadata in auth.users
    const { error: authErr } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          stage_name: displayName,
          avatar_url: avatarUrl || '',
        }
      }
    );

    if (authErr) throw authErr;

  } catch (err: any) {
    console.error('Error updating profile:', err);
    return redirect(`/profile?error=${encodeURIComponent(err.message || 'Failed to update profile.')}`);
  }

  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  return redirect('/profile?success=Profile updated successfully!');
}
