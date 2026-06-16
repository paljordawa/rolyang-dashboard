'use server'

import { createClient, createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

async function logAdminAction(actionType: string, targetId: string, details: string) {
  const supabase = createAdminClient();
  let adminId = null;
  try {
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (user) adminId = user.id;
  } catch (e) {
    // Ignore if not authenticated via Supabase (e.g. Master Admin bypass session)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action_type: actionType,
    target_id: targetId,
    details,
  });
}

export async function approveApplication(applicationId: string) {
  const supabase = createAdminClient();

  // 1. Fetch application details
  const { data: application, error: fetchErr } = await supabase
    .from('artist_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (fetchErr || !application) {
    throw new Error('Application not found.');
  }

  // 2. Perform actions depending on requested role
  let artistId = null;
  if (application.requested_role === 'artist') {
    artistId = slugify(application.stage_name) + '-' + Math.random().toString(36).substring(2, 6);

    // Create record in public.artists table
    const { error: artistErr } = await supabase
      .from('artists')
      .insert({
        id: artistId,
        name: application.stage_name,
        bio: application.bio,
        image_url: application.profile_image_url,
        followers: '0',
      });

    if (artistErr) throw artistErr;
  }

  // 3. Update public.user_profiles
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .update({
      role: application.requested_role,
      artist_id: artistId,
    })
    .eq('id', application.user_id);

  if (profileErr) throw profileErr;

  // 4. Update auth.users metadata so role is embedded in JWT
  const { error: authErr } = await supabase.auth.admin.updateUserById(
    application.user_id,
    {
      user_metadata: {
        role: application.requested_role,
        artist_id: artistId,
      }
    }
  );

  if (authErr) throw authErr;

  // 5. Approve application status
  const { error: appErr } = await supabase
    .from('artist_applications')
    .update({ status: 'approved' })
    .eq('id', applicationId);

  if (appErr) throw appErr;

  // Log action
  await logAdminAction(
    'approve_application',
    applicationId,
    `Approved application for user ID ${application.user_id} as role ${application.requested_role} (Stage name: ${application.stage_name}).`
  );

  revalidatePath('/moderation');
}

export async function rejectApplication(applicationId: string, notes: string) {
  const supabase = createAdminClient();

  // Fetch application details to log
  const { data: application } = await supabase
    .from('artist_applications')
    .select('user_id, stage_name')
    .eq('id', applicationId)
    .single();

  const { error } = await supabase
    .from('artist_applications')
    .update({
      status: 'rejected',
      moderator_notes: notes,
    })
    .eq('id', applicationId);

  if (error) throw error;

  // Log action
  await logAdminAction(
    'reject_application',
    applicationId,
    `Rejected application for user ID ${application?.user_id || 'unknown'} (Stage name: ${application?.stage_name || 'unknown'}) with notes: "${notes}".`
  );

  revalidatePath('/moderation');
}

export async function approveTrack(trackId: string) {
  const supabase = createAdminClient();

  // Fetch track title to log
  const { data: track } = await supabase
    .from('tracks')
    .select('title, artist_id')
    .eq('id', trackId)
    .single();

  const { error } = await supabase
    .from('tracks')
    .update({ status: 'approved' })
    .eq('id', trackId);

  if (error) throw error;

  // Log action
  await logAdminAction(
    'approve_track',
    trackId,
    `Approved track "${track?.title || trackId}" by artist ${track?.artist_id || 'unknown'}.`
  );

  revalidatePath('/moderation');
}

export async function rejectTrack(trackId: string) {
  const supabase = createAdminClient();

  // Fetch track title to log
  const { data: track } = await supabase
    .from('tracks')
    .select('title, artist_id')
    .eq('id', trackId)
    .single();

  const { error } = await supabase
    .from('tracks')
    .update({ status: 'rejected' })
    .eq('id', trackId);

  if (error) throw error;

  // Log action
  await logAdminAction(
    'reject_track',
    trackId,
    `Rejected track "${track?.title || trackId}" by artist ${track?.artist_id || 'unknown'}.`
  );

  revalidatePath('/moderation');
}

export async function approveLyrics(submissionId: string) {
  const supabase = createAdminClient();

  // 1. Fetch lyric details
  const { data: submission, error: fetchErr } = await supabase
    .from('lyric_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (fetchErr || !submission) {
    throw new Error('Lyric submission not found.');
  }

  // 2. Write approved lyrics to public.tracks
  const { error: trackErr } = await supabase
    .from('tracks')
    .update({ lyrics: submission.lyrics })
    .eq('id', submission.track_id);

  if (trackErr) throw trackErr;

  // 3. Mark submission as approved
  const { error: subErr } = await supabase
    .from('lyric_submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId);

  if (subErr) throw subErr;

  // Log action
  await logAdminAction(
    'approve_lyrics',
    submissionId,
    `Approved timed lyrics (lang: ${submission.language}) for track ID ${submission.track_id}.`
  );

  revalidatePath('/moderation');
}

export async function rejectLyrics(submissionId: string, notes: string) {
  const supabase = createAdminClient();

  // Fetch submission to log
  const { data: submission } = await supabase
    .from('lyric_submissions')
    .select('track_id, language')
    .eq('id', submissionId)
    .single();

  const { error } = await supabase
    .from('lyric_submissions')
    .update({
      status: 'rejected',
      moderator_notes: notes,
    })
    .eq('id', submissionId);

  if (error) throw error;

  // Log action
  await logAdminAction(
    'reject_lyrics',
    submissionId,
    `Rejected timed lyrics (lang: ${submission?.language || 'unknown'}) for track ID ${submission?.track_id || 'unknown'} with notes: "${notes}".`
  );

  revalidatePath('/moderation');
}
