'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { signIn } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Trophy } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#121212' }}>
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
            Welcome Back
          </h2>
          <p className="text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  style={{ 
                    backgroundColor: '#2a2a2a',
                    borderColor: '#374151'
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full max-w-full pl-10 pr-12 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  style={{ 
                    backgroundColor: '#2a2a2a',
                    borderColor: '#374151'
                  }}
                  placeholder="Enter your password"
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="xl"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing In...' : 'Sign In'}
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
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200">
              Sign up here
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