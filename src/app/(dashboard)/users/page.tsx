import { supabaseAdmin } from '@/lib/supabase';
import UserManagerClient from './UserManagerClient';

export default async function UsersPage() {
  // Fetch users via Supabase Admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  const userList = error ? [] : (users || []);

  return (
    <div className="w-full py-8 px-6 space-y-6">


      <div>
        <UserManagerClient initialUsers={userList} />
      </div>
    </div>
  );
}
