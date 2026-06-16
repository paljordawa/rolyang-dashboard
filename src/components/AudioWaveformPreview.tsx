"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioWaveformPreviewProps {
  audioUrl: string;
}

export default function AudioWaveformPreview({ audioUrl }: AudioWaveformPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [durationTime, setDurationTime] = useState('0:00');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let wsInstance: any = null;

    // Load wavesurfer.js dynamically to avoid SSR errors
    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;
        
        wsInstance = WaveSurfer.create({
          container: containerRef.current!,
          waveColor: 'rgba(255, 255, 255, 0.15)',
          progressColor: '#c084fc', // fuchsia-400
          cursorColor: '#a21caf', // fuchsia-700
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          height: 40,
          url: audioUrl,
        });

        wavesurferRef.current = wsInstance;

        wsInstance.on('ready', () => {
          setIsReady(true);
          setDurationTime(formatTime(wsInstance.getDuration()));
        });

        wsInstance.on('audioprocess', () => {
          setCurrentTime(formatTime(wsInstance.getCurrentTime()));
        });

        wsInstance.on('interaction', () => {
          setCurrentTime(formatTime(wsInstance.getCurrentTime()));
        });

        wsInstance.on('play', () => setIsPlaying(true));
        wsInstance.on('pause', () => setIsPlaying(false));
        wsInstance.on('finish', () => setIsPlaying(false));

      } catch (err) {
        console.error('Failed to load WaveSurfer:', err);
      }
    };

    initWaveSurfer();

    return () => {
      wsInstance?.destroy();
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="flex items-center gap-4 bg-black/30 border border-white/5 p-3 rounded-xl w-full">
      <Button
        type="button"
        size="sm"
        onClick={handlePlayPause}
        disabled={!isReady}
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center cursor-pointer ${isPlaying ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
      >
        {!isReady ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Waveform container */}
      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="w-full" />
      </div>

      {/* Timestamps */}
      <div className="text-[10px] font-mono text-zinc-500 shrink-0 select-none">
        {currentTime} / {durationTime}
      </div>
    </div>
  );
}
