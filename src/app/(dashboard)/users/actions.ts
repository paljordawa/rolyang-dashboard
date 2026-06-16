'use server'

import { createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Helper to check if current user is admin
async function checkIsAdmin() {
  const cookieStore = await cookies();
  const isAdminCookie = cookieStore.get('rolyang_admin_session')?.value === 'true';
  if (isAdminCookie) return true;

  const adminSupabase = createAdminClient();
  const { data: { user } } = await adminSupabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function createInviteCode(role: 'artist' | 'contributor') {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }

  const adminSupabase = createAdminClient();
  
  // Generate random code ROLYANG-[ROLE]-[RANDOM]
  const randomSegment = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roleSegment = role === 'artist' ? 'ARTIST' : 'CONTRIB';
  const code = `ROLYANG-${roleSegment}-${randomSegment}`;

  const { error } = await adminSupabase
    .from('invite_codes')
    .insert({
      code,
      role,
      is_used: false,
    });

  if (error) {
    throw new Error(`Failed to create invite code: ${error.message}`);
  }

  // Log action
  await adminSupabase.from('admin_audit_logs').insert({
    action_type: 'create_invite_code',
    target_id: code,
    details: `Generated new invite code ${code} for role ${role}.`,
  });

  revalidatePath('/users');
  return { success: true, code };
}

export async function deleteInviteCode(code: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('invite_codes')
    .delete()
    .eq('code', code);

  if (error) {
    throw new Error(`Failed to delete invite code: ${error.message}`);
  }

  // Log action
  await adminSupabase.from('admin_audit_logs').insert({
    action_type: 'delete_invite_code',
    target_id: code,
    details: `Deleted/Revoked invite code ${code}.`,
  });

  revalidatePath('/users');
  return { success: true };
}
