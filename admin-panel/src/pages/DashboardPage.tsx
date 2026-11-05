import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Smartphone,
  Clock,
  UserPlus,
  RefreshCw,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AuthorizationBadge, RegistrationBadge } from '../components/StatusBadge';
import { getDashboardStats } from '../services/expertService';
import { getRecentActivityLogs } from '../services/activityService';
import { DashboardStats, ActivityLogEntry } from '../types';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [fetchedStats, fetchedActivity] = await Promise.all([
        getDashboardStats(),
        getRecentActivityLogs(6),
      ]);
      setStats(fetchedStats);
      setActivity(fetchedActivity);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      toast.error('Failed to load live syndicate statistics from Firestore.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-medium">Aggregating live Firestore syndicate metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Title and Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Syndicate Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Data
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Official metrics of authorized traffic accident experts in Lebanon
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-2xs"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
            Refresh
          </button>
          <Link
            to="/experts/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Authorize New Expert
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Authorized Records"
          value={stats?.totalExperts || 0}
          subtitle="Syndicate license registry"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active & Authorized"
          value={stats?.authorizedExperts || 0}
          subtitle="Eligible to operate"
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Suspended Experts"
          value={stats?.suspendedExperts || 0}
          subtitle="Temporarily disabled"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Revoked Authorizations"
          value={stats?.revokedExperts || 0}
          subtitle="Permanently barred"
          icon={UserX}
          variant="danger"
        />
      </div>

      {/* Account Activation & Status Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Accounts Activated on Mobile"
          value={stats?.registeredExperts || 0}
          subtitle="Experts who created app credentials"
          icon={Smartphone}
          variant="neutral"
        />
        <StatCard
          title="Pending Mobile Activation"
          value={stats?.unregisteredExperts || 0}
          subtitle="Authorized by syndicate, awaiting first login"
          icon={Clock}
          variant="neutral"
        />
      </div>

      {/* Split Section: Recent Authorized Experts + Administrative Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recently Authorized Experts Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recently Registered Experts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Most recent authorized entries in Firestore</p>
            </div>
            <Link
              to="/experts"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="py-3 px-4">License No.</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">App Account</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {stats?.recentExperts && stats.recentExperts.length > 0 ? (
                  stats.recentExperts.map((expert) => (
                    <tr key={expert.licenseNumber} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        {expert.licenseNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {expert.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <AuthorizationBadge status={expert.authorizationStatus || 'authorized'} />
                      </td>
                      <td className="py-3 px-4">
                        <RegistrationBadge isRegistered={expert.isRegistered} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/experts/${expert.licenseNumber}`}
                          className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No expert records found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Syndicate Administrative Activity */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Syndicate Activity Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">Recent administrative actions & audits</p>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Full log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 flex-1 space-y-4">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-0.5 truncate">
                      {item.expertName ? `${item.expertName} (${item.expertLicense})` : item.adminEmail}
                    </p>
                    {item.reason && (
                      <p className="text-gray-500 italic text-[11px] mt-0.5">"{item.reason}"</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                No recent administrative activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
