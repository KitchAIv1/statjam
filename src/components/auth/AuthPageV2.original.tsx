'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, Trophy } from 'lucide-react';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import EmailConfirmationPending from './EmailConfirmationPending';

const AuthPageV2 = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('player');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const router = useRouter();
  
  // 🏀 ENTERPRISE AUTH V2 - Raw HTTP (never hangs)
  const { user, loading, error: authError, signIn: signInV2, signUp: signUpV2 } = useAuthV2();
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    rememberMe: false,
    agreeToTerms: false
  });

  // ✅ EMERGENCY: Clear stuck redirect flags on component mount
  useEffect(() => {
    // Clear any stuck redirect flags when auth page loads
    const clearStuckFlags = () => {
      const isRedirecting = sessionStorage.getItem('auth-redirecting');
      const redirectTimestamp = sessionStorage.getItem('auth-redirect-timestamp');
      const now = Date.now();
      
      if (isRedirecting === 'true' && redirectTimestamp) {
        const timeDiff = now - parseInt(redirectTimestamp);
        if (timeDiff > 3000) { // 3 seconds
          console.log('🚨 AuthPageV2: Clearing stuck redirect flags on mount');
          sessionStorage.removeItem('auth-redirecting');
          sessionStorage.removeItem('auth-redirect-timestamp');
        }
      }
    };
    
    clearStuckFlags();
  }, []); // Run once on mount

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      // ✅ FIX: Check if we're currently redirecting to prevent infinite loop
      const isRedirecting = sessionStorage.getItem('auth-redirecting');
      const redirectTimestamp = sessionStorage.getItem('auth-redirect-timestamp');
      const now = Date.now();
      
      // ✅ AGGRESSIVE FIX: Always clear redirect flags if user is authenticated
      if (isRedirecting === 'true') {
        console.log('🚨 AuthPageV2 (V2): User is authenticated, clearing redirect flags and proceeding...');
        sessionStorage.removeItem('auth-redirecting');
        sessionStorage.removeItem('auth-redirect-timestamp');
      }
      
      console.log('🔐 AuthPageV2 (V2): User is logged in, redirecting based on role:', user.role);
      
      // Mark that we're redirecting with timestamp
      sessionStorage.setItem('auth-redirecting', 'true');
      sessionStorage.setItem('auth-redirect-timestamp', now.toString());
      
      // ✅ Use window.location.href for hard redirect
      let redirectUrl = '/dashboard';
      if (user.role === 'admin') {
        redirectUrl = '/dashboard'; // Admin templates temporarily disabled
      } else if (user.role === 'player') {
        redirectUrl = '/dashboard/player';
      } else if (user.role === 'stat_admin') {
        redirectUrl = '/dashboard/stat-admin';
      }
      
      console.log('🚀 AuthPageV2 (V2): Hard redirecting to:', redirectUrl);
      
      // Small delay to ensure sessionStorage is set
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }
  }, [user, loading]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    // ✅ CRITICAL FIX #1: Trim email input to prevent whitespace issues
    const processedValue = type === 'checkbox' 
      ? checked 
      : name === 'email' 
        ? value.trim() 
        : value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        console.log('🔐 AuthPageV2 (V2): Signing in with raw HTTP...');
        const result = await signInV2(formData.email, formData.password);
        if (!result.success) {
          throw new Error(result.error || 'Sign in failed');
        }
        console.log('✅ AuthPageV2 (V2): Sign in successful!');
        // useAuthV2 hook will handle redirect via useEffect
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        console.log('🔐 AuthPageV2 (V2): Signing up with raw HTTP...');
        const result = await signUpV2(
          formData.email, 
          formData.password,
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            userType: userType
          }
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Sign up failed');
        }
        
        console.log('✅ AuthPageV2 (V2): Sign up successful!');
        
        // ✅ ENHANCED: Handle different signup outcomes
        if (result.autoSignedIn) {
          console.log('🚀 AuthPageV2 (V2): Auto sign-in enabled, user will be redirected by useEffect');
          
          // ✅ NEW: Show role confirmation if available
          if (result.profile) {
            console.log(`👤 AuthPageV2 (V2): User signed up as ${result.profile.role}`);
          }
          
          // Don't show email confirmation - user is already signed in
          // The useEffect will handle the redirect to dashboard
          return;
        }
        
        // ✅ NEW: Handle delayed profile sync warning
        if (result.warning) {
          console.warn('⚠️ AuthPageV2 (V2):', result.warning);
          setError(`Account created successfully! ${result.warning}`);
          // Still show email confirmation or redirect to sign in
          setTimeout(() => {
            setIsLogin(true); // Switch to sign in mode
            setError('');
          }, 3000);
          return;
        }
        
        // Show email confirmation screen only if email confirmation is required
        setSignupEmail(formData.email);
        setShowEmailConfirmation(true);
        return;
      }
    } catch (err: any) {
      console.error('❌ AuthPageV2 (V2): Error:', err.message);
      setError(err.message);
    }
  };

  const handleBackToSignIn = () => {
    setShowEmailConfirmation(false);
    setIsLogin(true);
    setSignupEmail('');
    setError('');
  };

  // ✅ FIX: Show loading while redirecting
  if (user && !loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px',
          }}>
            ✅ Signed In!
          </div>
          <div style={{
            fontSize: '16px',
            color: '#6b7280',
          }}>
            Redirecting to your dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Show email confirmation screen if needed
  if (showEmailConfirmation) {
    return (
      <EmailConfirmationPending 
        email={signupEmail}
        onBack={handleBackToSignIn}
      />
    );
  }

  // Enhanced styling with background image and CSS-based responsiveness
  const styles = {
    container: {
      minHeight: '100vh',
      background: `
        linear-gradient(
          135deg, 
          rgba(251, 146, 60, 0.3) 0%, 
          rgba(239, 68, 68, 0.3) 100%
        ),
        url('/images/AuthBG.png')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center top', // Show upper part of image (face area)
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll', // Use scroll for better mobile compatibility
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative' as const,
    },
    formContainer: {
      // Advanced Glassmorphism Effect
      background: `
        linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.1) 100%
        )
      `,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)', // Safari support
      borderRadius: '24px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      // Multi-layer glass borders
      border: `1px solid rgba(255, 255, 255, 0.4)`,
      borderTop: `1px solid rgba(255, 255, 255, 0.6)`,
      borderLeft: `1px solid rgba(255, 255, 255, 0.6)`,
      // Advanced glass shadows
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6),
        inset 0 -1px 0 rgba(255, 255, 255, 0.1)
      `,
      margin: 'auto',
      position: 'relative' as const,
      // Performance optimization
      willChange: 'transform',
      transform: 'translateZ(0)', // GPU acceleration
      // Glass reflection effect
      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        borderRadius: '24px 24px 0 0',
        pointerEvents: 'none',
      }
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      // Metallic red bright - solid color, no gradient overlay
      color: '#dc2626', // Clean bright red
      marginBottom: '8px',
      // Metallic effect with multiple text shadows
      textShadow: `
        0 1px 0 #b91c1c,
        0 2px 0 #991b1b,
        0 3px 0 #7f1d1d,
        0 4px 6px rgba(0, 0, 0, 0.3),
        0 0 10px rgba(220, 38, 38, 0.5)
      `,
      // Remove any background that could create rectangles
      background: 'none',
      WebkitBackgroundClip: 'initial',
      WebkitTextFillColor: 'initial',
    },
    subtitle: {
      // Clean black for maximum contrast
      color: '#000000', // Pure black
      fontSize: '16px',
      fontWeight: '600', // Bolder for better visibility
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)', // Strong white shadow
    },
    input: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      // Glass input effect
      background: `
        linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 100%
        )
      `,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderTop: '1px solid rgba(255, 255, 255, 0.6)',
      // Much stronger text color for glass background
      color: '#111827', // Very dark gray for maximum contrast
      fontSize: '16px', // Keep 16px to prevent zoom on iOS
      fontWeight: '500', // Slightly bolder for better visibility
      marginBottom: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      boxSizing: 'border-box' as const,
      // Enhanced glass input shadows
      boxShadow: `
        0 4px 6px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.1)
      `,
      // Much darker placeholder for better visibility on glass
      '::placeholder': {
        color: '#1f2937', // Very dark gray, almost black
        fontWeight: '600', // Bolder weight for better visibility
        opacity: '1', // Ensure full opacity
      }
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      // Enhanced high-contrast button with stronger StatJam gradient
      background: `
        linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%)
      `,
      // Subtle glass overlay for depth without compromising visibility
      '::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
        borderRadius: '12px',
        pointerEvents: 'none',
      },
      backdropFilter: 'blur(5px)', // Reduced blur for better color visibility
      WebkitBackdropFilter: 'blur(5px)',
      color: 'white',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)', // Text shadow for better readability
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderTop: '1px solid rgba(255, 255, 255, 0.5)',
      fontSize: '16px',
      fontWeight: '700', // Bolder text
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      // Clean shadows without glow
      boxShadow: `
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.3)
      `,
      minHeight: '52px',
      touchAction: 'manipulation',
      position: 'relative' as const,
      overflow: 'hidden',
      // Glass shine effect
      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        transition: 'left 0.5s',
      },
      ':hover::before': {
        left: '100%',
      }
    },
    switchButton: {
      // Clean black text for maximum contrast
      color: '#000000', // Pure black
      background: 'none', // No background
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontWeight: '600', // Bolder text
      padding: '4px 8px',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)', // Strong white shadow
    },
    error: {
      // Enhanced error visibility
      color: '#dc2626',
      backgroundColor: 'rgba(220, 38, 38, 0.1)', // Background for better visibility
      border: '1px solid rgba(220, 38, 38, 0.2)',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      textAlign: 'center' as const,
      fontWeight: '500',
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
    }
  };

  return (
    <>
      <style jsx>{`
        /* Enhanced Glassmorphism Animations */
        .auth-form {
          animation: glassFloat 6s ease-in-out infinite;
        }
        
        @keyframes glassFloat {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-5px) rotateX(1deg); }
        }
        
        .auth-form::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          border-radius: 24px 24px 0 0;
          pointer-events: none;
          z-index: 1;
        }
        
        .auth-form:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            0 4px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 0 rgba(255, 255, 255, 0.15) !important;
        }
        
        /* Enhanced Glass Input Focus Effects */
        .auth-input:focus {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%) !important;
          border: 1px solid #ea580c !important;
          box-shadow: 
            0 0 0 3px rgba(234, 88, 12, 0.25),
            0 8px 16px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          transform: translateY(-2px);
          color: #111827 !important;
        }
        
        /* Enhanced Placeholder Styling for All Browsers */
        .auth-input::placeholder {
          color: #1f2937 !important;
          font-weight: 600 !important;
          opacity: 1 !important;
        }
        
        .auth-input::-webkit-input-placeholder {
          color: #1f2937 !important;
          font-weight: 600 !important;
          opacity: 1 !important;
        }
        
        .auth-input::-moz-placeholder {
          color: #1f2937 !important;
          font-weight: 600 !important;
          opacity: 1 !important;
        }
        
        .auth-input:-ms-input-placeholder {
          color: #1f2937 !important;
          font-weight: 600 !important;
          opacity: 1 !important;
        }
        
        /* Clean Button Hover Effects - No Glow */
        .auth-button:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%) !important;
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
        }
        
        .auth-button:active {
          transform: translateY(-1px) scale(0.99) !important;
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 50%, #7f1d1d 100%) !important;
        }
        
        /* Clean Role Selection - No Glassmorphism */
        .role-button-selected {
          background: #dc2626 !important; /* Solid red background */
          border: 2px solid #dc2626 !important;
          color: white !important;
          font-weight: 700 !important;
          text-shadow: none !important; /* Remove text shadow */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* Simple shadow */
          transform: none; /* No scaling */
        }
        
        .role-button-unselected {
          background: white !important; /* Clean white background */
          border: 2px solid #e5e7eb !important; /* Light gray border */
          color: #374151 !important; /* Dark text */
          font-weight: 600 !important;
          text-shadow: none !important; /* Remove text shadow */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important; /* Subtle shadow */
        }
        
        .role-button-unselected:hover {
          background: #f9fafb !important; /* Very light gray on hover */
          border: 2px solid #dc2626 !important; /* Red border on hover */
          color: #dc2626 !important; /* Red text on hover */
          transform: none; /* No transform animations */
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
        }

        /* Responsive Background Positioning */
        .auth-container {
          background-position: center top !important; /* Desktop: show face area */
        }
        
        @media (max-width: 768px) {
          .auth-container {
            padding: 16px !important;
            background-position: center 20% !important; /* Mobile: adjust for better framing */
          }
          .auth-form {
            padding: 24px !important;
            border-radius: 20px !important;
            max-width: 100% !important;
            backdrop-filter: blur(15px) saturate(150%) !important;
          }
          .auth-form::before {
            border-radius: 20px 20px 0 0 !important;
          }
          .auth-header {
            margin-bottom: 24px !important;
          }
          .auth-title {
            font-size: 30px !important;
          }
          .auth-subtitle {
            font-size: 14px !important;
          }
          .auth-input {
            padding: 14px !important;
            margin-bottom: 12px !important;
            backdrop-filter: blur(8px) !important;
          }
          .auth-button {
            padding: 14px !important;
            margin-bottom: 12px !important;
            font-size: 15px !important;
            min-height: 48px !important;
            backdrop-filter: blur(8px) !important;
          }
          .role-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }
          .role-button {
            padding: 16px 12px !important;
            font-size: 15px !important;
            backdrop-filter: blur(8px) !important;
          }
        }
        @media (max-width: 480px) {
          .auth-container {
            background-position: center 15% !important; /* Small mobile: fine-tune positioning */
          }
          .auth-form {
            padding: 20px !important;
            border-radius: 16px !important;
            backdrop-filter: blur(12px) saturate(140%) !important;
          }
          .auth-form::before {
            border-radius: 16px 16px 0 0 !important;
          }
          .auth-title {
            font-size: 28px !important;
          }
        }
        
        /* Large Desktop Optimization */
        @media (min-width: 1200px) {
          .auth-container {
            background-position: center 10% !important; /* Large screens: show more of the top */
          }
        }
        
        /* Performance optimizations - only for animated elements */
        .auth-form {
          transform: translateZ(0);
        }
      `}</style>
      <div style={styles.container} className="auth-container">
        <div style={styles.formContainer} className="auth-form">
        <div style={styles.header} className="auth-header">
          <h1 style={styles.title} className="auth-title">StatJam</h1>
          <p style={styles.subtitle} className="auth-subtitle">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div 
            style={styles.error}
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(error, { 
                ALLOWED_TAGS: [], // Strip all HTML tags
                ALLOWED_ATTR: [] // Strip all attributes
              }) 
            }}
          />
        )}

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
                className="auth-input"
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
                className="auth-input"
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
                }} className="role-grid">
                  {/* Player Role */}
                  <button
                    type="button"
                    onClick={() => setUserType('player')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      minHeight: '48px',
                      touchAction: 'manipulation',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className={userType === 'player' ? 'role-button-selected' : 'role-button-unselected'}
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
                        target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        target.style.background = 'rgba(255, 255, 255, 0.8)';
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
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      minHeight: '48px',
                      touchAction: 'manipulation',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className={userType === 'organizer' ? 'role-button-selected' : 'role-button-unselected'}
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
                        target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        target.style.background = 'rgba(255, 255, 255, 0.8)';
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
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      minHeight: '48px',
                      touchAction: 'manipulation',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className={userType === 'stat_admin' ? 'role-button-selected' : 'role-button-unselected'}
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
                        target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        target.style.background = 'rgba(255, 255, 255, 0.8)';
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
            className="auth-input"
            autoComplete="email"
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
            className="auth-input"
            minLength={6}
            autoComplete="new-password"
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
          <small style={{
            display: 'block',
            marginTop: '4px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            Password must be at least 6 characters
          </small>

          {!isLogin && (
            <>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={styles.input}
                className="auth-input"
                minLength={6}
                autoComplete="new-password"
                onFocus={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
              <small style={{
                display: 'block',
                marginTop: '4px',
                marginBottom: '12px',
                fontSize: '12px',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Password must be at least 6 characters
              </small>
            </>
          )}

          <button
            type="submit"
            style={styles.button}
            className="auth-button"
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
          <span style={{ 
            color: '#000000', // Pure black for maximum contrast
            fontWeight: '500', // Slightly bolder
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' // White shadow for glass contrast
          }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            style={styles.switchButton}
            onClick={() => setIsLogin(!isLogin)}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = '#dc2626'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#000000'}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default AuthPageV2;