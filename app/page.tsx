export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 px-6">
      <h1 className="text-5xl font-semibold mb-6">Unseen</h1>

      <p className="max-w-xl text-center text-lg text-neutral-300 mb-8">
        Match on photos.  
        Talk without seeing who.  
        Meet to find out.
      </p>

      <button className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-neutral-200 transition">
        Join the waitlist
      </button>
    </main>
  );
}