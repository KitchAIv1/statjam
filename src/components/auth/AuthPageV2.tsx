'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, Trophy } from 'lucide-react';
import { signIn, signUp } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const AuthPageV2 = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    rememberMe: false,
    agreeToTerms: false
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && userRole && !authLoading) {
      console.log('🔧 AuthPageV2: User is logged in, redirecting to dashboard');
      setLoading(false);
      router.push('/dashboard');
    }
  }, [user, userRole, authLoading, router]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const { data, error } = await signUp(
          formData.email, 
          formData.password,
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            userType: userType
          }
        );
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Updated styling with Figma theme
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'var(--dashboard-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    formContainer: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid var(--dashboard-border)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'var(--dashboard-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px',
    },
    subtitle: {
      color: 'var(--dashboard-text-secondary)',
      fontSize: '16px',
    },
    input: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid var(--dashboard-border)',
      background: 'var(--input-background)',
      color: 'var(--dashboard-text-primary)',
      fontSize: '16px',
      marginBottom: '16px',
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      background: 'var(--dashboard-gradient)',
      color: 'white',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '16px',
    },
    switchButton: {
      color: 'var(--dashboard-primary)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
    error: {
      color: '#ff4444',
      marginBottom: '16px',
      textAlign: 'center' as const,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>StatJam</h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={styles.input}
            required
          />

          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            style={styles.input}
            required
          />

          {!isLogin && (
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          )}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--dashboard-text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            style={styles.switchButton}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPageV2;