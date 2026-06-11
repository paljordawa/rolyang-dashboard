'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Trash2, CalendarDays, Mail, Clock, ShieldAlert, UserCircle, Star } from 'lucide-react';
import { deleteUser, updateUserTier } from '@/app/actions';

export default function UserManagerClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase()) || 
    user.id.includes(search)
  );

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete user ${email}? This action cannot be undone and will delete all their data.`)) return;
    
    setLoadingId(id);
    setError(null);
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingId(null);
  };

  const handleToggleTier = async (id: string, currentTier: string) => {
    const newTier = currentTier === 'paid' ? 'free' : 'paid';
    setLoadingId(id);
    setError(null);
    try {
      await updateUserTier(id, newTier);
      setUsers(users.map(u => {
        if (u.id === id) {
          return { ...u, user_metadata: { ...u.user_metadata, tier: newTier } };
        }
        return u;
      }));
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      
      {error && (
        <Alert variant="destructive">
          <ShieldAlert className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search users by email or ID..." 
            className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-zinc-600"
          />
        </div>
        <div className="text-sm font-medium text-zinc-400">
          Showing {filteredUsers.length} Users
        </div>
      </div>

      {/* Data Table */}
      <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Last Sign In</th>
                <th className="px-6 py-4 font-medium">Tier</th>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const joinedDate = new Date(user.created_at).toLocaleDateString();
                  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never';
                  const provider = user.app_metadata?.provider || 'email';
                  const tier = user.user_metadata?.tier === 'paid' ? 'paid' : 'free';
                  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'No Name';
                  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
                  
                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30 overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              <UserCircle className="w-6 h-6 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{fullName}</div>
                            <div className="text-xs text-zinc-400">{user.email}</div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5 w-32 truncate" title={user.id}>{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 flex items-center gap-2 mt-2">
                        <CalendarDays className="w-3 h-3" /> {joinedDate}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {lastSignIn}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium transition-colors ${tier === 'free' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            Free
                          </span>
                          <button
                            onClick={() => handleToggleTier(user.id, tier)}
                            disabled={loadingId === user.id}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                              tier === 'paid' ? 'bg-amber-500' : 'bg-zinc-600'
                            } ${loadingId === user.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <span 
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                                tier === 'paid' ? 'translate-x-6' : 'translate-x-1'
                              }`} 
                            />
                          </button>
                          <span className={`text-xs font-medium flex items-center transition-colors ${tier === 'paid' ? 'text-amber-400' : 'text-zinc-500'}`}>
                            {tier === 'paid' && <Star className="w-3 h-3 mr-1" />}
                            Paid
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-white/10 capitalize">
                          {provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={loadingId === user.id}
                          className="h-8 w-8 p-0 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <UserCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No users found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
