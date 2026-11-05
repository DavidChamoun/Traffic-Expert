import React, { useEffect, useState } from 'react';
import {
  History,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  RotateCcw,
  Edit,
  UserPlus,
  Loader2
} from 'lucide-react';
import { getRecentActivityLogs } from '../services/activityService';
import { ActivityLogEntry, ActivityAction } from '../types';
import toast from 'react-hot-toast';

export const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadLogs = async () => {
    try {
      const data = await getRecentActivityLogs(100);
      setLogs(data);
    } catch (err: any) {
      console.error('Error fetching activity log:', err);
      toast.error('Failed to load syndicate activity logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.adminEmail.toLowerCase().includes(q) ||
      (log.expertName && log.expertName.toLowerCase().includes(q)) ||
      (log.expertLicense && log.expertLicense.toLowerCase().includes(q)) ||
      (log.reason && log.reason.toLowerCase().includes(q));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: ActivityAction) => {
    switch (action) {
      case 'expert_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserPlus className="w-3.5 h-3.5 text-blue-500" />
            Expert Authorized
          </span>
        );
      case 'expert_updated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            Official Info Updated
          </span>
        );
      case 'expert_suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Suspension
          </span>
        );
      case 'expert_reactivated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
            Reactivation
          </span>
        );
      case 'expert_revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <UserX className="w-3.5 h-3.5 text-rose-500" />
            Revocation
          </span>
        );
      case 'admin_granted':
      case 'initial_admin_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            Admin Provisioned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Syndicate Audit & Activity Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable tracking record of all administrative decisions, suspensions, and authorizations
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin email, expert name, license, or justification..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">All Administrative Actions</option>
            <option value="expert_created">Expert Authorized</option>
            <option value="expert_updated">Expert Updated</option>
            <option value="expert_suspended">Expert Suspended</option>
            <option value="expert_reactivated">Expert Reactivated</option>
            <option value="expert_revoked">Expert Revoked</option>
            <option value="admin_granted">Admin Provisioning</option>
          </select>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-xs text-gray-500 font-medium">Retrieving audit records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Expert / Reference</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Official Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                        {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {log.expertName ? (
                          <div>
                            <div>{log.expertName}</div>
                            <span className="font-mono text-[11px] text-gray-400">License: {log.expertLicense}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono">{log.expertLicense || 'System'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        {log.adminEmail}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs">
                        {log.reason ? (
                          <span className="italic bg-gray-50 px-2 py-1 rounded border border-gray-200 block text-[11px]">
                            "{log.reason}"
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No activity logs match the current search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
