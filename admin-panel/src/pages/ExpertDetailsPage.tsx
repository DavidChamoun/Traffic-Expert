import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  AlertTriangle,
  RotateCcw,
  XCircle,
  FileBadge,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Smartphone,
  Radio,
  Navigation,
  ShieldCheck,
  History,
  Loader2,
  Lock
} from 'lucide-react';
import { AuthorizationBadge, RegistrationBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  getExpertByLicense,
  suspendExpertAction,
  reactivateExpertAction,
  revokeExpertAction
} from '../services/expertService';
import { getExpertActivityLogs } from '../services/activityService';
import { ExpertWithAccount, ActivityLogEntry } from '../types';
import toast from 'react-hot-toast';

export const ExpertDetailsPage: React.FC = () => {
  const { licenseNumber } = useParams<{ licenseNumber: string }>();
  const navigate = useNavigate();

  const [expert, setExpert] = useState<ExpertWithAccount | null>(null);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'revoke' | 'reactivate' | 'danger';
    title: string;
    message: string;
    confirmLabel: string;
  }>({
    isOpen: false,
    type: 'suspend',
    title: '',
    message: '',
    confirmLabel: '',
  });

  const loadData = async () => {
    if (!licenseNumber) return;
    try {
      const [expertData, expertLogs] = await Promise.all([
        getExpertByLicense(licenseNumber),
        getExpertActivityLogs(licenseNumber),
      ]);
      setExpert(expertData);
      setLogs(expertLogs);
    } catch (err: any) {
      console.error('Error fetching expert details:', err);
      toast.error('Failed to load expert details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [licenseNumber]);

  const handleConfirmAction = async (reason?: string) => {
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

    loadData();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading comprehensive expert records...</p>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-rose-200 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Expert Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">No syndicate expert record with license {licenseNumber}.</p>
        <Link
          to="/experts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expert List
        </Link>
      </div>
    );
  }

  const authStatus = expert.authorizationStatus || 'authorized';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation and Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/experts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expert Registry
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link
            to={`/experts/${expert.licenseNumber}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
            Edit Info
          </Link>

          {authStatus === 'authorized' && (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  type: 'suspend',
                  title: 'Suspend Expert Authorization',
                  message: `Temporarily suspend ${expert.fullName}. The expert will be disabled from receiving accident calls.`,
                  confirmLabel: 'Suspend Expert',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Suspend
            </button>
          )}

          {authStatus === 'suspended' && (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  type: 'reactivate',
                  title: 'Reactivate Expert Authorization',
                  message: `Re-authorize ${expert.fullName} to resume accident dispatch services.`,
                  confirmLabel: 'Reactivate Expert',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reactivate
            </button>
          )}

          {authStatus !== 'revoked' && (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  type: 'revoke',
                  title: 'Permanently Revoke Syndicate Authorization',
                  message: `Permanently revoke ${expert.fullName}'s credentials. This operation is recorded in the Syndicate permanent register.`,
                  confirmLabel: 'Revoke Authorization',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              Revoke
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary-900/20">
              {expert.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {expert.fullName}
                </h1>
                <AuthorizationBadge status={authStatus} />
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span>License: <strong className="font-mono text-gray-800">{expert.licenseNumber}</strong></span>
                <span>•</span>
                <span>Syndicate Certified Traffic Accident Inspector</span>
              </p>
            </div>
          </div>

          <div>
            <RegistrationBadge
              isRegistered={expert.isRegistered}
              isAvailable={expert.account?.isAvailable}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Syndicate Info & Mobile Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official Syndicate Registry Data */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-gray-100">
            <ShieldCheck className="w-4 h-4 text-primary-500" />
            Official Syndicate Registry Details
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <FileBadge className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-500 block">License Document Key</span>
                <span className="font-mono font-semibold text-gray-900">{expert.licenseNumber}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-500 block">Registered Phone (OTP)</span>
                <span className="font-mono font-semibold text-gray-900">{expert.phoneNumber}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-500 block">Official Email Address</span>
                <span className="text-gray-900 font-medium">{expert.email || '—'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-500 block">Syndicate Zone / Address</span>
                <span className="text-gray-900 font-medium">{expert.address || '—'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-500 block">Record Authorized At</span>
                <span className="text-gray-900 font-medium">
                  {expert.createdAt ? expert.createdAt.toLocaleDateString() + ' ' + expert.createdAt.toLocaleTimeString() : 'Legacy Record'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Mobile Application Account Data */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-gray-100">
            <Smartphone className="w-4 h-4 text-primary-500" />
            Mobile Application Account
          </div>

          {expert.account ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Radio className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-500 block">Current Dispatch Availability</span>
                  <span className={`font-semibold inline-flex items-center gap-1.5 ${expert.account.isAvailable ? 'text-emerald-600' : 'text-gray-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${expert.account.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {expert.account.isAvailable ? 'Available for calls' : 'Currently busy / unavailable'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-500 block">Background Location Tracking</span>
                  <span className="text-gray-900 font-medium">
                    {expert.account.isTrackingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {expert.account.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-500 block">Last Reported Coordinates</span>
                    <span className="font-mono text-gray-900">
                      Lat: {expert.account.location.latitude.toFixed(5)}, Long: {expert.account.location.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-500 block">Last Active / Sync</span>
                  <span className="text-gray-900 font-medium">
                    {expert.account.lastUpdated ? expert.account.lastUpdated.toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              {/* Security Shield Note */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md">
                <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Security Protected: Expert authentication secrets are fully encrypted and never exposed.</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs space-y-2">
              <Smartphone className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-600">No Mobile Account Created Yet</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                This expert is authorized by the syndicate, but has not yet completed initial registration in the mobile app.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log for this Expert */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-bold text-gray-900">Syndicate Audit Trail for this Record</h2>
        </div>

        <div className="p-5">
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400">{log.timestamp.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-600 mt-0.5">Admin: {log.adminEmail}</div>
                    {log.reason && (
                      <div className="mt-1 text-gray-500 italic bg-white p-2 rounded border border-gray-200 text-[11px]">
                        "{log.reason}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              No specific audit trail entries recorded yet for this license.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        expertName={expert.fullName}
        expertLicense={expert.licenseNumber}
        confirmLabel={modalConfig.confirmLabel}
        requireReason={modalConfig.type === 'revoke' || modalConfig.type === 'suspend'}
        onConfirm={handleConfirmAction}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
