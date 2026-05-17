import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabaseServer";

// Server-side guard — runs before any /admin/* page is rendered or sent.
// Unauthenticated users and non-admins never receive the page HTML.
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

  return <>{children}</>;
}
