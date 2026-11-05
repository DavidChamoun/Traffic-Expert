import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  History,
  ShieldCheck,
  Scale
} from 'lucide-react';

import logoImg from '../assets/images/traffic_expert.png';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/experts',
      label: 'Expert Management',
      icon: Users,
    },
    {
      to: '/experts/new',
      label: 'Authorize Expert',
      icon: UserPlus,
    },
    {
      to: '/activity',
      label: 'Audit & Activity Log',
      icon: History,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Traffic Expert Syndicate Logo"
            className="w-10 h-10 object-contain rounded-lg p-0.5 bg-white/100 shadow-sm"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              Traffic Expert
            </h1>
            <p className="text-[11px] text-blue-400 font-medium tracking-wide">
              Syndicate Administration
            </p>
          </div>
        </div>
      </div>

      {/* Official Syndicate Banner */}
      <div className="mx-4 my-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-[11px] leading-tight">
          Official Syndicate of Traffic Accident Experts in Lebanon
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Backend: Firestore</span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </span>
        </div>
      </div>
    </aside>
  );
};
