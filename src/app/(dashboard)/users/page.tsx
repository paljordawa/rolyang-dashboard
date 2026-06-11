import { supabaseAdmin } from '@/lib/supabase';
import UserManagerClient from './UserManagerClient';

export default async function UsersPage() {
  // Fetch users via Supabase Admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  const userList = error ? [] : (users || []);

  return (
    <div className="max-w-6xl mx-auto py-10 px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            User <span className="text-gradient">Directory</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Manage all registered users on the Rolyang platform.
          </p>
        </div>
      </div>

      <UserManagerClient initialUsers={userList} />
    </div>
  );
}
