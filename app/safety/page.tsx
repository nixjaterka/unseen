// Public explainer page linked from the safety-check SMS a user's friend
// receives. No auth — a friend without an account must be able to read it.

export const metadata = {
  title: "Unseen — Date safety check",
  description: "What it means when a friend adds you as their safety contact on Unseen.",
};

export default function SafetyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8F2ED", color: "#1C1410", padding: "48px 24px", fontFamily: "Nunito, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>💗</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
          You're someone's safety contact
        </h1>
        <p style={{ color: "#6B5A52", textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>
          A friend is going on a date with a match from <strong>Unseen</strong> and chose you to look
          out for them. Here's exactly what that means.
        </p>

        {[
          {
            t: "Why you got a text",
            b: "When your friend planned their date, they turned on our safety check and added your number. That intro text let you know when and roughly who they're meeting.",
          },
          {
            t: "What happens during the date",
            b: "Shortly after the date starts, we send your friend a couple of quick in-app check-ins. All they do is tap “I'm safe.” If everything's fine, you'll never hear from us again.",
          },
          {
            t: "When we'd contact you",
            b: "If your friend misses a check-in and doesn't respond to our reminder either, we'll text you asking you to try to reach them. It doesn't necessarily mean something is wrong — phones die, dates run long — but it's your cue to check in with them directly.",
          },
          {
            t: "What to do if that happens",
            b: "Try calling or messaging your friend. If you can't reach them and you're worried, use your judgment as you would for any friend — including contacting local emergency services if you believe they're in danger.",
          },
        ].map((s) => (
          <div key={s.t} style={{ background: "white", border: "1px solid #EDE3DA", borderRadius: 16, padding: 20, marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.t}</h2>
            <p style={{ color: "#6B5A52", lineHeight: 1.6, fontSize: 15 }}>{s.b}</p>
          </div>
        ))}

        <p style={{ color: "#A89488", textAlign: "center", fontSize: 13, marginTop: 24, lineHeight: 1.6 }}>
          Unseen is a dating app built around real compatibility and safety. We only text safety
          contacts — we never share your number or use it for anything else.
        </p>
      </div>
    </main>
  );
}
