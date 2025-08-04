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
      setLoading(false); // Clear any local loading state
      router.push('/dashboard');
    }
  }, [user, userRole, authLoading, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔧 AuthPageV2: Attempting sign in...');
        const { data, error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        
        console.log('🔧 AuthPageV2: Sign in successful, waiting for auth state...');
        // Don't redirect immediately - let the useEffect handle it when auth state updates
        
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        console.log('🔍 Signup data being sent:', {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: userType
        });
        
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
        
        console.log('🔧 AuthPageV2: Sign up successful, waiting for auth state...');
        // Don't redirect immediately - let the useEffect handle it when auth state updates
      }
      
      // Keep loading state true until the useEffect detects the user and redirects
      
    } catch (err) {
      console.error('🔧 AuthPageV2: Auth error:', err);
      setError(err.message);
      setLoading(false); // Only clear loading on error
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      rememberMe: false,
      agreeToTerms: false
    });
    setError('');
  };

  // COMPLETELY DIFFERENT STYLING - NO TAILWIND CONSTRAINTS
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', sans-serif",
    },
    card: {
      background: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '24px',
      padding: '48px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(252, 211, 77, 0.2)',
      backdropFilter: 'blur(20px)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(252, 211, 77, 0.3)',
      boxSizing: 'border-box',
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
    },
    logoIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '16px',
      boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px',
      letterSpacing: '-0.5px',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    subtitle: {
      fontSize: '16px',
      color: '#b3b3b3',
      lineHeight: '1.5',
    },
    errorBox: {
      background: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500',
    },
    socialSection: {
      marginBottom: '32px',
    },
    socialButton: {
      width: '100%',
      padding: '16px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      borderRadius: '12px',
      background: '#2a2a2a',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '12px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    },
    socialButtonHover: {
      borderColor: '#FFD700',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    },
    divider: {
      position: 'relative',
      textAlign: 'center',
      margin: '32px 0',
      color: '#888888',
      fontSize: '14px',
      fontWeight: '500',
    },
    dividerLine: {
      position: 'absolute',
      top: '50%',
      left: '0',
      right: '0',
      height: '1px',
      background: '#4a4a4a',
      zIndex: '1',
    },
    dividerText: {
      background: 'rgba(30, 30, 30, 0.95)',
      padding: '0 20px',
      position: 'relative',
      zIndex: '2',
    },
    userTypeSection: {
      marginBottom: '32px',
    },
    userTypeLabel: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '16px',
    },
    userTypeButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '12px',
    },
    userTypeButton: {
      padding: '20px 16px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      borderRadius: '12px',
      background: '#2a2a2a',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffffff',
      boxSizing: 'border-box',
      position: 'relative',
    },
    userTypeButtonActive: {
      borderColor: '#FFD700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      transform: 'scale(1.02)',
      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
    },
    formSection: {
      marginBottom: '32px',
    },
    fieldGroup: {
      marginBottom: '24px',
    },
    fieldRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    inputWrapper: {
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box',
    },
    input: {
      width: '100%',
      padding: '16px 48px 16px 48px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      borderRadius: '12px',
      fontSize: '16px',
      color: '#ffffff',
      background: '#2a2a2a',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#FFD700',
      boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.1)',
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#888888',
      width: '20px',
      height: '20px',
      pointerEvents: 'none',
    },
    inputToggle: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#888888',
      cursor: 'pointer',
      width: '20px',
      height: '20px',
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      marginTop: '2px',
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#b3b3b3',
      lineHeight: '1.5',
    },
    submitButton: {
      width: '100%',
      padding: '18px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      borderWidth: '0',
      borderStyle: 'none',
      borderColor: 'transparent',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      boxSizing: 'border-box',
    },
    submitButtonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
    },
    submitButtonDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
      transform: 'none',
    },
    switchSection: {
      textAlign: 'center',
      marginTop: '32px',
      paddingTop: '24px',
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: '#4a4a4a',
    },
    switchText: {
      color: '#888888',
      fontSize: '14px',
    },
    switchButton: {
      color: '#FFD700',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      marginLeft: '4px',
      background: 'none',
      borderWidth: '0',
      borderStyle: 'none',
      borderColor: 'transparent',
    },
    backLink: {
      textAlign: 'center',
      marginTop: '24px',
    },
    backLinkButton: {
      color: '#FFD700',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderTopWidth: '2px',
      borderTopStyle: 'solid',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    helpText: {
      fontSize: '12px',
      color: '#888888',
      marginTop: '6px',
    },
  };

  return (
    <div style={styles.container}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
            </div>
            <div style={styles.logoText}>STATJAM</div>
          </div>
          
          <h1 style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Join the Revolution'}
          </h1>
          <p style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to your account and continue your journey' 
              : 'Create your account and become part of something amazing'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield style={{ width: '16px', height: '16px' }} />
              {error}
            </div>
          </div>
        )}

        {/* Social Login */}
        <div style={styles.socialSection}>
          <button 
            type="button"
            style={styles.socialButton}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.socialButtonHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.socialButton)}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '12px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or continue with email</span>
        </div>

        {/* User Type Selection (Sign Up Only) */}
        {!isLogin && (
          <div style={styles.userTypeSection}>
            <div style={styles.userTypeLabel}>
              Choose your role: <span style={{ color: '#FFD700', fontWeight: '700' }}>({userType})</span>
            </div>
            <div style={styles.userTypeButtons}>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 User selected: organizer');
                  setUserType('organizer');
                }}
                style={{
                  ...styles.userTypeButton,
                  ...(userType === 'organizer' ? styles.userTypeButtonActive : {})
                }}
              >
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>🏆 Organizer</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Manage tournaments</div>
                {userType === 'organizer' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '12px',
                    height: '12px',
                    background: '#1a1a1a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold'
                  }}>✓</div>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 User selected: player');
                  setUserType('player');
                }}
                style={{
                  ...styles.userTypeButton,
                  ...(userType === 'player' ? styles.userTypeButtonActive : {})
                }}
              >
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>🎮 Player</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Join tournaments</div>
                {userType === 'player' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '12px',
                    height: '12px',
                    background: '#1a1a1a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold'
                  }}>✓</div>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 User selected: stat_admin');
                  setUserType('stat_admin');
                }}
                style={{
                  ...styles.userTypeButton,
                  ...(userType === 'stat_admin' ? styles.userTypeButtonActive : {})
                }}
              >
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>📊 Stat Admin</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Manage statistics</div>
                {userType === 'stat_admin' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '12px',
                    height: '12px',
                    background: '#1a1a1a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold'
                  }}>✓</div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.formSection}>
          {/* Name Fields (Sign Up Only) */}
          {!isLogin && (
            <div style={styles.fieldGroup}>
              <div style={styles.fieldRow}>
                <div>
                  <label style={styles.label}>First Name</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.inputIcon} />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="John"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Last Name</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.inputIcon} />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
              <div
                style={styles.inputToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </div>
            </div>
            {!isLogin && (
              <div style={styles.helpText}>
                At least 8 characters with uppercase, lowercase, and number
              </div>
            )}
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {!isLogin && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock style={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Confirm your password"
                  required={!isLogin}
                />
                <div
                  style={styles.inputToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </div>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password (Login Only) */}
          {isLogin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Remember me</label>
              </div>
              <button
                type="button"
                style={styles.switchButton}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Terms (Sign Up Only) */}
          {!isLogin && (
            <div style={{ ...styles.checkboxRow, marginBottom: '24px' }}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                style={styles.checkbox}
                required={!isLogin}
              />
              <label style={styles.checkboxLabel}>
                I agree to the{' '}
                <span style={styles.switchButton}>Terms of Service</span>{' '}
                and{' '}
                <span style={styles.switchButton}>Privacy Policy</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, styles.submitButtonHover)}
            onMouseLeave={(e) => !loading && Object.assign(e.target.style, styles.submitButton)}
          >
            {loading ? (
              <div style={styles.loadingSpinner} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </>
            )}
          </button>
        </form>

        {/* Switch Form Type */}
        <div style={styles.switchSection}>
          <span style={styles.switchText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              resetForm();
            }}
            style={styles.switchButton}
          >
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>

        {/* Back to Homepage Link */}
        <div style={styles.backLink}>
          <a href="/" style={styles.backLinkButton}>
            <ArrowRight style={{ width: '16px', height: '16px', transform: 'rotate(180deg)' }} />
            Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPageV2;