import "./globals.css";

export const metadata = {
  title: "Unseen",
  description: "Match on photos. Talk without seeing who. Meet to find out.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}