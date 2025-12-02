'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Users, Calendar, ChevronRight } from 'lucide-react';

/**
 * ValuePropsSection - Three-column value proposition section
 * Minimalist design with Lucide icons and StatJam brand colors
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function ValuePropsSection() {
  const router = useRouter();

  const valueProps = [
    {
      icon: Trophy,
      title: 'For Players',
      subtitle: 'Own Your Basketball Legacy',
      bullets: [
        'Claim your verified profile across all leagues',
        'Build a permanent stat history for recruitment',
        'Get discovered by coaches scouting talent',
        'Track growth with pro-grade analytics'
      ],
      cta: 'Claim Your Profile',
      ctaAction: () => router.push('/auth?mode=signup&role=player'),
    },
    {
      icon: Users,
      title: 'For Coaches',
      subtitle: 'Build Teams. Find Talent. Win.',
      bullets: [
        'Create and manage unlimited team rosters',
        'Add players or create new profiles',
        'Register teams for tournaments instantly',
        'Scout players with verified stat histories'
      ],
      cta: 'Create Your Team',
      ctaAction: () => router.push('/auth?mode=signup&role=coach'),
    },
    {
      icon: Calendar,
      title: 'For Organizers',
      subtitle: 'Run Tournaments Like a Pro',
      bullets: [
        'Discover and approve teams on platform',
        'Real-time stats and play-by-play',
        'Automated clock management & scoring',
        'Tournament dashboards, zero manual entry'
      ],
      cta: 'Run Your Tournament',
      ctaAction: () => router.push('/auth?mode=signup&role=organizer'),
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      {/* Section Heading */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center">
          One Platform. Three Ways to Win.
        </h2>
      </div>

      {/* Three Columns - Minimal Design */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {valueProps.map((prop, index) => {
            const IconComponent = prop.icon;
            return (
              <div key={index} className="relative">
                {/* Vertical Divider (between columns on desktop) */}
                {index > 0 && (
                  <div className="hidden lg:block absolute -left-4 top-0 bottom-0 w-px bg-gray-200" />
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/20">
                  <IconComponent className="w-7 h-7 text-white" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{prop.title}</h3>
                
                {/* Subtitle */}
                <p className="text-base font-medium text-orange-600 mb-5">
                  {prop.subtitle}
                </p>

                {/* Bullets - Left aligned */}
                <ul className="space-y-2.5 mb-6">
                  {prop.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start gap-2.5 text-gray-600">
                      <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Link */}
                <button
                  onClick={prop.ctaAction}
                  className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold group transition-colors"
                >
                  {prop.cta}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
