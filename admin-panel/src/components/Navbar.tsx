import React from 'react';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-100 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Administrative Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Administrator profile badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-gray-900 leading-tight">
              {user?.displayName || user?.email?.split('@')[0] || 'Syndicate Admin'}
            </div>
            <div className="text-[11px] text-gray-500 font-mono">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 transition"
          title="Sign out of Syndicate Administration"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
