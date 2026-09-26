import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(145deg,#1a2340,#0e1628)', boxShadow: '0 0 24px rgba(245,158,11,.4), 0 4px 12px rgba(0,0,0,.5)' }}>
            <svg width="36" height="36" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="1.2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path d="M13,21 C13,21 3,15 3,9 C3,6 5.5,4 8.5,4 C10.5,4 12,5 13,6.5 C14,5 15.5,4 17.5,4 C20.5,4 23,6 23,9 C23,15 13,21 13,21 Z"
                stroke="url(#hg2)" strokeWidth="1.8" fill="none" strokeLinejoin="round" filter="url(#glow2)"/>
              <path d="M13,22 C13,22 1.5,15.5 1.5,8.5 C1.5,5 4.2,2.5 7.8,2.5 C10.2,2.5 12,3.8 13,5.5 C14,3.8 15.8,2.5 18.2,2.5 C21.8,2.5 24.5,5 24.5,8.5 C24.5,15.5 13,22 13,22 Z"
                stroke="#f59e0b" strokeWidth="0.6" fill="none" opacity="0.25"/>
              <path d="M4,12.5 L7.5,12.5 L9,9.5 L11,15.5 L12.5,11 L14,12.5 L16,12.5 L17.5,9.5 L19,15.5 L20.5,12.5 L22,12.5"
                stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow2)"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">PulsePath</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to your account</p>
        </div>

        <div className="card-base space-y-4 p-6">
          <Button
            type="button"
            variant="outline"
            loading={googleLoading}
            onClick={handleGoogle}
            className="w-full"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
