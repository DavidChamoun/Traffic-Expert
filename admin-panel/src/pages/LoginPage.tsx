import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { claimInitialAdmin } from '../services/authService';
import { Scale, Lock, Mail, AlertCircle, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

import logoImg from '../assets/images/traffic_expert.png';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialAdminLoading, setInitialAdminLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBootstrapHelp, setShowBootstrapHelp] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your administrator email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Successfully authenticated as Syndicate Administrator.');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMsg = 'Authentication failed. Please verify your administrator credentials.';
      if (err.message && err.message.includes('Access denied')) {
        errorMsg = err.message;
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'Invalid email or password. Only registered Syndicate Administrators can access this panel.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimInitialAdmin = async () => {
    setInitialAdminLoading(true);
    try {
      const msg = await claimInitialAdmin();
      toast.success(msg || 'Initial admin role granted! Please sign in again.');
      setShowBootstrapHelp(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim initial admin role.');
    } finally {
      setInitialAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/100 p-2 flex items-center justify-center shadow-xl shadow-primary-900/50 backdrop-blur-xs border border-white/10">
            <img
              src={logoImg}
              alt="Traffic Expert Syndicate Official Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Traffic Expert
        </h2>
        <p className="mt-1 text-center text-sm text-blue-400 font-medium">
          Syndicate of Traffic Accident Experts in Lebanon
        </p>
        <p className="text-center text-xs text-slate-400 mt-1">
          Official Administrative Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/20">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <ShieldCheck className="w-4 h-4 text-primary-500" />
            Administrator Sign In
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 leading-relaxed font-medium">
                {error}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@syndicate.gov.lb"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Authorization...
                </>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>

          {/* Initial Admin Provisioning Helper Accordion */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setShowBootstrapHelp(!showBootstrapHelp)}
              className="text-xs text-gray-500 hover:text-primary-600 inline-flex items-center gap-1 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              First-time administrator setup info
            </button>

            {showBootstrapHelp && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-left text-xs text-gray-600 border border-slate-200 space-y-2">
                <p className="font-semibold text-gray-800">Bootstrapping Syndicate Administrator:</p>
                <p>
                  1. Create a Firebase Authentication user in the Firebase Console with your syndicate email.
                </p>
                <p>
                  2. Add a document in Firestore collection <code className="bg-slate-200 px-1 rounded">adminUsers/&#123;uid&#125;</code> with field <code className="bg-slate-200 px-1 rounded">role: "admin"</code>, or deploy the Cloud Function <code className="bg-slate-200 px-1 rounded">createInitialAdmin</code>.
                </p>
                <button
                  type="button"
                  onClick={handleClaimInitialAdmin}
                  disabled={initialAdminLoading}
                  className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 underline flex items-center gap-1"
                >
                  {initialAdminLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Trigger Initial Admin Claim (Cloud Function)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Official Administrative Authority • Traffic Accident Experts Syndicate • Lebanon
        </div>
      </div>
    </div>
  );
};
