'use client';

import { Video, Palette, ArrowRight } from 'lucide-react';

/**
 * RoadmapSection - Coming Soon features section
 * Left-aligned intro with feature cards
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function RoadmapSection() {
  const features = [
    {
      icon: Video,
      title: 'Live Streaming',
      description: 'Stream games natively with synced stat overlays and real-time scoreboards.',
      cta: 'Join the Streaming Waitlist'
    },
    {
      icon: Palette,
      title: 'NBA Card Generation',
      description: 'Turn highlights and stat lines into collectible player cards in seconds.',
      cta: 'Get Early Access'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header - Left Aligned */}
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Future of Basketball is Connected
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Exciting features coming soon to make StatJam even more powerful.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 overflow-hidden hover:-translate-y-1 transition-transform duration-200"
              >
                {/* Gradient Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-bl-full" />
                
                <div className="relative">
                  {/* Header Row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Coming Soon
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* CTA */}
                  <button className="inline-flex items-center text-orange-400 hover:text-orange-300 text-sm font-medium group/btn transition-colors">
                    {feature.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing Statement */}
        <p className="text-base text-gray-500 max-w-xl">
          These aren't just features — they're what happens when the basketball community lives on one platform.
        </p>
      </div>
    </section>
  );
}
