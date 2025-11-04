"use client";

export function ProofTrust() {
  const badges = [
    { label: "Automation Suite", desc: "Clock • Possession • Sequences" },
    { label: "< 3s Updates", desc: "Real‑time with fallback" },
    { label: "Enterprise‑Grade", desc: "TypeScript • RLS • Edge" },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Trusted Technology</h3>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {badges.map((b, idx) => (
            <div key={idx} className="px-6 py-3 rounded-full border-2 border-orange-200 bg-white text-gray-900 shadow-md hover:shadow-lg hover:border-orange-300 transition-all duration-300">
              <span className="font-bold text-base">{b.label}</span>
              <span className="mx-2 text-orange-400">•</span>
              <span className="text-gray-700">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


