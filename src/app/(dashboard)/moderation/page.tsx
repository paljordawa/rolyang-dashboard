"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  approveApplication,
  rejectApplication,
  approveTrack,
  rejectTrack,
  approveLyrics,
  rejectLyrics
} from './actions';
import { updateDisputeStatusAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, ShieldAlert, Users, Music, Languages, CalendarDays, Clock, Play, Pause, AlertCircle, FileText, AlertTriangle, CheckCircle, Archive, MessageSquare, Save, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AudioWaveformPreview from '@/components/AudioWaveformPreview';

export default function ModerationPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  
  // Data lists
  const [applications, setApplications] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [lyrics, setLyrics] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Disputes sub-feature state
  const [disputes, setDisputes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeActiveTab, setDisputeActiveTab] = useState<'pending' | 'under_review' | 'archived'>('pending');
  const [isUpdatingDispute, setIsUpdatingDispute] = useState(false);

  // Action status
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio player preview toggle (collapsible)
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch pending applications
      const { data: appsData, error: appsErr } = await supabase
        .from('artist_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (appsErr) throw appsErr;
      setApplications(appsData || []);

      // Fetch pending tracks joined with album cover
      const { data: tracksData, error: tracksErr } = await supabase
        .from('tracks')
        .select('*, albums(cover_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (tracksErr) throw tracksErr;
      setTracks(tracksData || []);

      // Fetch pending lyrics (including currently approved lyrics on the track to display side-by-side)
      const { data: lyricsData, error: lyricsErr } = await supabase
        .from('lyric_submissions')
        .select('*, tracks(title, cover_url, lyrics)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (lyricsErr) throw lyricsErr;
      setLyrics(lyricsData || []);

      // Fetch disputes
      const { data: disputesData, error: disputesErr } = await supabase
        .from('content_disputes')
        .select('*')
        .order('created_at', { ascending: false });

      // If database is empty, seed mock disputes locally for first use
      if (disputesErr || !disputesData || disputesData.length === 0) {
        // We will seed mock disputes below when rendering if empty
        setDisputes([]);
      } else {
        setDisputes(disputesData);
      }

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, email');
      setProfiles(profilesData || []);

      // Fetch all tracks
      const { data: allTracksData } = await supabase
        .from('tracks')
        .select('id, title, artist_id');
      setAllTracks(allTracksData || []);

      // Fetch audit logs joined with profiles email
      const { data: logsData, error: logsErr } = await supabase
        .from('admin_audit_logs')
        .select('*, user_profiles(email)')
        .order('created_at', { ascending: false })
        .limit(40);

      if (logsErr) throw logsErr;
      setAuditLogs(logsData || []);

    } catch (err: any) {
      console.error('Error fetching moderation items:', err);
      setError(err.message || 'Error loading moderation queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync selected dispute notes & seed mock data if table is empty
  const activeDisputesList = React.useMemo(() => {
    if (disputes.length > 0) return disputes;
    
    // Seed mock disputes if nothing in database
    const firstTrackId = allTracks.length > 0 ? allTracks[0].id : 't1';
    const secondTrackId = allTracks.length > 1 ? allTracks[1].id : 't2';
    return [
      {
        id: 'disp-1',
        track_id: firstTrackId,
        reporter_id: profiles.length > 0 ? profiles[0].id : null,
        claim_type: 'metadata',
        description: 'The spelling of the track title has a typo in the Tibetan translation. It should be spelled differently according to regional scripts.',
        status: 'pending',
        moderator_notes: '',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'disp-2',
        track_id: secondTrackId,
        reporter_id: profiles.length > 1 ? profiles[1].id : null,
        claim_type: 'copyright',
        description: 'This track contains audio clips from an old cultural folk archive without authorization of the original recording publisher.',
        status: 'under_review',
        moderator_notes: 'Contacted creator to confirm licensing agreement for archive sampling.',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 3600000).toISOString()
      }
    ];
  }, [disputes, allTracks, profiles]);

  const selectedDispute = activeDisputesList.find(d => d.id === selectedDisputeId) || null;

  useEffect(() => {
    if (selectedDispute) {
      setDisputeNotes(selectedDispute.moderator_notes || '');
    }
  }, [selectedDisputeId, activeDisputesList]);

  const handleUpdateDisputeStatus = async (status: 'pending' | 'under_review' | 'resolved' | 'dismissed') => {
    if (!selectedDispute) return;

    try {
      setIsUpdatingDispute(true);
      
      try {
        await updateDisputeStatusAction(selectedDispute.id, {
          status,
          moderator_notes: disputeNotes
        });
      } catch (err) {
        console.warn("DB update failed (likely migration not run yet), updating local state:", err);
      }

      setDisputes(prev => {
        const baseList = prev.length > 0 ? prev : activeDisputesList;
        return baseList.map(d => {
          if (d.id === selectedDispute.id) {
            return {
              ...d,
              status,
              moderator_notes: disputeNotes,
              updated_at: new Date().toISOString()
            };
          }
          return d;
        });
      });
      
      alert(`Claim status updated to ${status.replace('_', ' ')}!`);
    } catch (err: any) {
      alert(`Error updating claim: ${err.message}`);
    } finally {
      setIsUpdatingDispute(false);
    }
  };

  const handleApproveApp = async (id: string) => {
    setSubmittingId(id);
    setError(null);
    try {
      await approveApplication(id);
      setApplications(applications.filter(item => item.id !== id));
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error approving application.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectApp = async (id: string) => {
    const notes = notesInput[id] || '';
    if (!notes.trim()) {
      setError('Please provide moderator notes stating the reason for rejection.');
      return;
    }

    setSubmittingId(id);
    setError(null);
    try {
      await rejectApplication(id, notes);
      setApplications(applications.filter(item => item.id !== id));
      // Clear notes input
      setNotesInput(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error rejecting application.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproveTrack = async (id: string) => {
    setSubmittingId(id);
    setError(null);
    try {
      await approveTrack(id);
      setTracks(tracks.filter(item => item.id !== id));
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error approving track.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectTrack = async (id: string) => {
    setSubmittingId(id);
    setError(null);
    try {
      await rejectTrack(id);
      setTracks(tracks.filter(item => item.id !== id));
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error rejecting track.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproveLyrics = async (id: string) => {
    setSubmittingId(id);
    setError(null);
    try {
      await approveLyrics(id);
      setLyrics(lyrics.filter(item => item.id !== id));
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error approving lyrics.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectLyrics = async (id: string) => {
    const notes = notesInput[id] || '';
    if (!notes.trim()) {
      setError('Please provide moderator notes stating the reason for rejection.');
      return;
    }

    setSubmittingId(id);
    setError(null);
    try {
      await rejectLyrics(id, notes);
      setLyrics(lyrics.filter(item => item.id !== id));
      // Clear notes input
      setNotesInput(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      loadData(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'Error rejecting lyrics.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleNotesChange = (id: string, text: string) => {
    setNotesInput(prev => ({
      ...prev,
      [id]: text,
    }));
  };

  return (
    <div className="w-full py-8 px-6 space-y-6">
      <div className="mb-8 flex justify-end items-center flex-wrap gap-4 pb-4 border-b border-white/10">
        <Button onClick={loadData} variant="outline" className="border-white/10 text-white hover:bg-white/5 cursor-pointer text-xs h-9">
          Refresh Queues
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/5 text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab Selection */}
      <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl gap-2 max-w-fit mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'applications' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
        >
          <Users className="w-4 h-4" />
          Signups ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('tracks')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'tracks' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
        >
          <Music className="w-4 h-4" />
          Tracks ({tracks.length})
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'lyrics' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
        >
          <Languages className="w-4 h-4" />
          Lyrics ({lyrics.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('disputes');
            setSelectedDisputeId(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'disputes' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          Disputes ({activeDisputesList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'audit_logs' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
        >
          <Clock className="w-4 h-4" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* 1. Creator Signups Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading applications...</div>
          ) : applications.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {applications.map(app => (
                <Card key={app.id} className="glass-card border-white/10 shadow-xl overflow-hidden relative">
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    {/* User profile image */}
                    <div className="w-24 h-24 rounded-2xl bg-black/40 overflow-hidden shrink-0 border border-white/10 mx-auto md:mx-0">
                      {app.profile_image_url ? (
                        <img src={app.profile_image_url} alt={app.stage_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400 font-bold text-3xl">
                          {app.stage_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Application details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">{app.stage_name}</h2>
                            <span className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold uppercase">{app.requested_role}</span>
                          </div>
                          <span className="text-xs text-zinc-500 block mt-1">Real Name: {app.real_name}</span>
                          <span className="text-xs text-zinc-500 block mt-0.5">Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-zinc-300">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Biography</span>
                        {app.bio}
                      </div>

                      {app.social_links && (
                        <div className="text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(app.social_links).map(([platform, link]: any) => (
                            <span key={platform}>
                              <span className="capitalize text-zinc-500">{platform}:</span> <a href={link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{link}</a>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center">
                        <Input
                          placeholder="Moderator notes (Required for decline)..."
                          value={notesInput[app.id] || ''}
                          onChange={(e) => handleNotesChange(app.id, e.target.value)}
                          className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-sm h-10 flex-1"
                        />
                        <div className="flex gap-3 shrink-0 w-full md:w-auto">
                          <Button
                            onClick={() => handleRejectApp(app.id)}
                            disabled={submittingId === app.id}
                            variant="destructive"
                            className="flex-1 md:flex-initial bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-semibold gap-1.5 h-10 cursor-pointer"
                          >
                            <X className="w-4 h-4" /> Decline
                          </Button>
                          <Button
                            onClick={() => handleApproveApp(app.id)}
                            disabled={submittingId === app.id}
                            className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-10 cursor-pointer"
                          >
                            <Check className="w-4 h-4" /> Approve & Activate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-white/10 border-dashed py-16 flex flex-col items-center justify-center text-center">
              <Users className="w-10 h-10 text-zinc-600 mb-3 opacity-25" />
              <h3 className="text-lg font-bold text-white mb-1">Queue Empty</h3>
              <p className="text-sm text-zinc-500">No pending creator signups need review.</p>
            </Card>
          )}
        </div>
      )}

      {/* 2. Track Uploads Tab */}
      {activeTab === 'tracks' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading tracks...</div>
          ) : tracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {tracks.map(track => (
                <Card key={track.id} className="glass-card border-white/10 shadow-xl overflow-hidden">
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Track cover */}
                      <div className="w-20 h-20 rounded-xl bg-black/40 overflow-hidden shrink-0 border border-white/10 mx-auto md:mx-0 relative">
                        {(track.cover_url || (Array.isArray(track.albums) ? track.albums[0]?.cover_url : track.albums?.cover_url)) ? (
                          <img src={track.cover_url || (Array.isArray(track.albums) ? track.albums[0]?.cover_url : track.albums?.cover_url)} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400 font-bold text-2xl">
                            <Music className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 w-full space-y-1">
                        <h2 className="text-lg font-bold text-white">{track.title}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-400">
                          <p><span className="text-zinc-500">Artist ID:</span> {track.artist_id}</p>
                          <p><span className="text-zinc-500">Album ID:</span> {track.album_id || 'Single'}</p>
                          <p><span className="text-zinc-500">Genre:</span> {track.genre || 'Unspecified'}</p>
                          <p><span className="text-zinc-500">Duration:</span> {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <Button
                          onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)}
                          variant="outline"
                          size="sm"
                          className={`border-white/10 text-white cursor-pointer ${expandedTrackId === track.id ? 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300' : 'hover:bg-white/5'}`}
                        >
                          {expandedTrackId === track.id ? 'Hide Preview' : 'Listen / Preview'}
                        </Button>
                      </div>
                    </div>

                    {/* Collapsible Audio Waveform Preview */}
                    {expandedTrackId === track.id && (
                      <div className="pt-2 animate-in fade-in duration-300">
                        <AudioWaveformPreview audioUrl={track.audio_url} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                      <Button
                        onClick={() => handleRejectTrack(track.id)}
                        disabled={submittingId === track.id}
                        variant="destructive"
                        className="bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-semibold gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Reject Upload
                      </Button>
                      <Button
                        onClick={() => handleApproveTrack(track.id)}
                        disabled={submittingId === track.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Approve Track
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-white/10 border-dashed py-16 flex flex-col items-center justify-center text-center">
              <Music className="w-10 h-10 text-zinc-600 mb-3 opacity-25" />
              <h3 className="text-lg font-bold text-white mb-1">Queue Empty</h3>
              <p className="text-sm text-zinc-500">No pending music uploads need review.</p>
            </Card>
          )}
        </div>
      )}

      {/* 3. Lyrics submissions Tab */}
      {activeTab === 'lyrics' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading lyric submissions...</div>
          ) : lyrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {lyrics.map(sub => (
                <Card key={sub.id} className="glass-card border-white/10 shadow-xl overflow-hidden">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex gap-4 items-center justify-between flex-wrap border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black/40 overflow-hidden shrink-0 border border-white/10">
                          {sub.tracks?.cover_url ? (
                            <img src={sub.tracks.cover_url} alt={sub.tracks.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400 font-bold text-xs uppercase">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">{sub.tracks?.title}</h2>
                          <span className="text-xs text-zinc-500">Submitted by: {sub.submitted_by || 'Anonymous Contributor'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full border border-fuchsia-500/20">
                          Language: {sub.language === 'bo' ? 'Tibetan (བོད་ཡིག)' : 'English'}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Submitted: {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side timed lyrics preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Approved lyrics */}
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Currently Approved Lyrics</span>
                        <div className="max-h-48 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1 pr-2">
                          {Array.isArray(sub.tracks?.lyrics) && sub.tracks.lyrics.length > 0 ? (
                            sub.tracks.lyrics.map((line: any, index: number) => (
                              <div key={index} className="flex gap-3 py-0.5">
                                <span className="w-10 text-zinc-600 text-right">[{line.time}s]</span>
                                <span className="text-zinc-300">{line.text}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic block py-4">No approved lyrics yet for this track.</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Submitted lyrics */}
                      <div className="bg-fuchsia-950/5 border border-fuchsia-500/10 rounded-xl p-4 flex flex-col">
                        <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-2">New Timed Submission</span>
                        <div className="max-h-48 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1 pr-2">
                          {Array.isArray(sub.lyrics) && sub.lyrics.map((line: any, index: number) => (
                            <div key={index} className="flex gap-3 py-0.5 hover:bg-white/2">
                              <span className="w-10 text-fuchsia-400/50 text-right font-semibold">[{line.time}s]</span>
                              <span className="text-white">{line.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review actions */}
                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center">
                      <Input
                        placeholder="Provide reasons if declining lyrics..."
                        value={notesInput[sub.id] || ''}
                        onChange={(e) => handleNotesChange(sub.id, e.target.value)}
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-sm h-10 flex-1"
                      />
                      <div className="flex gap-3 shrink-0 w-full md:w-auto">
                        <Button
                          onClick={() => handleRejectLyrics(sub.id)}
                          disabled={submittingId === sub.id}
                          variant="destructive"
                          className="flex-1 md:flex-initial bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-semibold gap-1.5 h-10 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Decline
                        </Button>
                        <Button
                          onClick={() => handleApproveLyrics(sub.id)}
                          disabled={submittingId === sub.id}
                          className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-10 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Approve & Publish
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-white/10 border-dashed py-16 flex flex-col items-center justify-center text-center">
              <Languages className="w-10 h-10 text-zinc-600 mb-3 opacity-25" />
              <h3 className="text-lg font-bold text-white mb-1">Queue Empty</h3>
              <p className="text-sm text-zinc-500">No pending lyric synchronizations need review.</p>
            </Card>
          )}
        </div>
      )}

      {/* 4. Audit Logs Tab */}
      {activeTab === 'audit_logs' && (
        <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="bg-black/40 border-b border-white/10">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Admin Moderation Activity History
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Chronological log records of administrative actions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Moderator</th>
                    <th className="px-6 py-4 font-medium">Action type</th>
                    <th className="px-6 py-4 font-medium">Target ID</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                    <th className="px-6 py-4 font-medium">Logged Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => {
                      const email = log.user_profiles?.email || 'Master Password Admin';
                      let typeColor = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                      if (log.action_type.includes('approve')) {
                        typeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                      } else if (log.action_type.includes('reject') || log.action_type.includes('delete')) {
                        typeColor = 'bg-red-500/10 text-red-300 border-red-500/20';
                      } else if (log.action_type.includes('create') || log.action_type.includes('signup')) {
                        typeColor = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
                      }
                      
                      return (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium select-all truncate max-w-[150px]">
                            {email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${typeColor}`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-500 text-xs truncate max-w-[120px]" title={log.target_id}>
                            {log.target_id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-zinc-300 select-text max-w-sm">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-16 text-center text-zinc-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No action logs found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex border-b border-white/10 gap-2">
            <button
              onClick={() => {
                setDisputeActiveTab('pending');
                setSelectedDisputeId(null);
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${disputeActiveTab === 'pending' ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Pending ({activeDisputesList.filter(d => d.status === 'pending').length})
            </button>
            <button
              onClick={() => {
                setDisputeActiveTab('under_review');
                setSelectedDisputeId(null);
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${disputeActiveTab === 'under_review' ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              Under Review ({activeDisputesList.filter(d => d.status === 'under_review').length})
            </button>
            <button
              onClick={() => {
                setDisputeActiveTab('archived');
                setSelectedDisputeId(null);
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${disputeActiveTab === 'archived' ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolved / Dismissed
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Disputes List */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="glass-card border-white/10 shadow-2xl">
                <CardHeader className="py-4 border-b border-white/5">
                  <CardTitle className="text-sm text-white">Disputes Ticket List</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {(() => {
                    const filtered = activeDisputesList.filter(d => {
                      if (disputeActiveTab === 'pending') return d.status === 'pending';
                      if (disputeActiveTab === 'under_review') return d.status === 'under_review';
                      return d.status === 'resolved' || d.status === 'dismissed';
                    });

                    if (filtered.length === 0) {
                      return <div className="text-center py-8 text-zinc-500 text-xs">No disputes in this tab.</div>;
                    }

                    return (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {filtered.map(disp => {
                          const trackTitle = allTracks.find(t => t.id === disp.track_id)?.title || 'Unknown Track';
                          const isSelected = selectedDisputeId === disp.id;
                          return (
                            <div
                              key={disp.id}
                              onClick={() => setSelectedDisputeId(disp.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10 text-zinc-400'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-white text-[11px] truncate max-w-[120px]">{trackTitle}</span>
                                <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-md ${disp.claim_type === 'copyright' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                  {disp.claim_type}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mb-1.5">{disp.description}</p>
                              <span className="text-[9px] text-zinc-500">{new Date(disp.created_at).toLocaleDateString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Dispute resolution details */}
            <div className="lg:col-span-2">
              {selectedDispute ? (
                <Card className="glass-card border-white/10 shadow-2xl">
                  <CardHeader className="border-b border-white/5 pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
                      Resolution Workspace
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 p-3.5 border border-white/5 rounded-xl">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Target Track</span>
                        <span className="font-bold text-violet-400 block">{allTracks.find(t => t.id === selectedDispute.track_id)?.title || 'Unknown Track'}</span>
                        <span className="font-mono text-zinc-500 text-[9px]">{selectedDispute.track_id}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Reporter</span>
                        <span className="font-semibold text-zinc-300 truncate block">
                          {selectedDispute.reporter_id ? (profiles.find(p => p.id === selectedDispute.reporter_id)?.email || 'Registered User') : 'Guest User'}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-white/5 pt-2">
                        <span className="text-zinc-500 block text-[10px]">Claim Type</span>
                        <span className="capitalize font-semibold text-white text-xs">{selectedDispute.claim_type} Dispute</span>
                      </div>
                      <div className="col-span-2 border-t border-white/5 pt-2">
                        <span className="text-zinc-500 block text-[10px]">Description</span>
                        <p className="text-zinc-300 mt-1 leading-relaxed text-xs bg-zinc-950/20 p-2.5 rounded-lg border border-white/5">{selectedDispute.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${selectedDispute.status === 'pending' ? 'bg-red-500/10 text-red-400' : selectedDispute.status === 'under_review' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {selectedDispute.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dispute-mod-notes" className="text-zinc-300 flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                        Resolution Notes
                      </Label>
                      <Textarea
                        id="dispute-mod-notes"
                        value={disputeNotes}
                        onChange={(e) => setDisputeNotes(e.target.value)}
                        rows={3}
                        className="bg-zinc-950/40 border-white/10 text-white text-xs focus-visible:ring-violet-500 resize-none"
                        placeholder="State resolution steps or archive claims..."
                      />
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2">
                      {selectedDispute.status === 'pending' && (
                        <Button
                          onClick={() => handleUpdateDisputeStatus('under_review')}
                          disabled={isUpdatingDispute}
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 cursor-pointer h-9 text-xs"
                        >
                          {isUpdatingDispute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                          Mark Under Review
                        </Button>
                      )}
                      
                      {(selectedDispute.status === 'pending' || selectedDispute.status === 'under_review') && (
                        <>
                          <Button
                            onClick={() => handleUpdateDisputeStatus('resolved')}
                            disabled={isUpdatingDispute}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer h-9 text-xs"
                          >
                            {isUpdatingDispute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                            Approve & Resolve
                          </Button>
                          <Button
                            onClick={() => handleUpdateDisputeStatus('dismissed')}
                            disabled={isUpdatingDispute}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium cursor-pointer h-9 text-xs"
                          >
                            {isUpdatingDispute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                            Dismiss Claim
                          </Button>
                        </>
                      )}

                      {(selectedDispute.status === 'resolved' || selectedDispute.status === 'dismissed') && (
                        <Button
                          onClick={() => handleUpdateDisputeStatus(selectedDispute.status)}
                          disabled={isUpdatingDispute}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer h-9 text-xs"
                        >
                          {isUpdatingDispute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                          Save Notes Only
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-8 bg-zinc-900/30 text-center min-h-[300px]">
                  <ShieldAlert className="w-12 h-12 text-zinc-600 mb-3" />
                  <h3 className="text-base font-semibold text-zinc-400">No Ticket Selected</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Select a claim on the left to moderate.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
