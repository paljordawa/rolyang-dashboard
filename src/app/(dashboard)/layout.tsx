import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { supabaseAdmin } from "@/lib/supabase";
import NotificationDropdown from "@/components/NotificationDropdown";
import HeaderTitle from "@/components/HeaderTitle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAdminCookie = cookieStore.get("rolyang_admin_session")?.value === "true";
  
  let role = "listener";
  let displayName = "Admin";
  let avatarUrl = "";

  if (isAdminCookie) {
    role = "admin";
    displayName = "Superadmin";
  } else {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        role = user.user_metadata?.role || "listener";
        const emailName = user.email ? user.email.split('@')[0] : "Creator";
        displayName = user.user_metadata?.stage_name || emailName;
        avatarUrl = user.user_metadata?.avatar_url || "";
      }
    } catch (err) {
      console.error("Error detecting role in layout:", err);
    }
  }

  let pendingAppsCount = 0;
  let pendingTracksCount = 0;
  let pendingLyricsCount = 0;

  if (role === "admin") {
    try {
      const { count: appsCount } = await supabaseAdmin
        .from("artist_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
        
      const { count: tracksCount } = await supabaseAdmin
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
        
      const { count: lyricsCount } = await supabaseAdmin
        .from("lyric_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      pendingAppsCount = appsCount || 0;
      pendingTracksCount = tracksCount || 0;
      pendingLyricsCount = lyricsCount || 0;
    } catch (err) {
      console.error("Error querying notification counts:", err);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar role={role} displayName={displayName} avatarUrl={avatarUrl} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="min-h-[4rem] py-3 glass-panel flex items-center justify-between px-8 z-10 sticky top-0 border-b border-white/5 relative flex-wrap gap-4">
          <HeaderTitle />
          
          {/* Centered Artist Info */}
          {(role === "artist" || role === "contributor") && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400 text-[10px] font-bold capitalize">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-white tracking-wide truncate max-w-[150px] capitalize">{displayName}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {role === "admin" && (
              <NotificationDropdown 
                pendingApps={pendingAppsCount}
                pendingTracks={pendingTracksCount}
                pendingLyrics={pendingLyricsCount}
              />
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
