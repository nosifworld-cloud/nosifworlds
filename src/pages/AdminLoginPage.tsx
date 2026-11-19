import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandCrest } from '../components/BrandLogo';

export function AdminLoginPage() {
  const {
    user,
    authReady,
    isAdmin,
    signInWithEmailPassword,
    signInWithGoogle,
    resendVerificationEmail,
    signOutUser,
    navigate,
  } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authReady && user && isAdmin) {
      navigate({ page: 'admin' });
    }
  }, [authReady, user, isAdmin, navigate]);

  const mapAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method). Enable Email/Password there or sign in using your authorized Admin Google account below.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
      return 'Invalid administrator email or password.';
    }
    if (msg.includes('auth/too-many-requests')) {
      return 'Too many failed sign-in attempts. Please wait a moment before trying again.';
    }
    return msg || 'Authentication failed.';
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await signInWithEmailPassword(email, password);
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await resendVerificationEmail();
      setInfoMsg('Verification email dispatched. Open the link in your inbox, then sign in again.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to dispatch verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between px-4 py-8">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ page: 'home' })}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#C8A252] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>

        <span className="text-[11px] uppercase tracking-[0.22em] text-[#C8A252]">
          Admin Gateway
        </span>
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-10">
        <div className="bg-[#141416] border border-white/10 p-8 sm:p-10 space-y-7 shadow-2xl">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#C8A252]/40 bg-[#09090B] mx-auto">
              <BrandCrest className="w-6 h-6" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#C8A252]">
              NOSIF WORLDS Executive Suite
            </p>
            <h1 className="font-display text-3xl font-semibold text-white">
              Administrator Sign In
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Protected by Firebase Authentication and Cloud Firestore Security Rules.
            </p>
          </div>

          {/* Signed-in non-admin or unverified notices */}
          {authReady && user && !isAdmin && (
            <div className="bg-[#09090B] border border-amber-500/40 p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Signed in as {user.email}
                  </p>
                  {!user.emailVerified ? (
                    <p className="text-zinc-300 leading-relaxed">
                      Your email address is not verified yet. Firestore admin rules require a verified email address.
                    </p>
                  ) : (
                    <p className="text-zinc-300 leading-relaxed">
                      This verified account does not hold administrator privileges in NOSIF WORLDS. Sign out and authenticate with an authorized administrator account.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 bg-[#C8A252] text-[#09090B] font-semibold uppercase tracking-wider"
                  >
                    Send Verification Email
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-zinc-200 hover:border-[#C8A252]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-200 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-3.5 text-xs text-emerald-200 leading-relaxed">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8A252]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8A252]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Authenticating...' : 'Sign In with Email & Password'}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <span className="border-t border-white/10 w-full" />
            <span className="bg-[#141416] px-3 text-[11px] uppercase tracking-widest text-zinc-500 shrink-0">
              or
            </span>
            <span className="border-t border-white/10 w-full" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider hover:border-[#C8A252] hover:text-[#C8A252] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#C8A252]" />
            <span>Continue with Admin Google Account</span>
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-zinc-600">
        Single-Vendor Commerce Control · NOSIF WORLDS
      </p>
    </div>
  );
}
