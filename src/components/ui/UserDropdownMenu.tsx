'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserDropdownMenuProps {
  user: any;
  userRole: string;
  signOut: () => Promise<{ success: boolean; }>;
}

export function UserDropdownMenu({ user, userRole, signOut }: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // ✅ Use authServiceV2's signOut
      await signOut();
      // Redirect to home
      router.push('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSettings = () => {
    const settingsPath = userRole === 'organizer' ? '/dashboard/settings' :
                        userRole === 'player' ? '/dashboard/player/settings' :
                        userRole === 'stat_admin' ? '/dashboard/stat-admin/settings' :
                        userRole === 'admin' ? '/admin/settings' :
                        '/settings';
    router.push(settingsPath);
    setIsOpen(false);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.firstName && user?.user_metadata?.lastName) {
      return `${user.user_metadata.firstName} ${user.user_metadata.lastName}`;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getRoleBadge = () => {
    const roleColors = {
      organizer: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      player: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      stat_admin: 'bg-green-500/20 text-green-300 border-green-500/30',
      fan: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      admin: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    const roleLabels = {
      organizer: 'Organizer',
      player: 'Player',
      stat_admin: 'Stat Admin',
      fan: 'Fan',
      admin: 'Admin'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${roleColors[userRole as keyof typeof roleColors] || roleColors.fan}`}>
        {userRole === 'admin' && <Shield className="w-3 h-3" />}
        {roleLabels[userRole as keyof typeof roleLabels] || 'User'}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        
        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">
            {getUserDisplayName()}
          </div>
          <div className="text-xs text-gray-400">
            {getRoleBadge()}
          </div>
        </div>
        
        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">
                  {getUserDisplayName()}
                </div>
                <div className="text-gray-400 text-xs">
                  {user?.email}
                </div>
                <div className="mt-1">
                  {getRoleBadge()}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleSettings}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}