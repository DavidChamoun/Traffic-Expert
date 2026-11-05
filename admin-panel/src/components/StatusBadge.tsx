import React from 'react';
import { AuthorizationStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Smartphone, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: AuthorizationStatus;
}

export const AuthorizationBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'authorized':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Authorized
        </span>
      );
    case 'suspended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Suspended
        </span>
      );
    case 'revoked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Revoked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Unknown
        </span>
      );
  }
};

export const RegistrationBadge: React.FC<{ isRegistered: boolean; isAvailable?: boolean }> = ({
  isRegistered,
  isAvailable
}) => {
  if (!isRegistered) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        Not Registered
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Smartphone className="w-3.5 h-3.5 text-blue-500" />
      Registered
      {isAvailable !== undefined && (
        <span className={`w-1.5 h-1.5 rounded-full ml-1 ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      )}
    </span>
  );
};
