import { supabaseAdmin } from '@/lib/supabase';
import UserManagerClient from './UserManagerClient';
import InviteCodesManager from './InviteCodesManager';

export default async function UsersPage() {
  // Fetch users via Supabase Admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  const userList = error ? [] : (users || []);

  // Fetch invite codes joined with profiles email
  const { data: codesObj } = await supabaseAdmin
    .from('invite_codes')
    .select('*, user_profiles(email)')
    .order('created_at', { ascending: false });
  const inviteCodes = codesObj || [];

  return (
    <div className="w-full py-10 px-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            User & Access <span className="text-gradient">Control</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Manage registered users, generate onboarding invite codes, and monitor system access.
          </p>
        </div>
      </div>

      {/* Invite Codes Manager Section */}
      <InviteCodesManager initialCodes={inviteCodes} />

      {/* User List Directory */}
      <div className="pt-6 border-t border-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">User Directory</h2>
        <UserManagerClient initialUsers={userList} />
      </div>
    </div>
  );
}
