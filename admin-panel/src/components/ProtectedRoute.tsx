import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Verifying Syndicate Administration credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Your account ({user.email}) does not possess verified Syndicate Administrator privileges.
            Access is restricted solely to authorized Syndicate officials.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-2.5 px-4 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
