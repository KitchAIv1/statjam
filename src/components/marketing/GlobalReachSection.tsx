'use client';

import { Globe, TrendingUp, Users2, BarChart3 } from 'lucide-react';

/**
 * GlobalReachSection - "Basketball Without Borders" section
 * Asymmetric layout with left-aligned content
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function GlobalReachSection() {
  const stats = [
    { number: '2,500+', label: 'Stats Tracked', icon: BarChart3 },
    { number: '7', label: 'Countries', icon: Globe },
    { number: '35', label: 'Teams Created', icon: Users2 },
    { number: '95%', label: 'Organic Growth', icon: TrendingUp }
  ];

  const countries = [
    { flag: '🇺🇸', name: 'USA' },
    { flag: '🇵🇭', name: 'Philippines' },
    { flag: '🇦🇺', name: 'Australia' },
    { flag: '🇮🇳', name: 'India' },
    { flag: '🇮🇹', name: 'Italy' },
    { flag: '🇨🇦', name: 'Canada' },
    { flag: '🇬🇧', name: 'UK' }
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Basketball Without Borders
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              From rec leagues to competitive tournaments, StatJam is bringing the global basketball community together.
            </p>

            {/* Country Flags - Horizontal List */}
            <div className="flex flex-wrap gap-3">
              {countries.map((country, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full"
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm text-gray-700 font-medium">{country.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
