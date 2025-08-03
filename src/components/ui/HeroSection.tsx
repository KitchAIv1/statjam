'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './Button';

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
    <section className={cn('relative min-h-screen flex items-center justify-center overflow-hidden', className)}>
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {backgroundVideo ? (
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-purple via-background-dark to-black" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-background-dark/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
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
              className="font-medium text-lg mb-4 tracking-wide uppercase"
              style={{ color: '#FFD700' }}
            >
              {subtitle}
            </motion.p>
          )}
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
            style={{ 
              fontFamily: 'Anton, system-ui, sans-serif',
              color: '#ffffff' 
            }}
          >
            {title}
          </motion.h1>
          
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              {description}
            </motion.p>
          )}
          
          {(primaryAction || secondaryAction) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {primaryAction && (
                <Button
                  variant="primary"
                  size="xl"
                  onClick={primaryAction.onClick}
                  className=""
                >
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={secondaryAction.onClick}
                  className=""
                >
                  {secondaryAction.label}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}