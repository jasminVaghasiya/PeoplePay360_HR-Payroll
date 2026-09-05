import React, { useRef } from 'react';
import {
  X,
  Printer,
  Mail,
  Building,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

// Number to Words converter helper for net salary voucher
const numberToWords = (num) => {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let remainder = n;

  let res = '';
  if (crore > 0) res += convertGroup(crore) + 'Crore ';
  if (lakh > 0) res += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) res += convertGroup(thousand) + 'Thousand ';
  if (remainder > 0) res += convertGroup(remainder);

  return (res.trim() || 'Zero') + ' Rupees Only';
};

export const PayslipDetailModal = ({ isOpen, onClose, payslip, settings }) => {
  const printRef = useRef(null);

  if (!isOpen || !payslip) return null;

  const earningsLines = (payslip.lines || []).filter((l) => ['Basic', 'Allowance'].includes(l.category));
  const deductionLines = (payslip.lines || []).filter((l) => l.category === 'Deduction');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip_${payslip.employeeName.replace(/\\s+/g, '_')}_${payslip.payslipNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 20px;
              font-size: 13px;
              line-height: 1.4;
            }
            .voucher-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .company-name {
              font-size: 22px;
              font-weight: 800;
              color: #1e1b4b;
              margin: 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 16px;
              font-size: 12px;
            }
            .tables-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 16px;
            }
            .table-box {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
            }
            .table-title {
              background: #f1f5f9;
              padding: 8px 12px;
              font-weight: 700;
              font-size: 13px;
              border-bottom: 1px solid #cbd5e1;
            }
            .line-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 12px;
              font-size: 12px;
              border-bottom: 1px solid #f1f5f9;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              font-weight: 700;
              background: #f8fafc;
              border-top: 1px solid #cbd5e1;
            }
            .net-box {
              background: #ecfdf5;
              border: 1px solid #10b981;
              border-radius: 6px;
              padding: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .net-amount {
              font-size: 24px;
              font-weight: 800;
              color: #047857;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              border-top: 1px dashed #cbd5e1;
              padding-top: 16px;
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header-flex">
              <div>
                <h1 class="company-name">${companyName}</h1>
                <div style="color: #64748b; margin-top: 4px; font-size: 12px;">${companyAddress}</div>
                <div style="margin-top: 6px; font-size: 11px; color: #475569;">
                  <strong>GSTIN:</strong> ${gstNumber} &nbsp;|&nbsp; <strong>PAN:</strong> ${panNumber}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 16px; font-weight: 700; color: #7c3aed;">SALARY PAYSLIP</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                  Period: <strong>${new Date(payslip.periodStart).toLocaleDateString()} to ${new Date(payslip.periodEnd).toLocaleDateString()}</strong>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  Voucher No: <strong>${payslip.payslipNumber}</strong>
                </div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div style="color: #64748b;">Employee Name:</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${payslip.employeeName}</div>
                <div style="color: #64748b; margin-top: 6px;">Email:</div>
                <div style="color: #0f172a;">${payslip.employeeEmail}</div>
              </div>
              <div>
                <div style="color: #64748b;">Department & Role:</div>
                <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">${payslip.department}</div>
                <div style="color: #64748b; font-size: 11px;">${payslip.jobPosition}</div>
                <div style="color: #64748b; margin-top: 6px;">Contract Ref:</div>
                <div style="color: #7c3aed;">${payslip.contractName}</div>
              </div>
              <div>
                <div style="color: #64748b;">Bank & Account:</div>
                <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">
                  ${payslip.bankAccountNumber ? `${payslip.bankName} (${payslip.bankAccountNumber})` : 'Direct Bank Deposit'}
                </div>
                <div style="color: #64748b; margin-top: 6px;">Worked Days:</div>
                <div style="font-weight: 700; color: #047857;">${payslip.workedDays} Days / ${payslip.totalWorkingDays} Days</div>
              </div>
            </div>

            <div class="tables-grid">
              <div class="table-box">
                <div class="table-title" style="color: #6d28d9;">Earnings (A)</div>
                ${earningsLines.map((l) => `
                  <div class="line-row">
                    <span>${l.ruleName}</span>
                    <strong>₹${l.amount.toLocaleString()}</strong>
                  </div>
                `).join('')}
                <div class="total-row" style="color: #6d28d9;">
                  <span>Total Gross Earnings:</span>
                  <span>₹${payslip.gross.toLocaleString()}</span>
                </div>
              </div>

              <div class="table-box">
                <div class="table-title" style="color: #b91c1c;">Deductions (B)</div>
                ${deductionLines.length === 0 ? '<div style="padding: 12px; color: #64748b; text-align: center;">No deductions</div>' : deductionLines.map((l) => `
                  <div class="line-row">
                    <span>${l.ruleName}</span>
                    <strong style="color: #b91c1c;">-₹${l.amount.toLocaleString()}</strong>
                  </div>
                `).join('')}
                <div class="total-row" style="color: #b91c1c;">
                  <span>Total Deductions:</span>
                  <span>-₹${payslip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="net-box">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Net Take-Home Pay (A - B)</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                  Amount in words: <strong>${numberToWords(payslip.net)}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <div class="net-amount">₹${payslip.net.toLocaleString()}</div>
                <div style="font-size: 11px; color: #047857;">Direct Bank Transfer</div>
              </div>
            </div>

            <div class="footer">
              <div>Authorized System Generated Voucher • Official Corporate Record</div>
              <div>Generated on: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const companyName = settings?.companyLegalName || 'PeoplePay360 Inc.';
  const companyAddress = settings?.companyAddress ? `${settings.companyAddress}, ${settings.city || ''} - ${settings.pincode || ''}` : 'Enterprise HR, Payroll & Statutory Benefits Operations';
  const gstNumber = settings?.gstNumber || '27AABCU9603R1ZM';
  const panNumber = settings?.panNumber || 'AABCU9603R';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '780px', padding: '1.75rem 2rem' }}>
        {/* Action Header (Hidden during browser print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#34D399" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Employee Payslip Voucher
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ref #{payslip.payslipNumber} • Status: <strong style={{ color: payslip.status === 'Paid' ? '#34D399' : '#FBBF24' }}>{payslip.status}</strong>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button onClick={handlePrint} className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Payslip Card Body */}
        <div ref={printRef} style={{ background: '#0b1020', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', color: '#F8FAFC' }}>
          {/* Company Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(139, 92, 246, 0.4)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={24} color="#7C3AED" />
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                  {companyName}
                </h1>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {companyAddress}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.72rem' }}>
                <span style={{ color: '#FBBF24', fontWeight: 600 }}>GSTIN: <code style={{ color: '#fff', fontWeight: 700 }}>{gstNumber}</code></span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: '#38BDF8', fontWeight: 600 }}>PAN: <code style={{ color: '#fff', fontWeight: 700 }}>{panNumber}</code></span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C084FC' }}>
                SALARY PAYSLIP
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                Period: <strong>{new Date(payslip.periodStart).toLocaleDateString()} to {new Date(payslip.periodEnd).toLocaleDateString()}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Voucher No: <code style={{ color: '#fff' }}>{payslip.payslipNumber}</code>
              </div>
            </div>
          </div>

          {/* Employee & Payroll Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            marginBottom: '1.2rem',
            fontSize: '0.78rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Employee Name:</span>
              <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>{payslip.employeeName}</div>
              <span style={{ color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>Email Address:</span>
              <div style={{ color: '#E2E8F0' }}>{payslip.employeeEmail}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)' }}>Department & Designation:</span>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.1rem' }}>{payslip.department}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{payslip.jobPosition}</div>
              <span style={{ color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>Contract Reference:</span>
              <div style={{ color: '#A78BFA' }}>{payslip.contractName}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)' }}>Bank Account / IFSC:</span>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.1rem' }}>
                {payslip.bankAccountNumber ? `${payslip.bankName} (${payslip.bankAccountNumber})` : 'Direct Deposit / Unassigned'}
              </div>
              <span style={{ color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>Worked Days / Total:</span>
              <div style={{ fontWeight: 700, color: '#34D399' }}>
                {payslip.workedDays} Days / {payslip.totalWorkingDays} Standard Days
              </div>
            </div>
          </div>

          {/* 2-Column Earnings & Deductions Breakdown Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            {/* Column 1: Earnings */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.15)', padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '0.8rem', color: '#C084FC', borderBottom: '1px solid var(--border-color)' }}>
                Earnings Breakdown
              </div>
              <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                {earningsLines.map((line, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{line.ruleName}</span>
                    <strong style={{ color: '#fff' }}>₹{line.amount.toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: '#C084FC' }}>Total Gross Earnings (A):</span>
                  <span style={{ color: '#C084FC', fontSize: '0.88rem' }}>₹{payslip.gross.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Deductions */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '0.8rem', color: '#F87171', borderBottom: '1px solid var(--border-color)' }}>
                Statutory & Tax Deductions
              </div>
              <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                {deductionLines.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem' }}>No deductions applied</div>
                ) : (
                  deductionLines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{line.ruleName}</span>
                      <strong style={{ color: '#F87171' }}>-₹{line.amount.toLocaleString()}</strong>
                    </div>
                  ))
                )}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: '#F87171' }}>Total Deductions (B):</span>
                  <span style={{ color: '#F87171', fontSize: '0.88rem' }}>-₹{payslip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Highlight Net Pay Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#A7F3D0', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Net Take-Home Pay (A - B)
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Amount in words: <strong style={{ color: '#fff' }}>{numberToWords(payslip.net)}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ₹{payslip.net.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Direct Bank Transfer</span>
            </div>
          </div>

          {/* Footer Sign-off */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <div>
              Authorized System Generated Document • No signature required
            </div>
            <div>
              Generated on: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
