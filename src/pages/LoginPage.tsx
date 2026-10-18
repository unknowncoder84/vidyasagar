import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAuthScreenTheme } from '../lib/useAuthScreenTheme';
import { User, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// Reusable section block for the Terms of Service modal
const Section: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div>
    <h3 className="text-white font-semibold mb-1.5">{n}. {title}</h3>
    <div className="text-gray-400">{children}</div>
  </div>
);

const LoginPage: React.FC = () => {  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Always render the login screen in the fixed dark + orange theme,
  // regardless of any custom brand colour or light mode left by a prior session.
  useAuthScreenTheme();

  // Register state
  const [regStep, setRegStep] = useState(1);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [barCouncilNo, setBarCouncilNo] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegStep1 = () => {
    setRegError('');
    if (!firmName.trim()) { setRegError('Firm name is required.'); return; }
    if (!ownerName.trim()) { setRegError('Owner name is required.'); return; }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) { setRegError('Valid email is required.'); return; }
    if (ownerMobile.replace(/\D/g, '').length !== 10) { setRegError('Mobile number must be 10 digits.'); return; }
    if (!barCouncilNo.trim()) { setRegError('Bar Council number is required.'); return; }
    if (!city.trim()) { setRegError('City is required.'); return; }
    if (!state) { setRegError('Please select a state.'); return; }
    setRegStep(2);
  };

  const handleRegSubmit = async () => {
    setRegError('');
    if (!regUsername.trim()) { setRegError('Username is required.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    if (regPassword !== confirmPassword) { setRegError('Passwords do not match.'); return; }
    if (!agreedToTerms) { setRegError('You must agree to the Terms of Service.'); return; }

    setRegLoading(true);
    try {
      // Step 1: Create tenant record
      const { data: tenantData, error: tenantErr } = await supabase
        .from('tenants')
        .insert([{
          firm_name: firmName.trim(),
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim().toLowerCase(),
          owner_mobile: ownerMobile.trim(),
          bar_council_no: barCouncilNo.trim(),
          city: city.trim(),
          state,
          plan: 'trial',
          subscription_status: 'active',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_users: 3,
          max_cases: 200,
        }])
        .select()
        .single();

      if (tenantErr) {
        if (tenantErr.message.includes('tenants_owner_email_key')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw new Error(tenantErr.message);
      }
      const tenantId = tenantData.id;

      // Step 2: Create user_account (admin) for this tenant
      const { data: userData, error: userErr } = await supabase
        .from('user_accounts')
        .insert([{
          tenant_id: tenantId,
          username: regUsername.trim(),
          password_hash: regPassword,
          name: ownerName.trim(),
          email: ownerEmail.trim().toLowerCase(),
          role: 'admin',
          is_active: true,
        }])
        .select()
        .single();

      if (userErr) {
        // Cleanup tenant if user creation fails
        await supabase.from('tenants').delete().eq('id', tenantId);
        if (userErr.message.includes('user_accounts_tenant_id_username_key')) {
          throw new Error('Username already taken. Please choose another.');
        }
        throw new Error(userErr.message);
      }

      // Step 3: Create profile row
      await supabase.from('profiles').insert([{
        id: userData.id,
        tenant_id: tenantId,
        name: ownerName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        username: regUsername.trim(),
        role: 'admin',
        is_active: true,
      }]);

      // Step 4: Create tenant branding
      await supabase.from('tenant_branding').insert([{
        tenant_id: tenantId,
        firm_display_name: firmName.trim(),
        primary_color: '#52525b', // was '#f97316' (orange) — switched to grey
        white_label_active: false,
      }]);

      setRegSuccess(true);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const inputClass = 'w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/15 rounded-sm text-white placeholder-gray-500 focus:outline-none transition-colors text-base';
  const inputNoIconClass = 'w-full px-4 py-3.5 bg-white/[0.04] border border-white/15 rounded-sm text-white placeholder-gray-500 focus:outline-none transition-colors text-base';
  const btnClass = 'w-full bg-[#f4f4f5] text-[#09090b] font-semibold py-4 rounded-sm transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2';
  const accent = 'rgb(161 161 170)'; // was gold — now grey, matching the all-monochrome UI

  return (
    <div className="min-h-screen flex items-stretch relative overflow-hidden bg-[#0f0f10]">
      {/* Left — editorial panel, serif wordmark, numbered feature list.
          Replaces the previous stock-photo + glow-orb background entirely. */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/10 relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="relative z-10">
          <p className="text-[11px] uppercase tracking-[0.25em] font-mono-ui text-gray-500">Case Management, Reimagined</p>
          <h1 className="font-display text-6xl font-semibold tracking-tight text-white mt-4 leading-[1.05]">
            Vakil<span style={{ color: accent }}>Desk</span>
          </h1>
          <p className="text-gray-400 text-lg mt-5 max-w-sm leading-relaxed">
            A single place for every case, client, hearing and record — built for the way Indian law firms actually work.
          </p>
        </div>
        <div className="relative z-10 space-y-5">
          {[
            ['01', 'Track every case stage, from filing to disposal'],
            ['02', 'Never miss a hearing date or client deadline'],
            ['03', 'Keep your whole firm working from one record'],
          ].map(([n, text]) => (
            <div key={n} className="flex items-start gap-4 border-t border-white/10 pt-4">
              <span className="font-mono-ui text-xs mt-0.5" style={{ color: accent }}>{n}</span>
              <p className="text-gray-300 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — auth panel */}
      <div className="flex-1 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md">
        <div className="relative glass-dark p-8 md:p-10 rounded-sm border border-white/10">

            {/* Wordmark (mobile/shared) */}
            <div className="text-center mb-8 lg:hidden">
              <h1 className="font-display text-3xl font-semibold text-white">Vakil<span style={{ color: accent }}>Desk</span></h1>
              <p className="text-gray-400 text-sm mt-1">Legal Office Management System</p>
            </div>
            <p className="hidden lg:block text-[11px] uppercase tracking-[0.2em] font-mono-ui text-gray-500 mb-6">
              {activeTab === 'signin' ? 'Sign In to Continue' : 'Register Your Firm'}
            </p>

            {/* Tabs */}
            <div className="flex mb-7 border-b border-white/10">
              <button onClick={() => { setActiveTab('signin'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'signin' ? 'text-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                style={activeTab === 'signin' ? { borderColor: accent } : undefined}>
                Sign In
              </button>
              <button onClick={() => { setActiveTab('register'); setRegError(''); setRegStep(1); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'register' ? 'text-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                style={activeTab === 'register' ? { borderColor: accent } : undefined}>
                Register Firm
              </button>
            </div>

            {/* SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accent }} size={18} strokeWidth={1.75} />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Username" className={inputClass} required autoComplete="username" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accent }} size={18} strokeWidth={1.75} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" className={`${inputClass} pr-12`} required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-sm p-3">{error}</p>
                )}
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="text-sm">Signing in...</span></>
                    : <>Sign In <ArrowRight size={18} /></>}
                </button>
                <p className="text-center text-gray-500 text-xs mt-2">
                  Staff members: use the username your admin created for you
                </p>
              </form>
            )}

            {/* REGISTER */}
            {activeTab === 'register' && !regSuccess && (
              <div className="space-y-3">
                <p className="text-gray-400 text-xs text-center font-mono-ui uppercase tracking-wider">Step {regStep} of 2</p>
                <div className="flex gap-1 mb-2">
                  <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: regStep >= 1 ? accent : '#3f3f46' }} />
                  <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: regStep >= 2 ? accent : '#3f3f46' }} />
                </div>

                {regStep === 1 && (
                  <>
                    <input value={firmName} onChange={e => setFirmName(e.target.value)}
                      placeholder="Firm Name *" className={inputNoIconClass} />
                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      placeholder="Owner Full Name *" className={inputNoIconClass} />
                    <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                      placeholder="Owner Email *" className={inputNoIconClass} />
                    <input type="tel" value={ownerMobile} onChange={e => setOwnerMobile(e.target.value)}
                      placeholder="Mobile Number (10 digits) *" className={inputNoIconClass} />
                    <input value={barCouncilNo} onChange={e => setBarCouncilNo(e.target.value)}
                      placeholder="Bar Council Enrollment No. *" className={inputNoIconClass} />
                    <input value={city} onChange={e => setCity(e.target.value)}
                      placeholder="City *" className={inputNoIconClass} />
                    <select value={state} onChange={e => setState(e.target.value)} className={inputNoIconClass}>
                      <option value="">Select State *</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {regError && <p className="text-red-400 text-sm text-center">{regError}</p>}
                    <button onClick={handleRegStep1} className={btnClass}>
                      Continue <ArrowRight size={18} />
                    </button>
                  </>
                )}

                {regStep === 2 && (
                  <>
                    <div className="border rounded-sm p-3 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#d4d4d8' }}>
                      Creating account for: <strong>{ownerEmail}</strong>
                    </div>
                    <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                      placeholder="Choose a Username *" className={inputNoIconClass} autoComplete="off" />
                    <div className="relative">
                      <input type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                        placeholder="Create Password (min 6 chars) *" className={`${inputNoIconClass} pr-12`} />
                      <button type="button" onClick={() => setShowRegPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                        title={showRegPassword ? 'Hide password' : 'Show password'}>
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <input type={showRegPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password *" className={inputNoIconClass} />
                    <label className="flex items-start gap-2 text-gray-400 text-sm cursor-pointer">
                      <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 cursor-pointer flex-shrink-0" style={{ accentColor: accent }} />
                      <span className="text-xs">
                        I agree to the{' '}
                        <button type="button" onClick={() => setShowTerms(true)}
                          className="underline underline-offset-2 font-medium" style={{ color: accent }}>
                          Terms of Service
                        </button>
                        {' '}and confirm that all firm details provided are accurate.
                      </span>
                    </label>
                    {regError && <p className="text-red-400 text-sm text-center">{regError}</p>}
                    <button onClick={handleRegSubmit} disabled={regLoading} className={btnClass}>
                      {regLoading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : 'Create My Account'}
                    </button>
                    <button onClick={() => setRegStep(1)} className="w-full text-gray-400 text-sm hover:text-white transition-colors">
                      ← Back
                    </button>
                  </>
                )}
              </div>
            )}

            {/* SUCCESS */}
            {activeTab === 'register' && regSuccess && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={56} strokeWidth={1.5} className="text-green-400 mx-auto" />
                <h2 className="font-display text-2xl font-semibold text-white">Welcome to VakilDesk</h2>
                <p className="text-green-400 font-medium text-sm">Your 14-day free trial has started.</p>
                <p className="text-gray-400 text-sm">No credit card required. All features are unlocked during the trial.</p>
                <p className="text-white font-semibold text-lg font-display">{firmName}</p>
                <p className="text-gray-400 text-sm">Sign in with your username and password to get started.</p>
                <button onClick={() => { setActiveTab('signin'); setUsername(regUsername); }}
                  className={btnClass}>
                  Go to Sign In <ArrowRight size={18} />
                </button>
              </div>
            )}

          </div>
      </motion.div>
      </div>

      {/* TERMS OF SERVICE MODAL */}
      {showTerms && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTerms(false)}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#18181b] border border-white/10 rounded-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Terms of Service</h2>
                <p className="text-xs text-gray-400">VakilDesk — Legal Office Management System</p>
              </div>
              <button onClick={() => setShowTerms(false)} className="p-2 rounded-sm hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <ArrowRight size={18} className="rotate-180" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed">
              <p className="text-xs text-gray-500">Last updated: 14 June 2026</p>

              <p>
                These Terms of Service ("Terms") govern your access to and use of VakilDesk,
                a cloud-based legal office management software ("the Service"). By creating an
                account, ticking the consent box, or using the Service, you ("the Firm", "you")
                agree to these Terms. If you do not agree, do not use the Service.
              </p>

              <Section n="1" title="Eligibility & Account">
                <p>VakilDesk is intended for use by practising advocates, law firms, and their
                authorised staff in India. You confirm that the information you provide during
                registration — including firm name, owner name, email, mobile number, and Bar
                Council enrolment number — is true and accurate. You are responsible for keeping
                your login credentials confidential and for all activity that occurs under your
                account and the accounts of staff members you create.</p>
              </Section>

              <Section n="2" title="What the Service Does">
                <p>VakilDesk helps you manage cases, clients, counsel, hearings, tasks,
                attendance, expenses, documents, and a library/storage index. It can also send
                hearing-date reminder emails to your clients on your behalf when you connect and
                enable the email reminder feature. The Service is an administrative tool only.</p>
              </Section>

              <Section n="3" title="Not Legal Advice">
                <p>VakilDesk is software for organising your practice. It does not provide legal
                advice, does not interpret law, and is not a substitute for your professional
                judgement. You remain solely responsible for all legal work, court deadlines,
                filings, and advice given to your clients. Reminder dates, case stages, and any
                computed values are aids only — you must independently verify all dates and
                deadlines against official court records.</p>
              </Section>

              <Section n="4" title="Free Trial, Plans & Billing">
                <p>New firms receive a 14-day free trial with no payment required. After the
                trial, continued use requires an active paid subscription on one of the published
                plans. Add-on features (such as email or messaging reminders) may carry separate
                charges. Prices are shown in the Subscription section and may be revised with
                prior notice. When a subscription expires, your data is retained but the ability
                to add new records may be paused until you renew.</p>
              </Section>

              <Section n="5" title="Your Data & Ownership">
                <p>You own all data you enter into VakilDesk — your cases, clients, documents,
                and records. We act only as a processor that stores and displays this data so you
                can run your practice. We do not sell your data. You may export your data
                (e.g. CSV/Excel) at any time while your account is active. On account deletion,
                your data is removed from active systems.</p>
              </Section>

              <Section n="6" title="Confidentiality & Privilege">
                <p>You acknowledge that case data may include information subject to advocate-client
                privilege and confidentiality obligations under Indian law and the Bar Council of
                India rules. You are responsible for obtaining any client consents required before
                storing their information or sending them automated reminders. We apply reasonable
                technical measures to protect data, including tenant isolation so that each firm's
                data is kept separate, and we restrict access to sensitive credentials.</p>
              </Section>

              <Section n="7" title="Email Reminders & Third-Party Services">
                <p>The reminder feature sends emails from a Gmail account that you connect using a
                Google App Password. That password is stored to allow sending and is never shown
                back to you in the browser after saving. You are responsible for the accuracy of
                client email addresses and for compliance with applicable anti-spam and data
                protection norms. The Service relies on third-party infrastructure (including
                Supabase for the database and Google for email delivery); their availability is
                outside our direct control.</p>
              </Section>

              <Section n="8" title="Acceptable Use">
                <p>You agree not to use VakilDesk to store unlawful content, to send unsolicited
                bulk messages, to attempt to access another firm's data, to reverse-engineer or
                disrupt the Service, or to use it in any way that violates Indian law or the
                professional conduct rules applicable to advocates.</p>
              </Section>

              <Section n="9" title="Availability & Disclaimer">
                <p>We work to keep VakilDesk available and reliable, but the Service is provided
                "as is" and "as available" without warranties of any kind. We do not guarantee
                that the Service will be uninterrupted, error-free, or that reminders will always
                be delivered. You should maintain your own independent record of critical court
                dates.</p>
              </Section>

              <Section n="10" title="Limitation of Liability">
                <p>To the maximum extent permitted by law, VakilDesk and its operators shall not be
                liable for any missed hearing, deadline, filing, lost data, lost profits, or any
                indirect or consequential loss arising from your use of or inability to use the
                Service. Our total liability for any claim shall not exceed the subscription fees
                you paid to us in the three months preceding the claim.</p>
              </Section>

              <Section n="11" title="Suspension & Termination">
                <p>You may stop using the Service and request account deletion at any time. We may
                suspend or terminate access for non-payment, breach of these Terms, or misuse.
                We will give reasonable notice where practical.</p>
              </Section>

              <Section n="12" title="Changes to These Terms">
                <p>We may update these Terms from time to time. Material changes will be notified
                through the app or by email. Continued use after changes take effect constitutes
                acceptance of the revised Terms.</p>
              </Section>

              <Section n="13" title="Governing Law">
                <p>These Terms are governed by the laws of India. Any dispute shall be subject to
                the exclusive jurisdiction of the courts at the place of the service provider's
                registered location in India.</p>
              </Section>

              <Section n="14" title="Contact">
                <p>For questions about these Terms, billing, or your data, contact us at
                <span style={{ color: accent }}> +91 86938 52452</span> or
                <span style={{ color: accent }}> vakildeskmain@gmail.com</span>.</p>
              </Section>

              <p className="text-xs text-gray-500 pt-2 border-t border-white/10">
                By ticking "I agree to the Terms of Service" and creating an account, you confirm
                that you have read, understood, and accepted these Terms on behalf of your firm.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 shrink-0 flex gap-3">
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                className="flex-1 bg-[#f4f4f5] text-[#09090b] font-semibold py-3 rounded-sm text-sm hover:opacity-85 transition-opacity"
              >
                I Agree & Accept
              </button>
              <button
                onClick={() => setShowTerms(false)}
                className="px-5 py-3 rounded-sm border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LoginPage;
