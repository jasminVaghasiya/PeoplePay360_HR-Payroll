import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Settings,
  Building,
  FileCheck,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Save,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export const PayrollSettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'address' | 'statutory'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    companyLegalName: 'PeoplePay360 Inc.',
    companyTradeName: 'PeoplePay360 HR & Payroll Solutions',
    gstNumber: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    tanNumber: 'MUMB12345C',
    cinNumber: 'U72900MH2023PTC398124',
    companyAddress: 'Level 8, Tech Park Avenue, Bandra-Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    country: 'India',
    contactEmail: 'payroll@peoplepay360.com',
    contactPhone: '+91 22 4987 6543',
    website: 'https://peoplepay360.com',
    disbursalBankName: 'HDFC Bank Ltd',
    disbursalAccountNumber: '50200088991122',
    disbursalIfscCode: 'HDFC0000240',
    defaultPfRate: 12,
    defaultPtAmount: 200,
    payslipPrefix: 'SLIP',
    workingDaysBasis: 'Calendar Days'
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setFeedback({ type: '', message: '' });
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/settings');
      if (res.data.success && res.data.settings) {
        setFormData((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Failed to load payroll settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.put('/payroll/settings', formData);
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Enterprise payroll & GST settings saved successfully!' });
        if (onSettingsUpdated) {
          onSettingsUpdated(res.data.settings);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update configuration. Please verify inputs.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem 2rem' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#A78BFA" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Payroll & Enterprise Configuration
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Configure GSTIN, Corporate PAN/TAN, statutory compliance rates, and disbursal banking parameters
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: feedback.type === 'success' ? '#34D399' : '#F87171',
            fontSize: '0.82rem'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
          gap: '0.35rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`nav-pill-item ${activeTab === 'company' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
          >
            <Building size={15} />
            <span>Company & Tax IDs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`nav-pill-item ${activeTab === 'address' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
          >
            <MapPin size={15} />
            <span>Address & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('statutory')}
            className={`nav-pill-item ${activeTab === 'statutory' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
          >
            <CreditCard size={15} />
            <span>Banking & Statutory Rates</span>
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading enterprise configurations...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            
            {/* ========================================================================= */}
            {/* TAB 1: COMPANY & TAX IDS (GSTIN, PAN, TAN, CIN) */}
            {/* ========================================================================= */}
            {activeTab === 'company' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Info size={18} color="#A78BFA" />
                  <span style={{ fontSize: '0.78rem', color: '#DDD6FE' }}>
                    These tax and corporate identifiers automatically appear on all generated employee salary slips and statutory vouchers.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Company Legal Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.companyLegalName}
                      onChange={(e) => handleChange('companyLegalName', e.target.value)}
                      placeholder="e.g. PeoplePay360 Inc."
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Brand / Trade Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.companyTradeName}
                      onChange={(e) => handleChange('companyTradeName', e.target.value)}
                      placeholder="e.g. PeoplePay360 HR & Payroll"
                    />
                  </div>
                </div>

                {/* GSTIN & Corporate PAN Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FBBF24' }}>
                        GSTIN / GST Number *
                      </label>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', fontWeight: 700 }}>
                        15-Digit GST
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.gstNumber}
                      onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      maxLength={15}
                      style={{ letterSpacing: '0.05em', fontWeight: 700 }}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      State code (2 digits) + PAN (10 chars) + Entity (1) + Z + Checksum (1)
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8' }}>
                        Company PAN Number *
                      </label>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 700 }}>
                        10-Digit PAN
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.panNumber}
                      onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. AABCU9603R"
                      maxLength={10}
                      style={{ letterSpacing: '0.05em', fontWeight: 700 }}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Corporate Permanent Account Number for IT & TDS returns
                    </span>
                  </div>
                </div>

                {/* TAN & CIN Identifiers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Tax Deduction Account Number (TAN)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tanNumber}
                      onChange={(e) => handleChange('tanNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. MUMB12345C"
                      maxLength={10}
                      style={{ letterSpacing: '0.04em' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Corporate Identity Number (CIN)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.cinNumber}
                      onChange={(e) => handleChange('cinNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. U72900MH2023PTC398124"
                      maxLength={21}
                      style={{ letterSpacing: '0.04em' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ADDRESS & CONTACT */}
            {/* ========================================================================= */}
            {activeTab === 'address' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                    Registered Business Address *
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formData.companyAddress}
                    onChange={(e) => handleChange('companyAddress', e.target.value)}
                    placeholder="e.g. Level 8, Tech Park Avenue, Bandra-Kurla Complex"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g. Mumbai"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      State / UT *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="e.g. Maharashtra"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      placeholder="e.g. 400051"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Country *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g. India"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Official Payroll Email *
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder="payroll@peoplepay360.com"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Support Phone Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder="+91 22 4987 6543"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Company Website
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://peoplepay360.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: STATUTORY RATES & DISBURSAL BANKING */}
            {/* ========================================================================= */}
            {activeTab === 'statutory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Corporate Disbursal Bank Details */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#A78BFA', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={16} />
                    Corporate Salary Disbursal Account
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                        Disbursal Bank Name
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.disbursalBankName}
                        onChange={(e) => handleChange('disbursalBankName', e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                        Corporate Account No
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.disbursalAccountNumber}
                        onChange={(e) => handleChange('disbursalAccountNumber', e.target.value)}
                        placeholder="e.g. 50200088991122"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                        Corporate IFSC Code
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.disbursalIfscCode}
                        onChange={(e) => handleChange('disbursalIfscCode', e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0000240"
                        maxLength={11}
                        style={{ letterSpacing: '0.04em' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory Default Rates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Default Provident Fund (PF) Employee Rate (%)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.defaultPfRate}
                        onChange={(e) => handleChange('defaultPfRate', parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 700 }}>%</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Statutory standard is 12% of Basic Remuneration
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Default Monthly Professional Tax (PT) (₹)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#F87171', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.defaultPtAmount}
                        onChange={(e) => handleChange('defaultPtAmount', parseFloat(e.target.value) || 0)}
                        min={0}
                        step={50}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Standard state deduction (e.g. ₹200 / month)
                    </span>
                  </div>
                </div>

                {/* Payslip Voucher Numbering & Calendar Mode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Payslip Number Prefix
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.payslipPrefix}
                      onChange={(e) => handleChange('payslipPrefix', e.target.value.toUpperCase())}
                      placeholder="e.g. SLIP"
                      maxLength={8}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Resulting format: <code>{formData.payslipPrefix || 'SLIP'}-2026-0001</code>
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      Working Days Computation Mode
                    </label>
                    <select
                      className="form-input"
                      value={formData.workingDaysBasis}
                      onChange={(e) => handleChange('workingDaysBasis', e.target.value)}
                    >
                      <option value="Calendar Days">Exact Calendar Days (28-31 days)</option>
                      <option value="Fixed 26 Days">Fixed 26 Standard Industrial Days</option>
                      <option value="Exclude Weekends">Exclude Weekends (Mon-Fri)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* LIVE PREVIEW BANNER */}
            {/* ========================================================================= */}
            <div style={{
              marginTop: '1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={13} />
                Live Payslip Header Preview
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{formData.companyLegalName || 'Company Name'}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {formData.companyAddress}, {formData.city} - {formData.pincode}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <span style={{ color: '#FBBF24', fontWeight: 700 }}>GSTIN:</span> <code style={{ color: '#fff' }}>{formData.gstNumber || 'N/A'}</code>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>PAN:</span> <code style={{ color: '#fff' }}>{formData.panNumber || 'N/A'}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={saving}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ padding: '0.55rem 1.4rem', fontSize: '0.85rem' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
