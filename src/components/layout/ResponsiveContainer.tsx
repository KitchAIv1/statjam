'use client';

import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Container Component
 * 
 * Provides responsive layout with proper max-width constraints
 * and mobile-first design principles.
 * 
 * Desktop: Fixed 900px centered container
 * Mobile: Full-width responsive container
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className 
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const containerStyle = {
    ...styles.container,
    padding: isMobile ? '0' : '0 20px'
  };

  const contentStyle = {
    ...styles.content,
    padding: isMobile ? '0 16px' : '0 24px',
    maxWidth: isMobile ? '100%' : '900px'
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'center'
  },
  content: {
    width: '100%',
    margin: '0 auto'
  }
};

export default ResponsiveContainer;