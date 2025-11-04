"use client";

export function ProofTrust() {
  const badges = [
    { label: "Automation Suite", desc: "Clock • Possession • Sequences" },
    { label: "< 3s Updates", desc: "Real‑time with fallback" },
    { label: "Enterprise‑Grade", desc: "TypeScript • RLS • Edge" },
  ];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {badges.map((b, idx) => (
            <div key={idx} className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-gray-800">
              <span className="font-semibold">{b.label}</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


