// Shared styled bits for legal pages (Terms, Privacy, future cookie policy).
// Brand-styled: white bg, brand pink accents, light pink callouts.

export function SectionTitle({
  num,
  children,
  id,
}: {
  num?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <h2
      id={id}
      className="text-xl font-bold text-black flex items-center gap-3 pt-6 scroll-mt-6"
    >
      {num ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E0175C] text-white text-base font-semibold shrink-0">
          {num}
        </span>
      ) : null}
      <span>{children}</span>
    </h2>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium text-black mt-4">{children}</h3>;
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FDE8EF] border-l-4 border-[#E0175C] rounded-r-xl p-4 text-sm text-black">
      {children}
    </div>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-700 leading-relaxed">{children}</p>;
}

export function A({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-[#E0175C] underline">
      {children}
    </a>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-neutral-700">{children}</ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal pl-6 space-y-2 text-neutral-700">{children}</ol>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-[#E0175C] font-medium">[{children}]</span>;
}
