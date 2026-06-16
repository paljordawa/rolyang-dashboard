import { createClient } from '@/lib/server';
import { submitApplication } from './actions';
import { logout } from '@/app/login/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, CheckCircle, Clock, XCircle, LogOut, Radio, PenTool } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ApplyPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the latest application for this user
  const { data: application } = await supabase
    .from('artist_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-2xl z-10 relative my-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/rolyang-logo.svg" alt="Rolyang Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white tracking-wider">Rolyang Studio</span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" className="text-zinc-400 hover:text-red-400 hover:bg-white/5 gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {application ? (
          /* Application Status Screen */
          <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex items-center justify-center">
                {application.status === 'pending' && (
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>
                )}
                {application.status === 'approved' && (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                )}
                {application.status === 'rejected' && (
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl text-white">
                {application.status === 'pending' && 'Application Under Review'}
                {application.status === 'approved' && 'Application Approved!'}
                {application.status === 'rejected' && 'Application Declined'}
              </CardTitle>
              <CardDescription className="text-zinc-400 max-w-md mx-auto mt-2">
                {application.status === 'pending' && 'We are currently reviewing your request to join Rolyang Studio. We will update your role as soon as possible.'}
                {application.status === 'approved' && 'Your creator status has been verified! Refresh the page to access your new creator dashboard.'}
                {application.status === 'rejected' && 'Unfortunately, we are unable to approve your application at this time.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Submitted Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block">Stage/Pen Name</span>
                    <span className="text-white font-medium">{application.stage_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Requested Role</span>
                    <span className="text-white font-medium capitalize">{application.requested_role}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block">Biography</span>
                    <p className="text-zinc-300 mt-1 text-xs leading-relaxed">{application.bio}</p>
                  </div>
                </div>
              </div>

              {application.status === 'rejected' && application.moderator_notes && (
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/5 text-red-300">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <AlertDescription>
                    <span className="font-semibold block mb-1">Feedback from Moderator:</span>
                    {application.moderator_notes}
                  </AlertDescription>
                </Alert>
              )}

              {application.status === 'approved' && (
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full h-11 btn-gradient border-0 text-white font-semibold shadow-lg shadow-violet-500/20"
                >
                  Enter Studio Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Application Form */
          <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500" />
            <CardHeader>
              <CardTitle className="text-2xl text-white">Apply for Creator Account</CardTitle>
              <CardDescription className="text-zinc-400">
                Submit your details to activate your Artist or Contributor workspace in Rolyang Studio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchParams?.error && (
                <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-300">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <AlertDescription>{searchParams.error}</AlertDescription>
                </Alert>
              )}

              <form action={submitApplication} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stage/Pen Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Stage / Pen Name</label>
                    <Input
                      id="stageName"
                      name="stageName"
                      required
                      placeholder="e.g., Tenzin Dawa"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>

                  {/* Real Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Real Name (Confidential)</label>
                    <Input
                      id="realName"
                      name="realName"
                      required
                      placeholder="e.g., Tenzin Gyatso"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requested Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Requested Role</label>
                    <select
                      id="requestedRole"
                      name="requestedRole"
                      required
                      className="flex h-11 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="artist" className="bg-zinc-950 text-white">Artist (Upload songs & albums)</option>
                      <option value="contributor" className="bg-zinc-950 text-white">Contributor (Translate & sync lyrics)</option>
                    </select>
                  </div>

                  {/* Profile Image URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Profile Image URL</label>
                    <Input
                      id="profileImageUrl"
                      name="profileImageUrl"
                      required
                      placeholder="e.g., https://example.com/avatar.jpg"
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                </div>

                {/* Biography */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Biography / Introduction</label>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    placeholder="Tell us about yourself, your musical journey, or translation experience..."
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* External Social Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300 border-b border-white/5 pb-2">Verification Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">YouTube Channel URL (Optional)</label>
                      <Input
                        id="youtube"
                        name="youtube"
                        placeholder="https://youtube.com/c/yourchannel"
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">SoundCloud Profile URL (Optional)</label>
                      <Input
                        id="soundcloud"
                        name="soundcloud"
                        placeholder="https://soundcloud.com/yourprofile"
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-10"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 btn-gradient border-0 text-white font-semibold shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
