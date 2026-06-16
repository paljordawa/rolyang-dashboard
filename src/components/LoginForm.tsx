"use client";

import { useState } from 'react';
import { login, signInWithEmail, signUpWithEmail } from '@/app/login/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldAlert, User, Shield, KeyRound, Mail, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  message?: string;
  showAdmin?: boolean;
}

type MainTab = 'studio' | 'admin';
type StudioMode = 'signin' | 'signup';

export default function LoginForm({ message, showAdmin = false }: LoginFormProps) {
  const [mainTab, setMainTab] = useState<MainTab>(showAdmin ? 'admin' : 'studio');
  const [studioMode, setStudioMode] = useState<StudioMode>('signin');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = () => {
    setLoading(true);
    // Let Next.js Server Actions handle redirection, but show loading state
    setTimeout(() => setLoading(false), 5000);
  };

  return (
    <div className="w-full max-w-md z-10 relative">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <img src="/rolyang-logo.svg" alt="Rolyang Logo" className="h-16 w-auto relative" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Rolyang <span className="text-gradient">Studio</span>
        </h1>
        <p className="text-zinc-400 text-sm">
          {mainTab === 'studio' 
            ? 'Creator & Contributor workspace' 
            : 'System Administration Access'}
        </p>
      </div>

      <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500" />
        
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-white">
            {mainTab === 'studio' 
              ? (studioMode === 'signin' ? 'Studio Sign In' : 'Register Studio Account')
              : 'Admin Authentication'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {mainTab === 'studio'
              ? (studioMode === 'signin' ? 'Access your artist & lyric tools' : 'Apply to upload music and write lyrics')
              : 'Enter master bypass password'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {message && (
            <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {mainTab === 'studio' ? (
            /* Artist & Contributor forms */
            <div className="space-y-6">
              {/* Studio Signin / Signup Sub-tabs */}
              <div className="flex border-b border-white/10 pb-1 gap-4">
                <button
                  type="button"
                  onClick={() => setStudioMode('signin')}
                  className={`pb-2 text-sm font-medium transition-colors relative ${studioMode === 'signin' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Sign In
                  {studioMode === 'signin' && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-fuchsia-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode('signup')}
                  className={`pb-2 text-sm font-medium transition-colors relative ${studioMode === 'signup' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Create Account
                  {studioMode === 'signup' && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-fuchsia-500" />
                  )}
                </button>
              </div>

              {studioMode === 'signin' ? (
                <form action={signInWithEmail} onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500" /> Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="artist@rolyang.com"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-zinc-500" /> Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 btn-gradient border-0 text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <form action={signUpWithEmail} onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500" /> Email Address
                    </label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-zinc-500" /> Password
                    </label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="•••••••• (Min 6 characters)"
                      minLength={6}
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" /> Invite Code (Optional)
                    </label>
                    <Input
                      id="signup-invite"
                      name="inviteCode"
                      placeholder="e.g. ROLYANG-XXXX-XXXX"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                    <span className="text-[10px] text-zinc-500 block">Using a valid invite code automatically grants you instant artist/contributor access.</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500" /> Stage Name / Public Display Name
                    </label>
                    <Input
                      id="signup-stage-name"
                      name="stageName"
                      placeholder="e.g. Tenzin Dawa"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                    <span className="text-[10px] text-zinc-500 block">Required only if registering with an Artist invite code.</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 btn-gradient border-0 text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loading ? 'Creating Account...' : 'Register Account'}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* Admin form */
            <form action={login} onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-zinc-500" /> Master Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Secure Admin Sign In'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-zinc-500 mt-8">
        Authorized Rolyang Artist, Contributor, and Admin access only.
      </p>
    </div>
  );
}
