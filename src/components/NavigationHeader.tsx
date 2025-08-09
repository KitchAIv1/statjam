'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { UserDropdownMenu } from "@/components/ui/UserDropdownMenu";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getNavigationForRole } from "@/lib/navigation-config";
import { Menu, X } from "lucide-react";

export function NavigationHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, initialized } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = getNavigationForRole(userRole);
  const isAuthenticated = !!user;

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignUp = () => {
    router.push('/auth');
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // Handle anchor links for landing page
      if (pathname === '/') {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(`/${href}`);
      }
    } else {
      router.push(href);
    }
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (href: string) => {
    if (href.startsWith('#')) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={handleHome}
            className="cursor-pointer"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              StatJam
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.primary.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'text-white hover:text-orange-400 hover:bg-orange-400/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {!initialized ? (
              // Loading state
              <div className="w-8 h-8 animate-pulse bg-gray-700 rounded-full" />
            ) : isAuthenticated ? (
              // Authenticated user menu
              <UserDropdownMenu user={user} userRole={userRole || 'fan'} />
            ) : (
              // Guest auth buttons
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={handleSignIn}
                  className="text-white hover:text-orange-400 hover:bg-orange-400/10"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleSignUp}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-orange-400 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
            <div className="px-6 py-4 space-y-3">
              {/* Navigation Items */}
              {navigation.primary.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'text-white hover:text-orange-400 hover:bg-orange-400/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-sm text-gray-400">{item.description}</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Mobile Auth Buttons for Guests */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Button 
                    onClick={handleSignIn}
                    variant="outline"
                    className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handleSignUp}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}