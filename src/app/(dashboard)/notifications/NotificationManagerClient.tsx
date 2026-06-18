// src/app/(dashboard)/notifications/NotificationManagerClient.tsx
"use client";

import React, { useState } from 'react';
import { Megaphone, Send, Bell, Search, Loader2, History, Info, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendNotificationAction } from '@/app/actions';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  artist_id?: string | null;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipient_id?: string | null;
  status: string;
  created_at: string;
}

interface NotificationManagerClientProps {
  initialProfiles: UserProfile[];
  initialNotifications: SystemNotification[];
}

export default function NotificationManagerClient({
  initialProfiles,
  initialNotifications
}: NotificationManagerClientProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [notificationType, setNotificationType] = useState<'global' | 'direct'>('global');
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  // Recipient search state
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Filter profiles that are eligible for direct messages (creators/admins/or all users)
  const filteredRecipients = initialProfiles.filter(profile => {
    const isCreatorOrAdmin = ['artist', 'contributor', 'admin'].includes(profile.role);
    const matchesSearch = profile.email.toLowerCase().includes(recipientSearch.toLowerCase());
    return isCreatorOrAdmin && matchesSearch;
  });

  const selectedRecipientProfile = initialProfiles.find(p => p.id === recipientId) || null;

  // Map user ID to details for history lookup
  const userMap = React.useMemo(() => {
    const map = new Map<string, UserProfile>();
    initialProfiles.forEach(p => map.set(p.id, p));
    return map;
  }, [initialProfiles]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (notificationType === 'direct' && !recipientId) {
      alert('Please select a recipient for direct notification.');
      return;
    }

    try {
      setIsSending(true);
      const newNotificationData = {
        title,
        message,
        type: notificationType,
        recipient_id: notificationType === 'direct' ? recipientId : null,
        status: 'sent' as const
      };

      await sendNotificationAction(newNotificationData);

      // Update local state logs
      const mockRecord: SystemNotification = {
        id: `notif-${Date.now()}`,
        ...newNotificationData,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [mockRecord, ...prev]);

      // Reset fields
      setTitle('');
      setMessage('');
      setRecipientId('');
      setRecipientSearch('');
      alert('Notification broadcasted successfully!');
    } catch (err: any) {
      alert(`Error broadcasting notification: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left pane: Broadcast Composer (xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-violet-400" />
                Notification Dispatcher
              </CardTitle>
              <CardDescription className="text-zinc-400">Compose and dispatch direct creator broadcasts or global push notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSendNotification} className="space-y-5">
                {/* Broadcast Target Type Select */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Broadcast Target Scope</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setNotificationType('global')}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all duration-300 ${notificationType === 'global' ? 'bg-violet-500/10 border-violet-500 text-white' : 'bg-zinc-950/20 border-white/10 text-zinc-400 hover:bg-white/5'}`}
                    >
                      <Globe className={`w-5 h-5 ${notificationType === 'global' ? 'text-violet-400' : 'text-zinc-500'}`} />
                      <div>
                        <p className="text-sm font-semibold">Global Push Alert</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Dispatches to all active listener apps</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setNotificationType('direct')}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all duration-300 ${notificationType === 'direct' ? 'bg-violet-500/10 border-violet-500 text-white' : 'bg-zinc-950/20 border-white/10 text-zinc-400 hover:bg-white/5'}`}
                    >
                      <Mail className={`w-5 h-5 ${notificationType === 'direct' ? 'text-violet-400' : 'text-zinc-500'}`} />
                      <div>
                        <p className="text-sm font-semibold">Direct Message</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Sends directly to a specific creator portal</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Recipient Selector */}
                {notificationType === 'direct' && (
                  <div className="space-y-2 relative">
                    <Label htmlFor="recipient-search" className="text-zinc-300">Target Creator Recipient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="recipient-search"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setShowRecipientDropdown(true);
                        }}
                        onFocus={() => setShowRecipientDropdown(true)}
                        className="pl-9 bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500"
                        placeholder="Search creators by email..."
                      />
                    </div>

                    {/* Recipient Dropdown List */}
                    {showRecipientDropdown && recipientSearch && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-xl divide-y divide-white/5">
                        {filteredRecipients.length === 0 ? (
                          <div className="p-3 text-zinc-500 text-xs text-center">No creators match search</div>
                        ) : (
                          filteredRecipients.map(profile => (
                            <div
                              key={profile.id}
                              onClick={() => {
                                setRecipientId(profile.id);
                                setRecipientSearch(profile.email);
                                setShowRecipientDropdown(false);
                              }}
                              className="p-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors flex justify-between items-center"
                            >
                              <span>{profile.email}</span>
                              <span className="text-[10px] uppercase font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                                {profile.role}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {selectedRecipientProfile && (
                      <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Selected Recipient: {selectedRecipientProfile.email} ({selectedRecipientProfile.role})
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="notif-title" className="text-zinc-300">Notification Title</Label>
                  <Input
                    id="notif-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500"
                    placeholder="e.g. New Album Drops Tonight!"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <Label htmlFor="notif-body" className="text-zinc-300">Message Content</Label>
                  <Textarea
                    id="notif-body"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500 resize-none"
                    placeholder="Type the message detail that users will see..."
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-5 rounded-xl shadow-lg shadow-violet-500/20 border border-white/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    Broadcast Notification
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Broadcast logs (xl:col-span-2) */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl h-full flex flex-col">
            <CardHeader className="border-b border-white/5 pb-3 shrink-0">
              <CardTitle className="text-lg text-white flex items-center justify-between">
                <span>Notification Log History</span>
                <History className="w-5 h-5 text-zinc-500" />
              </CardTitle>
              <CardDescription className="text-zinc-400">View sent logs and audit trails</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 max-h-[600px]">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-sm">
                  No notifications broadcasted yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => {
                    const recipient = notif.recipient_id ? userMap.get(notif.recipient_id) : null;
                    const recipientLabel = recipient ? recipient.email : 'All users';
                    const isGlobal = notif.type === 'global';

                    return (
                      <div key={notif.id} className="p-4 space-y-2 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-white text-sm line-clamp-1 pr-2">{notif.title}</span>
                          <span className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full shrink-0 ${isGlobal ? 'bg-violet-500/10 text-violet-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {notif.type}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-3">{notif.message}</p>

                        <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                          <span className="truncate max-w-[150px]">To: {recipientLabel}</span>
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
