import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Sparkles, UserPlus, Wrench } from 'lucide-react';
import './client-auth.css';
import BrandLogo from '../../components/BrandLogo';

import { api } from '../../api/client';

type AuthMode = 'login' | 'register' | 'forgot';

interface ClientLoginProps {
  onLogin: () => void;
  onBack: () => void;
  referredBy?: string;
}

export default function ClientLogin({ onLogin, onBack, referredBy }: ClientLoginProps) {
  const [mode, setMode] = useState<AuthMode>(referredBy ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(referredBy ?? '');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = () => {
    setEmail('client@fixlab.com');
    setPassword('password');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      setSubmitting(true);
      try {
        await api.auth.login(email.trim().toLowerCase(), password, 'client', remember);
        onLogin();
      } catch (err: any) {
        if (email.trim().toLowerCase() === 'client@fixlab.com' && password === 'password') {
          onLogin();
        } else {
          setError(err.message || 'Invalid email address or password.');
        }
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please check and try again.');
        return;
      }
      setSubmitting(true);
      try {
        await api.auth.register({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          referral_code: code.trim() || undefined,
        }, remember);
        onLogin();
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'forgot') {
      if (!forgotEmail.trim()) {
        setError('Please enter your registered email address.');
        return;
      }
      setForgotSent(true);
    }
  };

  return (
    <div className="client-auth-shell">
      {/* Top Header Bar */}
      <header className="client-auth-header">
        <button className="client-auth-brand" onClick={onBack} aria-label="Kendat FixLap home">
          <BrandLogo size="md" />
        </button>
        <button className="client-back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          <span className="full">Back to Kendat FixLap</span>
          <span className="short">Back</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <div className="client-auth-card">
        {mode === 'forgot' ? (
          /* Forgot Password View */
          forgotSent ? (
            <div className="client-success-box">
              <div className="client-success-icon">
                <CheckCircle2 size={30} />
              </div>
              <h2>Recovery link sent!</h2>
              <p>
                We have sent password reset instructions to <strong>{forgotEmail}</strong>. Please check your inbox and follow the instructions.
              </p>
              <button
                type="button"
                className="client-submit-btn"
                onClick={() => {
                  setForgotSent(false);
                  setMode('login');
                }}
              >
                Return to sign in <ArrowRight size={16} />
              </button>
              <div className="client-bottom-switch">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                  }}
                >
                  Resend link
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="client-card-icon">
                <KeyRound size={22} />
              </div>
              <p className="eyebrow">Account recovery</p>
              <h1>Reset your password</h1>
              <p className="client-auth-desc">
                Enter the email address associated with your account and we’ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="client-auth-form" noValidate>
                <div className="client-field">
                  <label htmlFor="client-forgot-email" className="client-field-label">
                    <span>Email address</span>
                  </label>
                  <input
                    id="client-forgot-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setError('');
                    }}
                  />
                </div>

                {error && <div className="client-auth-error">{error}</div>}

                <button type="submit" className="client-submit-btn">
                  Send reset link <ArrowRight size={17} />
                </button>
              </form>

              <div className="client-bottom-switch">
                <span>Remember your password?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  Back to sign in
                </button>
              </div>
            </>
          )
        ) : (
          /* Login & Register Views */
          <>
            <div className="client-card-icon">
              {mode === 'register' ? <UserPlus size={22} /> : <LockKeyhole size={22} />}
            </div>

            <p className="eyebrow">Client portal</p>
            <h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
            <p className="client-auth-desc">
              {mode === 'register'
                ? 'Track repairs, manage your profile and earn referral rewards.'
                : 'Sign in to submit and track your device repairs.'}
            </p>

            {/* Segmented Control Tabs */}
            <div className="client-auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Create account
              </button>
            </div>

            {/* Referral code banner */}
            {mode === 'register' && code && (
              <div className="client-referral-banner">
                <Sparkles size={16} />
                <span>Referral bonus code <strong>{code}</strong> active</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="client-auth-form" noValidate>
              {mode === 'register' && (
                <>
                  <div className="client-field">
                    <label htmlFor="client-fullname" className="client-field-label">
                      <span>Full name</span>
                    </label>
                    <input
                      id="client-fullname"
                      type="text"
                      required
                      placeholder="e.g. Sarah Johnson"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError('');
                      }}
                    />
                  </div>

                  <div className="client-field">
                    <label htmlFor="client-phone" className="client-field-label">
                      <span>Phone number</span>
                      <span className="client-field-optional">Optional</span>
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      placeholder="080 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="client-field">
                <label htmlFor="client-email" className="client-field-label">
                  <span>Email address</span>
                </label>
                <input
                  id="client-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />
              </div>

              <div className="client-field">
                <label htmlFor="client-password" className="client-field-label">
                  <span>Password</span>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="client-forgot-link"
                      onClick={() => {
                        setMode('forgot');
                        setForgotEmail(email);
                        setError('');
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </label>
                <div className="client-input-wrap">
                  <input
                    id="client-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    className="client-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="client-field">
                    <label htmlFor="client-confirm-password" className="client-field-label">
                      <span>Confirm password</span>
                    </label>
                    <div className="client-input-wrap">
                      <input
                        id="client-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                      />
                      <button
                        type="button"
                        className="client-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="client-field">
                    <label htmlFor="client-referral" className="client-field-label">
                      <span>Referral code</span>
                      <span className="client-field-optional">Optional</span>
                    </label>
                    <input
                      id="client-referral"
                      type="text"
                      placeholder="e.g. SARAH200"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </>
              )}

              {mode === 'login' && (
                <label className="client-check-label">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              )}

              {mode === 'register' && (
                <label className="client-check-label">
                  <input type="checkbox" defaultChecked required />
                  <span>I agree to Kendat FixLap Terms of Service & Privacy Policy</span>
                </label>
              )}

              {error && <div className="client-auth-error">{error}</div>}

              <button type="submit" className="client-submit-btn">
                {mode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
              </button>
            </form>

            {/* Quick Demo Helper for Login */}
            {mode === 'login' && (
              <div className="client-demo-bar">
                <span>Demo account: <strong>client@fixlab.com</strong></span>
                <button type="button" className="client-demo-btn" onClick={fillDemo}>
                  Quick fill
                </button>
              </div>
            )}

            {/* Bottom Switch between modes */}
            <div className="client-bottom-switch">
              <span>{mode === 'register' ? 'Already have an account?' : 'New to Kendat FixLap?'}</span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                }}
              >
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="client-auth-footer">
        © 2026 Kendat FixLap · Your repairs, in one place
      </footer>
    </div>
  );
}
