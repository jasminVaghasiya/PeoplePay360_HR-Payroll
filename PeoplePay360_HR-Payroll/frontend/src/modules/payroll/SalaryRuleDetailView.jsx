import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Save,
  CheckCircle2,
  Layers,
  Code2,
  Percent,
  DollarSign
} from 'lucide-react';

export const SalaryRuleDetailView = ({ rule, structureName = 'Regular Salary', onBack, isPayrollManager = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [ruleName, setRuleName] = useState(rule?.name || 'Basic Salary');
  const [code, setCode] = useState(rule?.code || 'BASIC');
  const [category, setCategory] = useState(rule?.category || 'Basic');
  const [sequence, setSequence] = useState(rule?.sequence || 1);
  const [structure, setStructure] = useState(structureName || 'Regular Salary');
  
  // Computation configuration
  const defaultComputation = rule?.computationType || (
    ['BASIC', 'HRA', 'PF'].includes(rule?.code) ? 'Percentage of Wage' :
    ['PT', 'LWF', 'STD'].includes(rule?.code) ? 'Fixed Amount' : 'Python Code'
  );
  const [computation, setComputation] = useState(defaultComputation);
  
  const defaultPercentage = rule?.code === 'BASIC' ? '50%' :
    rule?.code === 'HRA' ? '40%' :
    rule?.code === 'PF' ? '12%' : '0%';
  const [percentage, setPercentage] = useState(defaultPercentage);
  const [quantity, setQuantity] = useState(rule?.quantity || 1);

  // Active expression / formula helper
  const getRuleExpression = () => {
    if (rule?.code === 'BASIC') return "result = contract.wage * 0.50";
    if (rule?.code === 'HRA') return "result = categories['BASIC'] * 0.40";
    if (rule?.code === 'BONUS') return "result = contract.wage * 0.10";
    if (rule?.code === 'GROSS') return "result = categories['BASIC'] + categories['ALW']";
    if (rule?.code === 'PF') return "result = min(1800, categories['BASIC'] * 0.12)";
    if (rule?.code === 'NET') return "result = categories['GROSS'] - categories['DED']";
    return `result = categories['${code}']`;
  };

  const [expression, setExpression] = useState(getRuleExpression());
  const [toastMessage, setToastMessage] = useState('');

  const handleSave = () => {
    setIsEditing(false);
    setToastMessage('Salary Rule updated successfully.');
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #10B981',
          boxShadow: 'var(--shadow-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: '#F8FAFC',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="glass-panel" style={{ padding: '2.25rem 2.5rem', background: '#0F172A', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        
        {/* Header matching Screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={onBack}
                title="Back to Salary Structure"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Salary Rule / {ruleName}
              </h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.35rem', marginLeft: '2rem', marginBottom: 0 }}>
              Form view
            </p>
          </div>

          {isPayrollManager && (
            <div>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  style={{
                    background: '#38BDF8',
                    color: '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    padding: '0.55rem 1.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Save size={15} />
                  <span>SAVE</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    padding: '0.55rem 1.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Edit3 size={15} />
                  <span>EDIT</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2-Column Fields Grid matching Mockup */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          marginBottom: '2.5rem',
          maxWidth: '1000px'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Rule Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Rule Name</span>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Code</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#38BDF8',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Category</span>
              {isEditing ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    background: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="Basic">Basic</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Gross">Gross</option>
                  <option value="Deduction">Deduction</option>
                  <option value="Net">Net</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={category}
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              )}
            </div>

            {/* Sequence */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Sequence</span>
              <input
                type="number"
                value={sequence}
                onChange={(e) => setSequence(Number(e.target.value))}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#C084FC',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Salary Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Salary Structure</span>
              <input
                type="text"
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* Computation */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Computation</span>
              {isEditing ? (
                <select
                  value={computation}
                  onChange={(e) => setComputation(e.target.value)}
                  style={{
                    background: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="Fixed Amount">Fixed Amount</option>
                  <option value="Percentage of Wage">Percentage of Wage</option>
                  <option value="Python Code">Python Code</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={computation}
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              )}
            </div>

            {/* Percentage */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Percentage</span>
              <input
                type="text"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#34D399',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* Quantity */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Quantity</span>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={!isEditing}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.95rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Explanatory Note matching Mockup */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8', fontStyle: 'italic' }}>
            Useful note: a Salary Rule needs a clear computation method and category because these drive the lines displayed on the final payslip.
          </p>
        </div>

      </div>
    </div>
  );
};
