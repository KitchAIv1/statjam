'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, TrendingUp, Users } from 'lucide-react';

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  backgroundImage,
  backgroundVideo,
  primaryAction,
  secondaryAction,
  className
}: HeroSectionProps) {
  return (
    <section className={cn('relative min-h-screen flex items-center justify-center overflow-hidden', className)}>
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {backgroundVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Hero background"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline - Exactly like Figma */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight font-bold text-white mb-8"
            style={{ 
              textShadow: '0 4px 8px rgba(0,0,0,0.9)',
              letterSpacing: '-0.02em'
            }}
          >
            Elevate Your Game with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Real-Time Stats
            </span>
          </motion.h1>
          
          {/* Description - Exactly like Figma */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-12 text-white max-w-4xl mx-auto font-normal leading-relaxed"
            style={{ 
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              letterSpacing: '-0.01em'
            }}
          >
            Professional-grade tournament management and live stat tracking for basketball teams and leagues
          </motion.p>

          {/* Buttons - Figma Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
          >
            {/* Primary Button - Orange like Figma */}
            {primaryAction && (
              <motion.button
                onClick={primaryAction.onClick}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                  color: '#ffffff',
                  border: 'none',
                  minWidth: '200px'
                }}
              >
                {primaryAction.label}
              </motion.button>
            )}
            
            {/* Secondary Button - White like Figma */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl bg-white text-gray-900 hover:bg-gray-100"
              style={{ minWidth: '200px' }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Stats Section - Figma Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-12 lg:gap-16 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-orange-400 drop-shadow-lg" />
              </div>
              <h3 className="text-2xl lg:text-3xl mb-2 font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                Real-Time
              </h3>
              <p className="text-base lg:text-lg text-gray-300 font-normal">
                Live stat tracking
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-orange-400 drop-shadow-lg" />
              </div>
              <h3 className="text-2xl lg:text-3xl mb-2 font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                Teams
              </h3>
              <p className="text-base lg:text-lg text-gray-300 font-normal">
                Tournament management
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Play className="h-12 w-12 text-orange-400 drop-shadow-lg" />
              </div>
              <h3 className="text-2xl lg:text-3xl mb-2 font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                Professional
              </h3>
              <p className="text-base lg:text-lg text-gray-300 font-normal">
                Grade analytics
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="animate-bounce"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}