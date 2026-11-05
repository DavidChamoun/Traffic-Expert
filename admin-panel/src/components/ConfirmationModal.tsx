import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, RefreshCw, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'suspend' | 'revoke' | 'reactivate' | 'danger';
  expertName?: string;
  expertLicense?: string;
  confirmLabel: string;
  requireReason?: boolean;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  type,
  expertName,
  expertLicense,
  confirmLabel,
  requireReason = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('A justification reason is required for syndicate audit tracking.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderIcon = () => {
    switch (type) {
      case 'revoke':
        return (
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        );
      case 'suspend':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'reactivate':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-primary-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'revoke':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'suspend':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'reactivate':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      default:
        return 'bg-primary-500 hover:bg-primary-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          {getHeaderIcon()}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>

        {expertName && (
          <div className="bg-gray-50 rounded-lg p-3.5 mb-4 border border-gray-200">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Expert Full Name</span>
              <span>License Number</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 text-sm">
              <span>{expertName}</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{expertLicense}</span>
            </div>
          </div>
        )}

        {(type === 'suspend' || type === 'revoke' || requireReason) && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Official Justification / Reason {requireReason && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for syndicate activity log records..."
              className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              disabled={isSubmitting}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2 transition ${getConfirmButtonClasses()}`}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
