import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { AuthorizationBadge, RegistrationBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  getAllExperts,
  suspendExpertAction,
  reactivateExpertAction,
  revokeExpertAction
} from '../services/expertService';
import { ExpertWithAccount, AuthorizationStatus } from '../types';
import toast from 'react-hot-toast';

export const ExpertsListPage: React.FC = () => {
  const [experts, setExperts] = useState<ExpertWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters and search
  const [search, setSearch] = useState('');
  const [authFilter, setAuthFilter] = useState<AuthorizationStatus | 'all'>('all');
  const [regFilter, setRegFilter] = useState<'all' | 'registered' | 'not_registered'>('all');

  // Sorting
  const [sortField, setSortField] = useState<'licenseNumber' | 'fullName' | 'status'>('fullName');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'revoke' | 'reactivate' | 'danger';
    title: string;
    message: string;
    confirmLabel: string;
    expert?: ExpertWithAccount;
  }>({
    isOpen: false,
    type: 'suspend',
    title: '',
    message: '',
    confirmLabel: '',
  });

  const loadExperts = async () => {
    try {
      const data = await getAllExperts();
      setExperts(data);
    } catch (err: any) {
      console.error('Error fetching experts:', err);
      toast.error('Failed to load experts from Firestore.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExperts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadExperts();
  };

  // Filter & Search Logic
  const filteredExperts = useMemo(() => {
    return experts.filter(item => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.licenseNumber.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q));

      const matchesAuth =
        authFilter === 'all' ||
        (item.authorizationStatus || 'authorized') === authFilter;

      const matchesReg =
        regFilter === 'all' ||
        (regFilter === 'registered' ? item.isRegistered : !item.isRegistered);

      return matchesSearch && matchesAuth && matchesReg;
    });
  }, [experts, search, authFilter, regFilter]);

  // Sorting logic
  const sortedExperts = useMemo(() => {
    return [...filteredExperts].sort((a, b) => {
      let comp = 0;
      if (sortField === 'licenseNumber') {
        comp = a.licenseNumber.localeCompare(b.licenseNumber, undefined, { numeric: true });
      } else if (sortField === 'fullName') {
        comp = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'status') {
        comp = (a.authorizationStatus || 'authorized').localeCompare(b.authorizationStatus || 'authorized');
      }
      return sortAsc ? comp : -comp;
    });
  }, [filteredExperts, sortField, sortAsc]);

  // Pagination logic
  const totalPages = Math.ceil(sortedExperts.length / pageSize) || 1;
  const paginatedExperts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedExperts.slice(start, start + pageSize);
  }, [sortedExperts, currentPage, pageSize]);

  // Action Triggers
  const openSuspendModal = (expert: ExpertWithAccount) => {
    setModalConfig({
      isOpen: true,
      type: 'suspend',
      title: 'Suspend Expert Authorization',
      message: `Temporarily suspend ${expert.fullName}'s authorization. The expert will immediately cease appearing on the mobile map and list.`,
      confirmLabel: 'Confirm Suspension',
      expert,
    });
  };

  const openReactivateModal = (expert: ExpertWithAccount) => {
    setModalConfig({
      isOpen: true,
      type: 'reactivate',
      title: 'Reactivate Expert Authorization',
      message: `Restore ${expert.fullName}'s authorized status in the syndicate registry.`,
      confirmLabel: 'Reactivate Expert',
      expert,
    });
  };

  const openRevokeModal = (expert: ExpertWithAccount) => {
    setModalConfig({
      isOpen: true,
      type: 'revoke',
      title: 'Permanently Revoke Authorization',
      message: `Permanently revoke syndicate authorization for ${expert.fullName}. This will bar the expert from all syndicate operations and invalidate active mobile sessions.`,
      confirmLabel: 'Revoke Authorization',
      expert,
    });
  };

  const handleConfirmAction = async (reason?: string) => {
    const expert = modalConfig.expert;
    if (!expert) return;

    if (modalConfig.type === 'suspend') {
      await suspendExpertAction(expert.licenseNumber, reason);
      toast.success(`Expert ${expert.fullName} suspended.`);
    } else if (modalConfig.type === 'reactivate') {
      await reactivateExpertAction(expert.licenseNumber);
      toast.success(`Expert ${expert.fullName} reactivated.`);
    } else if (modalConfig.type === 'revoke') {
      await revokeExpertAction(expert.licenseNumber, reason);
      toast.success(`Expert ${expert.fullName} authorization revoked.`);
    }

    loadExperts();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Expert Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage officially authorized traffic accident experts registered with the Syndicate
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
            Refresh
          </button>
          <Link
            to="/experts/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Expert
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by full name, license number, phone, email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Authorization Filter */}
          <div className="md:col-span-3">
            <select
              value={authFilter}
              onChange={(e) => {
                setAuthFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">All Authorization Statuses</option>
              <option value="authorized">Authorized Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>

          {/* Registration Filter */}
          <div className="md:col-span-3">
            <select
              value={regFilter}
              onChange={(e) => {
                setRegFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">All Account Statuses</option>
              <option value="registered">Registered on App</option>
              <option value="not_registered">Pending App Activation</option>
            </select>
          </div>
        </div>

        {/* Filter stats summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>
            Showing <strong className="text-gray-900">{filteredExperts.length}</strong> of{' '}
            <strong className="text-gray-900">{experts.length}</strong> authorized experts
          </span>
          {(search || authFilter !== 'all' || regFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setAuthFilter('all');
                setRegFilter('all');
                setCurrentPage(1);
              }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Experts Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading syndicate expert registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition"
                    onClick={() => {
                      if (sortField === 'licenseNumber') setSortAsc(!sortAsc);
                      else {
                        setSortField('licenseNumber');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>License No.</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition"
                    onClick={() => {
                      if (sortField === 'fullName') setSortAsc(!sortAsc);
                      else {
                        setSortField('fullName');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Full Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition"
                    onClick={() => {
                      if (sortField === 'status') setSortAsc(!sortAsc);
                      else {
                        setSortField('status');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Syndicate Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">App Account</th>
                  <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedExperts.length > 0 ? (
                  paginatedExperts.map((expert) => {
                    const status = expert.authorizationStatus || 'authorized';
                    return (
                      <tr key={expert.licenseNumber} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {expert.licenseNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>{expert.fullName}</div>
                          {expert.email && (
                            <div className="text-[11px] text-gray-400 font-normal">{expert.email}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">
                          {expert.phoneNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <AuthorizationBadge status={status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <RegistrationBadge
                            isRegistered={expert.isRegistered}
                            isAvailable={expert.account?.isAvailable}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Details view */}
                            <Link
                              to={`/experts/${expert.licenseNumber}`}
                              className="p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition"
                              title="View Full Expert Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Edit info */}
                            <Link
                              to={`/experts/${expert.licenseNumber}/edit`}
                              className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Official Information"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Suspend action (only if authorized) */}
                            {status === 'authorized' && (
                              <button
                                onClick={() => openSuspendModal(expert)}
                                className="p-1.5 rounded-md text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                                title="Suspend Authorization"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reactivate action (only if suspended) */}
                            {status === 'suspended' && (
                              <button
                                onClick={() => openReactivateModal(expert)}
                                className="p-1.5 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                title="Reactivate Authorization"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Revoke action (if not revoked) */}
                            {status !== 'revoked' && (
                              <button
                                onClick={() => openRevokeModal(expert)}
                                className="p-1.5 rounded-md text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Revoke Authorization Permanently"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No syndicate experts match the current search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50/50">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        expertName={modalConfig.expert?.fullName}
        expertLicense={modalConfig.expert?.licenseNumber}
        confirmLabel={modalConfig.confirmLabel}
        requireReason={modalConfig.type === 'revoke' || modalConfig.type === 'suspend'}
        onConfirm={handleConfirmAction}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
