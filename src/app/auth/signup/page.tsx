'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { signUp } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Trophy, User } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'organizer' as 'organizer' | 'player'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { data, error } = await signUp(formData.email, formData.password, {
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      router.push('/dashboard');
    }

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#121212' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Trophy className="h-12 w-12" style={{ color: '#FFD700' }} />
            <span className="text-4xl font-bold" style={{ 
              fontFamily: 'Anton, system-ui, sans-serif',
              color: '#ffffff'
            }}>
              STATJAM
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Join StatJam
          </h2>
          <p className="text-gray-400">
            Create your account and start managing tournaments
          </p>
        </div>

        {/* Signup Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-lg p-8 space-y-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #1f2937' }}>
            {error && (
              <div className="p-4 rounded-lg text-red-400 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                I want to join as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'organizer')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === 'organizer'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-white font-medium">Organizer</div>
                  <div className="text-sm text-gray-400">Manage tournaments</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'player')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === 'player'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-white font-medium">Player</div>
                  <div className="text-sm text-gray-400">Join tournaments</div>
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      borderColor: '#374151'
                    }}
                    placeholder="First name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  style={{ 
                    backgroundColor: '#2a2a2a',
                    borderColor: '#374151'
                  }}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  style={{ 
                    backgroundColor: '#2a2a2a',
                    borderColor: '#374151'
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      borderColor: '#374151'
                    }}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      borderColor: '#374151'
                    }}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="xl"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </motion.form>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200">
              Sign in here
            </Link>
          </p>
          <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
            ← Back to Homepage
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}