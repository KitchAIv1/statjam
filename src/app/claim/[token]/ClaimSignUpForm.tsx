'use client';

/**
 * ClaimSignUpForm Component
 * 
 * Inline sign-up form for the claim page.
 * Creates a new player account and claims the profile in one step.
 */

import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthV2 } from '@/hooks/useAuthV2';

interface ClaimSignUpFormProps {
  playerName: string;
  onSuccess: (userId: string) => void;
  onError: (message: string) => void;
}

export function ClaimSignUpForm({ playerName, onSuccess, onError }: ClaimSignUpFormProps) {
  const { signUp } = useAuthV2();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      onError('Email is required');
      return;
    }
    
    if (!password || password.length < 6) {
      onError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, {
        full_name: playerName,
        userType: 'player',
      });

      if (result.success && result.profile?.id) {
        onSuccess(result.profile.id);
      } else {
        onError(result.error || 'Failed to create account');
      }
    } catch (err) {
      onError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-300 text-sm">
          Create your StatJam account to claim this profile
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account & Claim Profile'
        )}
      </button>

      <p className="text-gray-500 text-xs text-center">
        By creating an account, you agree to our Terms of Service
      </p>
    </form>
  );
}

