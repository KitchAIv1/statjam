'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, Trophy } from 'lucide-react';
import { signIn, signUp } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import EmailConfirmationPending from './EmailConfirmationPending';

const AuthPageV2 = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
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
        
        // Show email confirmation screen
        setSignupEmail(formData.email);
        setShowEmailConfirmation(true);
        setLoading(false);
        return; // Don't continue to the catch block
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowEmailConfirmation(false);
    setIsLogin(true);
    setSignupEmail('');
    setError('');
  };

  // Show email confirmation screen if needed
  if (showEmailConfirmation) {
    return (
      <EmailConfirmationPending 
        email={signupEmail}
        onBack={handleBackToSignIn}
      />
    );
  }

  // Updated styling with StatJam orange/red branding
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef7ed 0%, #fff7ed 50%, #fef2f2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    formContainer: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid rgba(251, 146, 60, 0.2)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(to right, #fb923c, #ef4444)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#78716c',
      fontSize: '16px',
    },
    input: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(251, 146, 60, 0.2)',
      background: '#fff7ed',
      color: '#2d1b14',
      fontSize: '16px',
      marginBottom: '16px',
      transition: 'all 0.3s ease',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      background: 'linear-gradient(to right, #fb923c, #ef4444)',
      color: 'white',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(251, 146, 60, 0.3)',
    },
    switchButton: {
      color: '#f97316',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
    error: {
      color: '#dc2626',
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
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#f97316';
                  target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                  target.style.boxShadow = 'none';
                }}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                style={styles.input}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#f97316';
                  target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                  target.style.boxShadow = 'none';
                }}
                required
              />

              {/* Role Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  I am signing up as a:
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  {/* Player Role */}
                  <button
                    type="button"
                    onClick={() => setUserType('player')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: userType === 'player' ? '2px solid #f97316' : '2px solid rgba(251, 146, 60, 0.2)',
                      background: userType === 'player' ? 'rgba(251, 146, 60, 0.1)' : 'white',
                      color: userType === 'player' ? '#ea580c' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (userType !== 'player') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = '#f97316';
                        target.style.background = 'rgba(251, 146, 60, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (userType !== 'player') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                        target.style.background = 'white';
                      }
                    }}
                  >
                    🏀 Player
                  </button>

                  {/* Organizer Role */}
                  <button
                    type="button"
                    onClick={() => setUserType('organizer')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: userType === 'organizer' ? '2px solid #f97316' : '2px solid rgba(251, 146, 60, 0.2)',
                      background: userType === 'organizer' ? 'rgba(251, 146, 60, 0.1)' : 'white',
                      color: userType === 'organizer' ? '#ea580c' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (userType !== 'organizer') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = '#f97316';
                        target.style.background = 'rgba(251, 146, 60, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (userType !== 'organizer') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                        target.style.background = 'white';
                      }
                    }}
                  >
                    🏆 Organizer
                  </button>

                  {/* Stat Admin Role */}
                  <button
                    type="button"
                    onClick={() => setUserType('stat_admin')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: userType === 'stat_admin' ? '2px solid #f97316' : '2px solid rgba(251, 146, 60, 0.2)',
                      background: userType === 'stat_admin' ? 'rgba(251, 146, 60, 0.1)' : 'white',
                      color: userType === 'stat_admin' ? '#ea580c' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (userType !== 'stat_admin') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = '#f97316';
                        target.style.background = 'rgba(251, 146, 60, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (userType !== 'stat_admin') {
                        const target = e.target as HTMLButtonElement;
                        target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                        target.style.background = 'white';
                      }
                    }}
                  >
                    📊 Stat Admin
                  </button>
                </div>

                {/* Role Descriptions */}
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {userType === 'player' && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Player:</strong> Join tournaments, view your stats, and track your performance
                    </p>
                  )}
                  {userType === 'organizer' && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Organizer:</strong> Create tournaments, manage teams, and schedule games
                    </p>
                  )}
                  {userType === 'stat_admin' && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Stat Admin:</strong> Record live game statistics and manage game data
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#f97316';
              e.target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
            required
          />

          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#f97316';
              e.target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
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
              onFocus={(e) => {
                e.target.style.borderColor = '#f97316';
                e.target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          )}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.background = 'linear-gradient(to right, #ea580c, #dc2626)';
                target.style.transform = 'translateY(-2px)';
                target.style.boxShadow = '0 8px 25px rgba(251, 146, 60, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.background = 'linear-gradient(to right, #fb923c, #ef4444)';
                target.style.transform = 'translateY(0px)';
                target.style.boxShadow = '0 4px 15px rgba(251, 146, 60, 0.3)';
              }
            }}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#78716c' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            style={styles.switchButton}
            onClick={() => setIsLogin(!isLogin)}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = '#ea580c'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#f97316'}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPageV2;