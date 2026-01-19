import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard, Button, Input } from '../components/ui';
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
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Portfolio Vision
          </h1>
          <p className="text-white/50">Crypto Portfolio Tracker</p>
        </div>

        <GlassCard>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">{getTitle()}</h2>
            <p className="text-sm text-white/50 mt-1">{getSubtitle()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-glass w-full pl-10"
                  required
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass w-full pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass w-full pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'magic-link' && 'Send Magic Link'}
              {mode === 'forgot-password' && 'Send Reset Link'}
            </Button>
          </form>

          {/* Alternative Auth Options */}
          <div className="mt-6 pt-6 border-t border-white/10">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('magic-link')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white mb-3"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Sign in with Magic Link</span>
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setMode('forgot-password')}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Create account
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center text-sm">
                <span className="text-white/50">Already have an account? </span>
                <button
                  onClick={() => setMode('login')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {(mode === 'magic-link' || mode === 'forgot-password') && (
              <div className="text-center text-sm">
                <button
                  onClick={() => setMode('login')}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Privacy Note */}
        <p className="text-center text-xs text-white/30 mt-6">
          Your data is encrypted and securely stored in the cloud.
        </p>
      </div>
    </div>
  );
}
