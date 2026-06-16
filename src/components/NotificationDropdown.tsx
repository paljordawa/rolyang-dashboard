"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Users, Music, Languages, ExternalLink, Sparkles } from 'lucide-react';

interface NotificationDropdownProps {
  pendingApps: number;
  pendingTracks: number;
  pendingLyrics: number;
}

export default function NotificationDropdown({
  pendingApps,
  pendingTracks,
  pendingLyrics
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalAlerts = pendingApps + pendingTracks + pendingLyrics;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all cursor-pointer focus:outline-none"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white ring-2 ring-black animate-pulse">
            {totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Moderation Alerts</h3>
            {totalAlerts > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                Action Required
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-2 space-y-1">
            {totalAlerts > 0 ? (
              <>
                {/* Pending Applications */}
                {pendingApps > 0 && (
                  <Link
                    href="/moderation"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Creator Applications</p>
                      <p className="text-[10px] text-zinc-500">{pendingApps} profile{pendingApps > 1 ? 's' : ''} pending approval</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                )}

                {/* Pending Tracks */}
                {pendingTracks > 0 && (
                  <Link
                    href="/moderation"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                      <Music className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Track Uploads</p>
                      <p className="text-[10px] text-zinc-500">{pendingTracks} song{pendingTracks > 1 ? 's' : ''} in review queue</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                )}

                {/* Pending Lyrics */}
                {pendingLyrics > 0 && (
                  <Link
                    href="/moderation"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                      <Languages className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Lyric Sync Submissions</p>
                      <p className="text-[10px] text-zinc-500">{pendingLyrics} translation{pendingLyrics > 1 ? 's' : ''} pending review</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-zinc-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-40" />
                <p className="text-xs font-medium">All queues are clear!</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">No pending moderation items</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-white/2 border-t border-white/5 text-center">
            <Link
              href="/moderation"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider"
            >
              Moderation Center <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline fallback icons for simplicity
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
