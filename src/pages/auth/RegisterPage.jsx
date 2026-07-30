import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import {
  Building2, Mail, Lock, Phone, User, CheckCircle2,
  ArrowRight, ArrowLeft, ShieldCheck, Clock, Tag, MapPin, FileText
} from 'lucide-react';

const CATEGORIES = [
  'Hardware & Raw Materials',
  'IT & Software Services',
  'Facilities & Operations',
  'Packaging & Materials',
  'Logistics & Transport'
];

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    category: 'Hardware & Raw Materials',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredVendorInfo, setRegisteredVendorInfo] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'warning');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.registerVendor(formData);
      showToast('Registration request submitted successfully!', 'success');
      setRegisteredVendorInfo({
        companyName: formData.companyName,
        email: formData.email,
        category: formData.category,
        vendorId: res.vendorId
      });
      setIsSuccess(true);
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden text-slate-900">

      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header Navigation */}
      <div className="relative z-10 p-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button
          id="register-back-btn"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-sm font-semibold transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          Already registered?
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
            Sign In Here
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10">
        <div className="w-full max-w-2xl">

          {/* Branding Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200 mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Procure<span className="text-emerald-600">Hub</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Vendor Onboarding & Registration Portal
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/60">

            {isSuccess ? (
              /* Success View - Request Pending Approval */
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-500 animate-pulse">
                  <Clock className="w-10 h-10" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Registration Submitted • Pending Manager Approval
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Application Received!</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                    Thank you for registering with ProcureHub. Your details have been submitted to our procurement team for verification.
                  </p>
                </div>

                {/* Submitted Vendor Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">Company Name:</span>
                    <span className="font-bold text-slate-900">{registeredVendorInfo?.companyName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">Work Email:</span>
                    <span className="font-bold text-slate-900">{registeredVendorInfo?.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">Supply Category:</span>
                    <span className="font-bold text-emerald-700">{registeredVendorInfo?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Account Status:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Pending Review
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs text-left flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">What happens next?</p>
                    <p className="mt-0.5 text-slate-600">
                      Once a manager approves your registration, you can log in with your email and password to access the portal, manage products, view purchase orders, and submit invoices.
                    </p>
                  </div>
                </div>

                <button
                  id="go-to-login-btn"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <span>Go to Login Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Registration Form View */
              <form onSubmit={handleSubmit} className="space-y-6">

                <div>
                  <h2 className="text-xl font-black text-slate-900">Create Vendor Account</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill out your business details to request vendor portal access.
                  </p>
                </div>

                {/* Grid for Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                  {/* Company Name */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Company / Organization Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-company-input"
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Apex Industrial Solutions Ltd"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Primary Category *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        id="reg-category-select"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none font-medium transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Contact Person Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-contact-input"
                        type="text"
                        name="contactPerson"
                        required
                        value={formData.contactPerson}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Work Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-email-input"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="vendor@company.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-phone-input"
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      GSTIN / Business Reg (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-gstin-input"
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        placeholder="e.g. 27AAACA12341Z5"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Business Address (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-address-input"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="City, State, Country"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-password-input"
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="reg-confirmpassword-input"
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                </div>

                {/* Notice banner */}
                <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Upon submitting, your registration request will be forwarded to Procurement Managers for verification before website access is granted.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  id="reg-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting Request...
                    </span>
                  ) : (
                    <>
                      <span>Submit Vendor Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            ProcureHub Enterprise Portal • Secure SSL Encrypted Registration
          </p>

        </div>
      </div>
    </div>
  );
};
