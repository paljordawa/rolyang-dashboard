// src/app/(dashboard)/notifications/page.tsx
import React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import NotificationManagerClient from './NotificationManagerClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  // Fetch user profiles to populate direct recipient choices (artists, contributors, listeners)
  const { data: profilesObj, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('email');
  const profiles = profilesError ? [] : (profilesObj || []);

  // Fetch sent system notifications log
  const { data: notificationsObj, error: notificationsError } = await supabaseAdmin
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  const notifications = notificationsError ? [] : (notificationsObj || []);

  return (
    <div className="w-full py-8 px-6 space-y-6">
      <NotificationManagerClient
        initialProfiles={profiles}
        initialNotifications={notifications}
      />
    </div>
  );
}
