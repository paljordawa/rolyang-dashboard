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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ShieldAlert, Users, Music, Languages, CalendarDays, Clock, Play, Pause, AlertCircle, FileText } from 'lucide-react';
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
    <div className="w-full py-10 px-8">
      <div className="mb-10 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Moderation <span className="text-gradient">Center</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Review and moderate pending creator profiles, media uploads, and synchronized translations.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="border-white/10 text-white hover:bg-white/5 cursor-pointer">
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
    </div>
  );
}
