import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 glass-panel flex items-center justify-between px-8 z-10 sticky top-0 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white/90">Dashboard</h2>
          <div className="flex items-center gap-4">
            <Link href="/artists/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors btn-gradient h-9 px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4-4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              Add Artist
            </Link>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
