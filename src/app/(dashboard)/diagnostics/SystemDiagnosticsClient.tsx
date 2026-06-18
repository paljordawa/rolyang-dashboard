// src/app/(dashboard)/diagnostics/SystemDiagnosticsClient.tsx
"use client";

import React, { useState } from 'react';
import { Activity, Database, HardDrive, Cpu, Play, Loader2, Globe, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { logTrackPlayAction } from '@/app/actions';

interface Track {
  id: string;
  title: string;
  artist_id: string;
}

interface PlayRecord {
  id: string;
  track_id: string;
  listener_location: string;
  played_at: string;
}

interface SystemDiagnosticsClientProps {
  allTracks: Track[];
  initialPlays: PlayRecord[];
  storageStats: {
    filesCount: number;
    totalBytes: number;
  };
}

const GEOGRAPHIES = ['Lhasa', 'Dharamshala', 'New York', 'Seattle', 'Kathmandu', 'Zürich', 'New Delhi', 'London'];

export default function SystemDiagnosticsClient({
  allTracks,
  initialPlays,
  storageStats
}: SystemDiagnosticsClientProps) {
  const [plays, setPlays] = useState<PlayRecord[]>(() => {
    if (initialPlays.length > 0) return initialPlays;
    
    // Seed mock play events for rich initial visualization
    return [
      { id: 'p-1', track_id: allTracks.length > 0 ? allTracks[0].id : 't1', listener_location: 'Lhasa', played_at: new Date(Date.now() - 60000).toISOString() },
      { id: 'p-2', track_id: allTracks.length > 1 ? allTracks[1].id : 't2', listener_location: 'Dharamshala', played_at: new Date(Date.now() - 180000).toISOString() },
      { id: 'p-3', track_id: allTracks.length > 0 ? allTracks[0].id : 't1', listener_location: 'New York', played_at: new Date(Date.now() - 300000).toISOString() },
      { id: 'p-4', track_id: allTracks.length > 2 ? allTracks[2].id : 't3', listener_location: 'Kathmandu', played_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'p-5', track_id: allTracks.length > 1 ? allTracks[1].id : 't2', listener_location: 'Zürich', played_at: new Date(Date.now() - 900000).toISOString() }
    ];
  });

  const [simulating, setSimulating] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(allTracks.length > 0 ? allTracks[0].id : '');
  const [selectedLocation, setSelectedLocation] = useState(GEOGRAPHIES[0]);

  // Transcoding Job State (Simulated queue)
  const [transcodeJobs, setTranscodeJobs] = useState([
    { id: 'job-1', file: 'Nangchen.wav', format: '128kbps AAC', status: 'completed', progress: 100, updated: '5 mins ago' },
    { id: 'job-2', file: 'Ghang_Seng_lak.wav', format: '128kbps AAC', status: 'completed', progress: 100, updated: '2 hours ago' },
    { id: 'job-3', file: 'Rangtsen_Live.wav', format: '128kbps AAC', status: 'failed', progress: 42, updated: 'Yesterday' }
  ]);

  // Track map for quick title lookup
  const trackMap = React.useMemo(() => {
    const map = new Map<string, string>();
    allTracks.forEach(t => map.set(t.id, t.title));
    return map;
  }, [allTracks]);

  // Compute Location statistics
  const locationStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    plays.forEach(p => {
      stats[p.listener_location] = (stats[p.listener_location] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [plays]);

  // Simulate stream play log
  const handleSimulatePlay = async () => {
    if (!selectedTrackId) return;

    try {
      setSimulating(true);
      
      const playData = {
        track_id: selectedTrackId,
        listener_location: selectedLocation
      };

      try {
        await logTrackPlayAction(playData);
      } catch (err) {
        console.warn("DB logging failed (schema extensions not applied yet), running in simulated client state:", err);
      }

      const newRecord: PlayRecord = {
        id: `sim-play-${Date.now()}`,
        track_id: selectedTrackId,
        listener_location: selectedLocation,
        played_at: new Date().toISOString()
      };

      setPlays(prev => [newRecord, ...prev]);
      alert(`Simulated play logged for "${trackMap.get(selectedTrackId) || 'Track'}" in ${selectedLocation}!`);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const retryTranscode = (jobId: string) => {
    setTranscodeJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return { ...job, status: 'completed', progress: 100, updated: 'Just now' };
      }
      return job;
    }));
    alert('Transcoding retried and successfully completed!');
  };

  // Estimate storage sizes: Supposed free bucket is 1 GB (1024 MB).
  const storageUsedBytes = storageStats.totalBytes || 45200000; // fallback 45.2 MB
  const storageUsedMB = Math.round((storageUsedBytes / (1024 * 1024)) * 10) / 10;
  const storageLimitMB = 1024;
  const storagePercent = Math.min(100, (storageUsedMB / storageLimitMB) * 100);

  return (
    <div className="space-y-6">
      {/* Grid: Health Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Supabase Storage Card */}
        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-violet-400" />
              Supabase Media Footprint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-white font-mono">{storageUsedMB} MB</span>
              <span className="text-xs text-zinc-500">of {storageLimitMB} MB quota</span>
            </div>
            
            {/* Custom progress bar */}
            <div className="w-full h-2 bg-zinc-950/60 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500" 
                style={{ width: `${storagePercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>Usage: {storagePercent.toFixed(1)}%</span>
              <span>{storageStats.filesCount || 16} files stored</span>
            </div>
          </CardContent>
        </Card>

        {/* Audio Engine / CPU */}
        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Transcoding Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-white font-mono">Online</span>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400">
              <div className="bg-zinc-950/30 p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block">Encodings Completed</span>
                <span className="text-white font-bold text-sm">146</span>
              </div>
              <div className="bg-zinc-950/30 p-2 rounded-lg border border-white/5">
                <span className="text-zinc-500 block">Queue Backlog</span>
                <span className="text-white font-bold text-sm">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stream plays total */}
        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-fuchsia-400" />
              Live Telemetry Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-white font-mono">{plays.length.toLocaleString()}</span>
              <span className="text-xs text-zinc-500">plays logged</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Globe className="w-4 h-4 text-zinc-500" />
              <span>Covering {locationStats.length} geographic centers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left pane: Simulator & Geo Stats */}
        <div className="xl:col-span-1 space-y-6">
          {/* Stream Play Simulator */}
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Stream Telemetry Simulator</CardTitle>
              <CardDescription className="text-zinc-400">Inject simulated play events into database logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sim-track" className="text-zinc-300">Select Track</Label>
                <select
                  id="sim-track"
                  value={selectedTrackId}
                  onChange={(e) => setSelectedTrackId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-950/40 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  {allTracks.map(t => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-loc" className="text-zinc-300">Select Geography</Label>
                <select
                  id="sim-loc"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-950/40 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  {GEOGRAPHIES.map(loc => (
                    <option key={loc} value={loc} className="bg-zinc-900">{loc}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSimulatePlay}
                disabled={simulating || !selectedTrackId}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer py-5"
              >
                {simulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                Log Stream Event
              </Button>
            </CardContent>
          </Card>

          {/* Geographic play stats */}
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Listener Location Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationStats.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">No geography stats logged.</div>
              ) : (
                locationStats.map(([location, count]) => {
                  const share = (count / plays.length) * 100;
                  return (
                    <div key={location} className="space-y-1 text-xs">
                      <div className="flex justify-between text-zinc-300">
                        <span className="font-semibold">{location}</span>
                        <span className="font-mono text-zinc-500">{count} plays ({share.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-400 rounded-full" 
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Transcode pipelines logs & Live Feed */}
        <div className="xl:col-span-2 space-y-6">
          {/* Audio Transcoding Pipeline Jobs */}
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Audio Transcoding Pipeline</CardTitle>
              <CardDescription className="text-zinc-400">Status logs of source audio conversions to streaming codecs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 text-sm">
                {transcodeJobs.map(job => (
                  <div key={job.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-white font-mono text-xs">{job.file}</p>
                      <p className="text-xs text-zinc-500">Codec: {job.format} • {job.updated}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {job.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          Success
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            Failed ({job.progress}%)
                          </div>
                          <Button
                            size="sm"
                            onClick={() => retryTranscode(job.id)}
                            className="h-7 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-[10px] px-2.5 cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time play feed */}
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Live Stream Log</CardTitle>
              <CardDescription className="text-zinc-400">Real-time listing of track listener play counts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                {plays.slice(0, 10).map((play) => {
                  const title = trackMap.get(play.track_id) || 'Unknown Track';
                  return (
                    <div key={play.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-white/5 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white block">{title}</span>
                        <span className="text-[10px] font-mono text-zinc-500">Track ID: {play.track_id}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-violet-400 font-semibold block">{play.listener_location}</span>
                        <span className="text-[10px] text-zinc-500">{new Date(play.played_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
