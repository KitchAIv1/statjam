'use client';

import React, { useState } from 'react';
import { Trophy, Menu, X, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const HeaderV2 = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  // Role-specific navigation - DASHBOARD ACCESS INCLUDED
  const getNavItems = () => {
    if (!userRole) return [];
    
    if (userRole === 'organizer') {
      return [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Create Tournament', href: '/dashboard/create-tournament' },
        { name: 'Tournaments', href: '/tournaments' },
        { name: 'Players', href: '/players' },
      ];
    } else if (userRole === 'player') {
      return [
        { name: 'Dashboard', href: '/dashboard/player' },
        { name: 'Tournaments', href: '/tournaments' },
        { name: 'Players', href: '/players' },
      ];
    } else if (userRole === 'stat_admin') {
      return [
        { name: 'Dashboard', href: '/dashboard/stat-admin' },
        { name: 'Stat Tracker', href: '/stat-tracker' },
        { name: 'Stats', href: '/stats' },
        { name: 'Players', href: '/players' },
      ];
    }
    
    return [];
  };

  const navItems = getNavItems();

  // CLEAN SLATE STYLING - NO TAILWIND CONSTRAINTS
  const styles = {
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '80px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
      transition: 'transform 0.2s ease',
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      letterSpacing: '0.5px',
    },
    desktopNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },
    navList: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    navLink: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      position: 'relative',
    },
    navLinkHover: {
      color: '#FFD700',
      background: 'rgba(255, 215, 0, 0.1)',
    },
    authButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    authButton: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    signInButton: {
      background: 'transparent',
      color: '#ffffff',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    signInButtonHover: {
      borderColor: '#FFD700',
      color: '#FFD700',
      background: 'rgba(255, 215, 0, 0.05)',
    },
    signUpButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      borderWidth: '0',
      borderStyle: 'none',
      borderColor: 'transparent',
      boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)',
    },
    signUpButtonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
    },
    userMenu: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userButton: {
      background: 'rgba(255, 215, 0, 0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      borderRadius: '10px',
      padding: '8px 16px',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
    logoutButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#ff4444',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#ff4444',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    mobileMenuButton: {
      display: 'none',
      background: 'transparent',
      borderWidth: '0',
      borderStyle: 'none',
      borderColor: 'transparent',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
    },
    mobileMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'rgba(26, 26, 26, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 215, 0, 0.2)',
      padding: '24px',
      display: 'none',
    },
    mobileNavList: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    mobileNavLink: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '18px',
      fontWeight: '500',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    mobileAuthButtons: {
      marginTop: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    // Media queries handled via JavaScript
  };

  return (
    <header style={styles.header}>
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-button { display: block !important; }
          .mobile-menu.open { display: block !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-button { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
      
      <div style={styles.container}>
        {/* Logo */}
        <Link href={userRole === 'organizer' ? '/dashboard' : userRole === 'player' ? '/dashboard/player' : userRole === 'stat_admin' ? '/dashboard/stat-admin' : '/'} style={styles.logo}>
          <div style={styles.logoIcon}>
            <Trophy style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
          </div>
          <div style={styles.logoText}>STATJAM</div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={styles.desktopNav} className="desktop-nav">
          <ul style={styles.navList}>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  style={styles.navLink}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, styles.navLinkHover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, styles.navLink);
                  }}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth Buttons */}
          <div style={styles.authButtons}>
            {user ? (
              <div style={styles.userMenu}>
                <div style={styles.userButton}>
                  <User style={{ width: '16px', height: '16px' }} />
                  <span>{user.email}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    background: 'rgba(255, 215, 0, 0.2)', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    color: '#FFD700'
                  }}>
                    {userRole}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  style={styles.logoutButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ff4444';
                  }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth"
                  style={{ ...styles.authButton, ...styles.signInButton }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, styles.signInButtonHover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, { ...styles.authButton, ...styles.signInButton });
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  style={{ ...styles.authButton, ...styles.signUpButton }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, styles.signUpButtonHover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, { ...styles.authButton, ...styles.signUpButton });
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={styles.mobileMenuButton}
          className="mobile-menu-button"
        >
          {isMenuOpen ? (
            <X style={{ width: '24px', height: '24px' }} />
          ) : (
            <Menu style={{ width: '24px', height: '24px' }} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        style={styles.mobileMenu} 
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
      >
        <ul style={styles.mobileNavList}>
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                style={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div style={styles.mobileAuthButtons}>
          {user ? (
            <>
              <div style={{ ...styles.userButton, justifyContent: 'center' }}>
                <User style={{ width: '16px', height: '16px' }} />
                <span>{user.email}</span>
                <span style={{ 
                  fontSize: '12px', 
                  background: 'rgba(255, 215, 0, 0.2)', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  color: '#FFD700'
                }}>
                  {userRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{ ...styles.logoutButton, justifyContent: 'center', width: '100%' }}
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                style={{ ...styles.authButton, ...styles.signInButton, justifyContent: 'center' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                style={{ ...styles.authButton, ...styles.signUpButton, justifyContent: 'center' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderV2;