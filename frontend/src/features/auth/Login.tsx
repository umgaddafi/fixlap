import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Wrench } from 'lucide-react';
import type { Role } from '../../types';
import users from '../../data/users.json';
import { api } from '../../api/client';
import BrandLogo from '../../components/BrandLogo';
import './staff-login.css';

interface LoginProps {
  initialRole?: Role;
  onLogin: (role: Role, remember: boolean) => void;
  onBack: () => void;
}

export default function Login({ initialRole = 'repairer', onLogin, onBack }: LoginProps) {
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState(initialRole === 'admin' ? 'admin@fixlab.com' : 'repairer@fixlab.com');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotHelp, setForgotHelp] = useState(false);
  const [error, setError] = useState('');

  const chooseRole = (next: Role) => {
    setRole(next);
    setEmail(next === 'admin' ? 'admin@fixlab.com' : 'repairer@fixlab.com');
    setError('');
    setForgotHelp(false);
  };

  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailInput = event.currentTarget.elements.namedItem('email') as HTMLInputElement;
    if (!email.trim() || emailInput.validity.typeMismatch) {
      setError('Enter a valid email address to continue.');
      emailInput.focus();
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      (event.currentTarget.elements.namedItem('password') as HTMLInputElement).focus();
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.auth.login(email.trim().toLowerCase(), password, role, remember);
      onLogin(role, remember);
    } catch (err: any) {
      // Fallback check if backend was temporarily unreachable
      const found = users.staff.find(user => user.email === email.trim().toLowerCase() && user.password === password && user.role === role);
      if (found) {
        onLogin(role, remember);
      } else {
        setError(err.message || `Those details do not match ${role === 'admin' ? 'an administrator' : 'a technician'} account.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell staff-login">
      <header className="staff-login-header">
        <button className="staff-login-brand login-brand" onClick={onBack} aria-label="Kendat FixLap home">
          <BrandLogo size="md" />
        </button>
        <button className="staff-home-link" onClick={onBack}><ArrowLeft size={15} /> <span className="full">Back to home</span><span className="short">Back</span></button>
      </header>
      <div className="login-card">
        <div className="staff-login-icon"><ShieldCheck size={23} /></div>
        <p className="eyebrow">The Kendat FixLap workspace</p>
        <h1>A good day starts here.</h1>
        <p className="staff-login-intro">Sign in to keep repairs moving and customers in the loop.</p>
        <div className="role-switch" role="group" aria-label="Staff account role">
          <button type="button" aria-pressed={role === 'repairer'} className={role === 'repairer' ? 'selected' : ''} onClick={() => chooseRole('repairer')}><Wrench size={15} /> Technician</button>
          <button type="button" aria-pressed={role === 'admin'} className={role === 'admin' ? 'selected' : ''} onClick={() => chooseRole('admin')}><ShieldCheck size={15} /> Administrator</button>
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="staff-email">Email address<input id="staff-email" name="email" type="email" autoComplete="username" value={email} onChange={event => { setEmail(event.target.value); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'staff-login-error' : undefined} required /></label>
          <div className="staff-password-field">
            <div className="staff-password-header">
              <label htmlFor="staff-password">Password</label>
              <button type="button" className="staff-forgot-link" onClick={() => setForgotHelp(!forgotHelp)}>Forgot password?</button>
            </div>
            <div className="staff-password-input"><input id="staff-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'staff-login-error' : undefined} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          </div>
          {forgotHelp && <div className="staff-login-help">Staff accounts are managed by your administrator. Contact Alex Doe at <strong>admin@fixlab.com</strong> or use the demo credentials below.</div>}
          <label className="staff-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember me on this device</label>
          {error && <p id="staff-login-error" className="staff-login-error" role="alert">{error}</p>}
          <button className="primary full" type="submit">Open my workspace <ArrowRight size={17} /></button>
        </form>
        <details className="staff-demo-details"><summary>Demo account details</summary><p>Technician: <strong>repairer@fixlab.com</strong><br />Administrator: <strong>admin@fixlab.com</strong><br />Password for both: <strong>password</strong></p></details>
      </div>
      <p className="login-footer">© {new Date().getFullYear()} Kendat FixLap · A better repair experience</p>
    </main>
  );
}
