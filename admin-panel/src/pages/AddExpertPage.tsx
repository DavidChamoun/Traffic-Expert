import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileBadge,
  Phone,
  Mail,
  MapPin,
  User
} from 'lucide-react';
import { addExpert } from '../services/expertService';
import toast from 'react-hot-toast';

export const AddExpertPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !licenseNumber.trim() || !phoneNumber.trim()) {
      setError('Please complete all mandatory fields: Full Name, License Number, and Phone Number.');
      return;
    }

    setLoading(true);

    try {
      await addExpert({
        licenseNumber: licenseNumber.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.success(`Expert "${fullName.trim()}" authorized successfully.`);
      navigate(`/experts/${licenseNumber.trim()}`);
    } catch (err: any) {
      console.error('Error adding expert:', err);
      setError(err.message || 'Failed to authorize expert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/experts"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Expert Management
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Add New Traffic Expert
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Officially authorize an accident expert under Syndicate authority in Lebanon
              </p>
            </div>
          </div>
        </div>

        {/* Syndicate Compliance Notice */}
        <div className="mx-6 mt-6 p-4 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed space-y-1">
            <p className="font-semibold">Syndicate Authorization Architecture Notice:</p>
            <p className="text-blue-800">
              Creating an official record grants syndicate verification in <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">verifiedExperts/&#123;licenseNumber&#125;</code>.
              It does <strong>not</strong> create a mobile application account or store passwords.
              The expert will securely complete mobile registration using their verified license and phone OTP.
            </p>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 leading-relaxed font-medium">
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Syndicate License Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FileBadge className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. 1042 or EXP-2026"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Must be unique. Serves as the document ID in Firestore.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Official Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Georges Abi Nader"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Official Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+961 71 123 456 or 71123456"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Used for SMS OTP authentication on the mobile application.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="expert@example.com"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Professional Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Professional Office Address / Syndicate Zone <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute top-2.5 left-3 flex items-center pointer-events-none text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Achrafieh, Beirut, Lebanon — District 4"
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/experts')}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating & Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Authorize Expert Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
