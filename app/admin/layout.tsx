import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabaseServer";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = user?.email?.toLowerCase() ?? "";

  if (!user || !adminEmails.includes(email)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FAF3EE]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#EDE3DA] bg-white/90 backdrop-blur">
        <div className="px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/brand/icononly_transparent_nobuffer.png"
              alt="Unseen"
              className="h-7 w-auto"
            />
            <span className="font-bold text-sm text-black">Admin</span>
            <span className="rounded-full bg-[#E0175C]/10 px-2 py-0.5 text-[10px] font-semibold text-[#E0175C] uppercase tracking-wide">
              internal
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <AdminNav />
          </div>

          <span className="hidden sm:block text-xs text-neutral-400 shrink-0 truncate max-w-[180px]">
            {email}
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="px-6 py-8">
        {children}
      </main>
    </div>
  );
}
