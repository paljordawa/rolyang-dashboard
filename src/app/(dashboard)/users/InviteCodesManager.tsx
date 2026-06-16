"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Trash2, Sparkles, Loader2, Copy, Ticket, Check } from 'lucide-react';
import { createInviteCode, deleteInviteCode } from './actions';

interface InviteCode {
  code: string;
  role: 'artist' | 'contributor';
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  user_profiles?: {
    email: string;
  } | null;
}

interface InviteCodesManagerProps {
  initialCodes: InviteCode[];
}

export default function InviteCodesManager({ initialCodes }: InviteCodesManagerProps) {
  const [codes, setCodes] = useState<InviteCode[]>(initialCodes);
  const [roleSelect, setRoleSelect] = useState<'artist' | 'contributor'>('artist');
  const [generating, setGenerating] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await createInviteCode(roleSelect);
      if (res?.success) {
        // Optimistically add code (we don't have all joined profile details but that's fine)
        const newCode: InviteCode = {
          code: res.code,
          role: roleSelect,
          is_used: false,
          used_by: null,
          used_at: null,
          created_at: new Date().toISOString(),
          user_profiles: null
        };
        setCodes([newCode, ...codes]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to revoke/delete invite code ${code}?`)) return;
    setDeletingCode(code);
    setError(null);
    try {
      const res = await deleteInviteCode(code);
      if (res?.success) {
        setCodes(codes.filter(c => c.code !== code));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete invite code.');
    } finally {
      setDeletingCode(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Generate Invite Code Form */}
      <Card className="glass-card border-white/10 shadow-xl overflow-hidden h-fit">
        <CardHeader className="bg-black/40 border-b border-white/10">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            Generate Code
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Create single-use signup bypass codes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <ShieldAlert className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target User Role</label>
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setRoleSelect('artist')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${roleSelect === 'artist' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Artist
              </button>
              <button
                type="button"
                onClick={() => setRoleSelect('contributor')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${roleSelect === 'contributor' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Contributor
              </button>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-11 btn-gradient border-0 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-75"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Invite Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Invite Codes list */}
      <Card className="glass-card border-white/10 shadow-xl overflow-hidden lg:col-span-2">
        <CardHeader className="bg-black/40 border-b border-white/10">
          <CardTitle className="text-lg text-white">Active & Used Codes</CardTitle>
          <CardDescription className="text-zinc-400">
            Monitor and revoke active invite codes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Invite Code</th>
                  <th className="px-6 py-4 font-medium text-center">Role</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium">Used By</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {codes.length > 0 ? (
                  codes.map((code) => {
                    const email = code.user_profiles?.email || 'N/A';
                    return (
                      <tr key={code.code} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-white flex items-center gap-2">
                          {code.code}
                          <button
                            onClick={() => handleCopy(code.code)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${code.role === 'artist' ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20'}`}>
                            {code.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {code.is_used ? (
                            <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-500/20 font-bold">Used</span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 select-all truncate max-w-[150px]">
                          {email}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingCode === code.code}
                            onClick={() => handleDelete(code.code)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/5 h-8 w-8 p-0 cursor-pointer"
                          >
                            {deletingCode === code.code ? (
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-zinc-500">
                      <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No invite codes generated yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
