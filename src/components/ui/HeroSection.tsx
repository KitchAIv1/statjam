'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HeroButton } from './Button';

interface HeroSectionProps {
  title: string;
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
    <section className={cn('relative min-h-screen w-full flex items-center justify-center lg:justify-end overflow-hidden', className)}>
      {/* Background Media */}
      <div className="absolute inset-0 z-0 w-full h-full">
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
          <div className="w-full h-full relative overflow-hidden">
            {/* Single Background Image - Stretched End-to-End */}
            <img
              src={backgroundImage}
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center center',
                minWidth: '100vw',
                minHeight: '100%',
                transform: 'scale(1.1)'
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-purple via-background-dark to-black" />
        )}
        
        {/* Dynamic Overlay - Stronger on mobile for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/95 via-background-dark/70 to-background-dark/30 md:from-background-dark/90 md:via-background-dark/50 md:to-transparent" />
        
        {/* Additional text backdrop for mobile */}
        <div className="absolute inset-0 bg-black/20 md:bg-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full px-4 md:px-8 lg:px-16 xl:px-20">
        {/* Two-column layout on large screens to anchor text on the right side */}
        <div className="w-full max-w-[1600px] mx-auto grid lg:grid-cols-2 lg:gap-8 items-center text-center lg:text-left">
          <div className="hidden lg:block" aria-hidden />
          <div className="lg:col-start-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="font-medium text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 tracking-wide uppercase drop-shadow-lg"
                style={{ 
                  color: '#FFD700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                }}
              >
                {subtitle}
              </motion.p>
            )}
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[8rem] 2xl:text-[10rem] font-bold mb-6 md:mb-8 lg:mb-10 leading-[0.85]"
              style={{ 
                fontFamily: 'Anton, system-ui, sans-serif',
                color: '#ffffff',
                textShadow: '0 4px 8px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              {title}
            </motion.h1>
            
            {description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 md:mb-10 lg:mb-12 leading-relaxed lg:max-w-xl"
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                }}
              >
                {description}
              </motion.p>
            )}
            
            {(primaryAction || secondaryAction) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center"
              >
                {primaryAction && (
                  <HeroButton
                    variant="primary"
                    onClick={primaryAction.onClick}
                  >
                    <span>{primaryAction.label}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </HeroButton>
                )}
                {secondaryAction && (
                  <HeroButton
                    variant="secondary"
                    onClick={secondaryAction.onClick}
                  >
                    <span>{secondaryAction.label}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 6.292 4 4 0 010-6.292zM15 21H3v-1a6 6 0 0112 0v1z" />
                    </svg>
                  </HeroButton>
                )}
              </motion.div>
            )}
          </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 lg:left-auto lg:right-16 xl:right-20 transform -translate-x-1/2 lg:translate-x-0 text-white animate-bounce"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}