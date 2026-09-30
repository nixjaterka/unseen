import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Email links that work in ANY browser (password reset, email confirmation).
//
// The old links used the PKCE "code" flow: the secret half (code verifier) is
// stored in the browser where the email was REQUESTED, so opening the link
// anywhere else — phone vs computer, app vs Safari/Gmail — failed. These links
// carry a one-time token_hash that the server verifies itself, no stored
// secret needed.
//
// Supabase email templates must point here, e.g. "Reset Password":
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password

const ALLOWED_NEXT = ["/app", "/reset-password", "/onboarding/intro", "/onboarding"];

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/app");
  const next = ALLOWED_NEXT.includes(rawNext) ? rawNext : "/app";

  if (tokenHash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/confirm] verifyOtp failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
