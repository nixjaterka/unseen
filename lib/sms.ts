// Provider-agnostic SMS sending.
//
// The actual SMS provider is a CONNECTOR that gets wired up later (Nikol's plan:
// build features first, connect SMS after). Until SMS_PROVIDER + credentials are
// set, this logs and no-ops so the whole date-safety flow can be built and tested
// without a live SMS account. A working Twilio implementation is included so that
// turning it on later is just setting env vars.

export async function sendSMS(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const provider = process.env.SMS_PROVIDER; // e.g. "twilio"

  if (!provider) {
    // No provider configured yet — log so we can see the flow working end-to-end.
    console.log(`[sms:noop] to=${to} body=${body}`);
    return { ok: true };
  }

  if (provider === "twilio") {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM;
      if (!sid || !token || !from) return { ok: false, error: "twilio_env_missing" };

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      });
      if (!res.ok) return { ok: false, error: await res.text().catch(() => "twilio_error") };
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error)?.message ?? "twilio_exception" };
    }
  }

  return { ok: false, error: `unknown SMS_PROVIDER: ${provider}` };
}
