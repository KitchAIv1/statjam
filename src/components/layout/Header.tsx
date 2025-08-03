'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, Trophy, User, LogOut } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Players', href: '/players' },
    { name: 'Stats', href: '/stats' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b" style={{ 
      backgroundColor: 'rgba(18, 18, 18, 0.95)', 
      borderColor: '#1f2937',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8" style={{ color: '#FFD700' }} />
            <span className="text-2xl font-bold" style={{ 
              fontFamily: 'Anton, system-ui, sans-serif',
              color: '#ffffff'
            }}>
              STATJAM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-yellow-400 transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" style={{ color: '#b3b3b3' }} />
                  <span className="text-white font-medium">
                    {user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ 
                    backgroundColor: '#4B0082',
                    color: '#ffffff'
                  }}>
                    {userRole}
                  </span>
                </div>
                {userRole === 'organizer' && (
                  <Link href="/dashboard">
                    <Button variant="primary" size="lg">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-yellow-400 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-800 pt-4 pb-4"
          >
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-white hover:text-yellow-400 transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <div className="text-white font-medium">
                    {user.email?.split('@')[0]} ({userRole})
                  </div>
                  {userRole === 'organizer' && (
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" size="lg" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="lg" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}