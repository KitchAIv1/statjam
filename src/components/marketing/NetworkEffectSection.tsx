'use client';

import { TrendingUp, Users, Calendar } from 'lucide-react';

/**
 * NetworkEffectSection - Shows the network effect story
 * Left-aligned content with visual anchors
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function NetworkEffectSection() {
  const effects = [
    {
      icon: Users,
      text: 'Every player who joins makes coaches more powerful.'
    },
    {
      icon: TrendingUp,
      text: 'Every coach who joins brings more players.'
    },
    {
      icon: Calendar,
      text: 'Every tournament brings more teams.'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0A0A0A] to-[#111111]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
              Growing Stronger Together
            </h2>

            {/* Network Effect Statements */}
            <div className="space-y-6 mb-10">
              {effects.map((effect, index) => {
                const IconComponent = effect.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-lg text-white/90 leading-relaxed pt-1.5">
                      {effect.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Closing Statement */}
            <p className="text-base text-white/60 leading-relaxed">
              That's what happens when you build the ecosystem basketball has been waiting for.
            </p>
          </div>

          {/* Right Column - Stats Highlight */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-10">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-orange-500 mb-2">
                286
              </div>
              <div className="text-lg text-white/60 mb-6">
                users became
              </div>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2">
                1,000+
              </div>
              <div className="text-lg text-white/60 mb-8">
                visitors in 28 days
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Zero marketing spend
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
