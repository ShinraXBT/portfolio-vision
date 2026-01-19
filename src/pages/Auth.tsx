import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

type AuthMode = 'login' | 'signup' | 'magic-link' | 'forgot-password';

export function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithMagicLink, resetPassword } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('Check your email to confirm your account!');
      } else if (mode === 'magic-link') {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setSuccess('Magic link sent! Check your email.');
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('Password reset email sent!');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'magic-link': return 'Magic Link';
      case 'forgot-password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to your portfolio';
      case 'signup': return 'Start tracking your crypto';
      case 'magic-link': return 'Sign in without password';
      case 'forgot-password': return 'We\'ll send you a reset link';
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Portfolio Vision
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Crypto Portfolio Tracker</p>
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{getTitle()}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{getSubtitle()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-11"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-11"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'magic-link' && 'Send Magic Link'}
              {mode === 'forgot-password' && 'Send Reset Link'}
            </Button>
          </form>

          {/* Alternative Auth Options */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('magic-link')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign in with Magic Link</span>
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setMode('forgot-password')}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium"
                  >
                    Create account
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center text-sm">
                <span className="text-[var(--color-text-muted)]">Already have an account? </span>
                <button
                  onClick={() => setMode('login')}
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium"
                >
                  Sign in
                </button>
              </div>
            )}

            {(mode === 'magic-link' || mode === 'forgot-password') && (
              <div className="text-center text-sm">
                <button
                  onClick={() => setMode('login')}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Your data is encrypted and securely stored in the cloud.
        </p>
      </div>
    </div>
  );
}
