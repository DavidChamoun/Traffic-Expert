import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileBadge,
  Phone,
  Mail,
  MapPin,
  User,
  Lock
} from 'lucide-react';
import { getExpertByLicense, updateExpert } from '../services/expertService';
import { ExpertWithAccount } from '../types';
import toast from 'react-hot-toast';

export const EditExpertPage: React.FC = () => {
  const { licenseNumber } = useParams<{ licenseNumber: string }>();
  const navigate = useNavigate();

  const [expert, setExpert] = useState<ExpertWithAccount | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExpert = async () => {
      if (!licenseNumber) return;
      try {
        const data = await getExpertByLicense(licenseNumber);
        if (!data) {
          setError(`Expert with license ${licenseNumber} was not found.`);
        } else {
          setExpert(data);
          setFullName(data.fullName);
          setPhoneNumber(data.phoneNumber);
          setEmail(data.email || '');
          setAddress(data.address || '');
        }
      } catch (err: any) {
        console.error('Error fetching expert:', err);
        setError('Failed to load expert details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpert();
  }, [licenseNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber) return;

    setError('');
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Full Name and Phone Number are required.');
      return;
    }

    setSaving(true);
    try {
      await updateExpert(licenseNumber, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.success('Official expert information updated.');
      navigate(`/experts/${licenseNumber}`);
    } catch (err: any) {
      console.error('Error updating expert:', err);
      setError(err.message || 'Failed to update expert record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading expert record...</p>
      </div>
    );
  }

  if (error && !expert) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-rose-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Expert Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to={`/experts/${licenseNumber}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Expert Profile
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Edit Syndicate Expert Information
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Update official syndicate registry details for {expert?.fullName}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Number (Read-only with explanation) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Syndicate License Number
                </label>
                <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Immutable
                </span>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FileBadge className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={licenseNumber || ''}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight">
                License number is the primary key in Firestore and mobile document references (<code className="text-gray-500">verifiedRef</code>). It cannot be altered without breaking existing mobile app sessions.
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
                  placeholder="Official name"
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
                  placeholder="+961 71 123 456"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Updating this phone number updates the recipient of mobile SMS OTP.
              </p>
            </div>

            {/* Email */}
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

          {/* Address */}
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
                placeholder="Office location / district"
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/experts/${licenseNumber}`)}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
