'use client';

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { UserDropdownMenu } from "@/components/ui/UserDropdownMenu";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { getNavigationForRole } from "@/lib/navigation-config";
import { Menu, X } from "lucide-react";
import { OrganizerGuideButton } from "@/components/guide";
import { useSubscription } from "@/hooks/useSubscription";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface NavigationHeaderContentProps {
  minimal?: boolean;
}

function NavigationHeaderContent({ minimal = false }: NavigationHeaderContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuthContext(); // ✅ NO API CALL - Uses context
  const { isVerified } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  
  useEffect(() => {
    setHasHydrated(true);
  }, []);
  
  const userRole = user?.role;
  const navigation = getNavigationForRole(userRole || null);
  const isAuthenticated = !!user && !loading;
  
  // Get current section for organizer dashboard
  const currentSection = searchParams.get('section') || 'overview';

  const handleSignIn = () => {
    router.push('/auth?mode=signin');
  };

  const handleSignUp = () => {
    router.push('/auth?mode=signup');
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleNavigation = (href: string, disabled?: boolean) => {
    if (disabled || href.startsWith('#disabled')) {
      // Don't navigate for disabled items
      return;
    }
    
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
    
    // Special handling for organizer dashboard sections
    if (userRole === 'organizer' && pathname === '/dashboard' && href.includes('section=')) {
      const sectionMatch = href.match(/section=([^&]+)/);
      if (sectionMatch) {
        return currentSection === sectionMatch[1];
      }
    }
    
    // ✅ FIX: Special handling for coach dashboard sections
    if (userRole === 'coach' && pathname === '/dashboard/coach' && href.includes('section=')) {
      const sectionMatch = href.match(/section=([^&]+)/);
      if (sectionMatch) {
        return currentSection === sectionMatch[1];
      }
    }
    
    // ✅ FIX: Exact match for coach dashboard (no section = overview)
    if (userRole === 'coach' && href === '/dashboard/coach') {
      return pathname === '/dashboard/coach' && !currentSection;
    }
    
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Verified Badge - Fixed layout to prevent shift */}
          <div 
            onClick={handleHome}
            className="cursor-pointer flex items-center gap-2"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap">
              StatJam
            </h1>
            {/* Reserve space for badge to prevent layout shift */}
            {isAuthenticated && (
              <div className="w-[70px] h-[20px] flex items-center">
                {isVerified && <VerifiedBadge variant="pill" />}
              </div>
            )}
          </div>

          {/* Desktop Navigation - Hidden in minimal mode */}
          {!minimal && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.primary.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                const isDisabled = item.disabled || item.href.startsWith('#disabled');
                
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item.disabled)}
                    disabled={isDisabled}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isDisabled
                        ? 'text-white/40 cursor-not-allowed opacity-60'
                        : isActive 
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
          )}

          {/* Right Side Actions - Fixed width container to prevent layout shift */}
          <div className="flex items-center space-x-4 min-w-[120px] justify-end">
            {!hasHydrated ? (
              // SSR placeholder - matches user menu size
              <div className="w-8 h-8 rounded-full bg-gray-700/50" />
            ) : loading ? (
              // Loading state - same size as user menu to prevent shift
              <div className="w-8 h-8 rounded-full bg-gray-700/50 animate-pulse" />
            ) : isAuthenticated ? (
              // Authenticated user menu
              <>
                {userRole === 'organizer' && <OrganizerGuideButton />}
                <UserDropdownMenu 
                  user={user} 
                  userRole={userRole || 'fan'} 
                  signOut={signOut}
                  profilePhotoUrl={user?.profile_photo_url}
                />
              </>
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

            {/* Mobile Menu Button - Hidden in minimal mode */}
            {!minimal && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-orange-400 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu - Hidden in minimal mode */}
        {!minimal && isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
            <div className="px-6 py-4 space-y-3">
              {/* Navigation Items */}
              {navigation.primary.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                const isDisabled = item.disabled || item.href.startsWith('#disabled');
                
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item.disabled)}
                    disabled={isDisabled}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                      isDisabled
                        ? 'text-white/40 cursor-not-allowed opacity-60'
                        : isActive 
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

interface NavigationHeaderProps {
  minimal?: boolean;
}

export function NavigationHeader({ minimal = false }: NavigationHeaderProps) {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="cursor-pointer">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                StatJam
              </h1>
            </div>
          </div>
        </div>
      </header>
    }>
      <NavigationHeaderContent minimal={minimal} />
    </Suspense>
  );
}