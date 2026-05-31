'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal', icon: '👤', desc: 'Your details' },
  { id: 2, label: 'Shahada', icon: '☪️', desc: 'Declaration of faith' },
  { id: 3, label: 'Executor', icon: '⚖️', desc: 'Who manages your estate' },
  { id: 4, label: 'Debts', icon: '📋', desc: 'Obligations & funeral' },
  { id: 5, label: 'Assets', icon: '🏠', desc: 'What you own' },
  { id: 6, label: 'Charity', icon: '💚', desc: 'Up to ⅓ bequests' },
  { id: 7, label: 'Heirs', icon: '👪', desc: 'Your family' },
  { id: 8, label: 'Guardian', icon: '🛡️', desc: 'For minor children' },
  { id: 9, label: 'Review', icon: '📜', desc: 'Print & sign' },
];

const RELATIONSHIPS = [
  'Spouse (Wife)', 'Spouse (Husband)', 'Son', 'Daughter',
  'Father', 'Mother', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Other',
];

const ASSET_TYPES = [
  { id: 'property', label: 'Property/Real Estate', icon: '🏠' },
  { id: 'bank', label: 'Bank Accounts', icon: '🏦' },
  { id: 'investment', label: 'Investments/Stocks', icon: '📈' },
  { id: 'vehicle', label: 'Vehicles', icon: '🚗' },
  { id: 'business', label: 'Business Ownership', icon: '🏢' },
  { id: 'gold', label: 'Gold/Jewelry', icon: '💍' },
  { id: 'digital', label: 'Digital Assets', icon: '💻' },
  { id: 'insurance', label: 'Insurance/Pension', icon: '📄' },
  { id: 'other', label: 'Other Assets', icon: '📦' },
];

interface Heir {
  name: string;
  relationship: string;
  share: string;
  contact: string;
}

interface Asset {
  type: string;
  description: string;
  estimatedValue: string;
  location: string;
}

interface WillForm {
  // Personal
  fullName: string;
  address: string;
  city: string;
  country: string;
  idNumber: string;
  dateOfBirth: string;
  nationality: string;
  // Shahada
  customShahada: string;
  // Executor
  executor: string;
  executorAddress: string;
  executorPhone: string;
  executorRelation: string;
  alternateExecutor: string;
  alternateExecutorPhone: string;
  // Debts
  debts: string;
  unpaidZakat: string;
  unpaidHajj: string;
  funeralInstructions: string;
  burialLocation: string;
  // Assets
  assets: Asset[];
  totalEstimatedValue: string;
  // Charity
  charity: string;
  charityPercent: string;
  charityOrgs: string;
  // Heirs
  heirs: Heir[];
  // Guardian
  guardianName: string;
  guardianAddress: string;
  guardianPhone: string;
  alternateGuardian: string;
  childrenNames: string;
  // General
  additionalNotes: string;
  date: string;
  witness1Name: string;
  witness1Address: string;
  witness2Name: string;
  witness2Address: string;
}

const DEFAULT_FORM: WillForm = {
  fullName: '', address: '', city: '', country: '', idNumber: '', dateOfBirth: '', nationality: '',
  customShahada: '',
  executor: '', executorAddress: '', executorPhone: '', executorRelation: '', alternateExecutor: '', alternateExecutorPhone: '',
  debts: '', unpaidZakat: '', unpaidHajj: '', funeralInstructions: '', burialLocation: '',
  assets: [{ type: 'property', description: '', estimatedValue: '', location: '' }],
  totalEstimatedValue: '',
  charity: '', charityPercent: '', charityOrgs: '',
  heirs: [{ name: '', relationship: '', share: '', contact: '' }],
  guardianName: '', guardianAddress: '', guardianPhone: '', alternateGuardian: '', childrenNames: '',
  additionalNotes: '',
  date: new Date().toISOString().split('T')[0],
  witness1Name: '', witness1Address: '', witness2Name: '', witness2Address: '',
};

const LS_KEY = 'islamic_will_draft_v2';

export default function IslamicWill() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WillForm>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  // Load saved draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm({ ...DEFAULT_FORM, ...parsed });
      }
    } catch {}
  }, []);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(form));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHeirChange = (index: number, field: string, value: string) => {
    const updated = [...form.heirs];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, heirs: updated });
  };

  const addHeir = () => setForm({ ...form, heirs: [...form.heirs, { name: '', relationship: '', share: '', contact: '' }] });
  const removeHeir = (index: number) => setForm({ ...form, heirs: form.heirs.filter((_, i) => i !== index) });

  const handleAssetChange = (index: number, field: string, value: string) => {
    const updated = [...form.assets];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, assets: updated });
  };

  const addAsset = () => setForm({ ...form, assets: [...form.assets, { type: 'other', description: '', estimatedValue: '', location: '' }] });
  const removeAsset = (index: number) => setForm({ ...form, assets: form.assets.filter((_, i) => i !== index) });

  const resetForm = () => { setForm(DEFAULT_FORM); localStorage.removeItem(LS_KEY); setStep(1); };
  const nextStep = () => setStep(prev => Math.min(prev + 1, 9));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const completionPercent = Math.round(
    ([form.fullName, form.executor, form.heirs[0]?.name, form.date].filter(Boolean).length / 4) * 100
  );

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-transparent transition-all';
  const labelClass = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide';
  const cardClass = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6';

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-900 via-emerald-900 to-stone-900 text-white py-4 px-5 shadow-xl sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white flex items-center gap-1 text-sm transition-colors">← Home</Link>
          <div className="text-center">
            <h1 className="text-lg font-bold flex items-center gap-2">📜 Islamic Will (Wasiyyah)</h1>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-300 animate-pulse">✓ Saved</span>}
            <button onClick={resetForm} className="text-xs text-white/40 hover:text-red-300 transition-colors" title="Reset form">🗑️</button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-5 pt-4">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Step {step} of 9</span>
          <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto">{completionPercent}% complete</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${(step / 9) * 100}%` }} />
        </div>
      </div>

      {/* Step pills (scrollable on mobile) */}
      <div className="max-w-4xl mx-auto px-5 pt-4 pb-2">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((s) => (
            <button key={s.id} onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                step === s.id ? 'bg-emerald-800 text-white shadow-md scale-105' : step > s.id ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 pb-12">
        <div className={`${cardClass} mb-6`}>

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">👤 Personal Details</h2>
                <p className="text-sm text-gray-400">Your legal identity for the will document.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Legal Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} placeholder="As it appears on your ID" />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nationality</label>
                  <input name="nationality" value={form.nationality} onChange={handleChange} className={inputClass} placeholder="e.g., British, Pakistani" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street address" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="City" />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input name="country" value={form.country} onChange={handleChange} className={inputClass} placeholder="Country" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>ID / Passport Number</label>
                  <input name="idNumber" value={form.idNumber} onChange={handleChange} className={inputClass} placeholder="For identification purposes" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Shahada */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">☪️ Declaration of Faith (Shahada)</h2>
                <p className="text-sm text-gray-400">Every Islamic will begins with the testimony of faith.</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-3" style={{ fontFamily: "'Amiri', serif" }}>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 italic mb-4">In the name of Allah, the Most Gracious, the Most Merciful</p>
                <div className="border-t border-emerald-200 dark:border-emerald-700 pt-4 mt-4">
                  <p className="text-2xl mb-2" style={{ fontFamily: "'Amiri', serif" }}>أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰهِ</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">I bear witness that there is no god but Allah, and I bear witness that Muhammad ﷺ is the Messenger of Allah.</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Additional Declaration (optional)</label>
                <textarea name="customShahada" value={form.customShahada} onChange={handleChange} className={inputClass + ' min-h-[80px]'} placeholder="Any additional words you wish to include in your opening declaration..." />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong>Islamic Guidance:</strong> The Prophet ﷺ said: "It is not permissible for any Muslim who has something to will to stay for two nights without having his last will and testament written and kept ready with him." (Bukhari & Muslim)
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Executor */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">⚖️ Executor (Wasi)</h2>
                <p className="text-sm text-gray-400">The person responsible for carrying out your will. Choose someone trustworthy and capable.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Executor Full Name *</label>
                  <input name="executor" value={form.executor} onChange={handleChange} className={inputClass} placeholder="Person who will manage your estate" />
                </div>
                <div>
                  <label className={labelClass}>Relationship to You</label>
                  <input name="executorRelation" value={form.executorRelation} onChange={handleChange} className={inputClass} placeholder="e.g., Brother, Friend, Lawyer" />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input name="executorPhone" value={form.executorPhone} onChange={handleChange} className={inputClass} placeholder="Contact number" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Executor Address</label>
                  <input name="executorAddress" value={form.executorAddress} onChange={handleChange} className={inputClass} placeholder="Full address" />
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Alternate Executor (if primary cannot serve)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Alternate Name</label>
                    <input name="alternateExecutor" value={form.alternateExecutor} onChange={handleChange} className={inputClass} placeholder="Backup executor" />
                  </div>
                  <div>
                    <label className={labelClass}>Alternate Phone</label>
                    <input name="alternateExecutorPhone" value={form.alternateExecutorPhone} onChange={handleChange} className={inputClass} placeholder="Contact number" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Debts & Funeral */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">📋 Debts & Funeral Wishes</h2>
                <p className="text-sm text-gray-400">In Islam, debts must be settled before any inheritance distribution.</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-2">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Priority Order:</strong> 1) Funeral expenses → 2) Debts → 3) Bequests (up to ⅓) → 4) Inheritance to heirs
                </p>
              </div>
              <div>
                <label className={labelClass}>Outstanding Debts & Liabilities</label>
                <textarea name="debts" value={form.debts} onChange={handleChange} className={inputClass + ' min-h-[100px]'} placeholder="List all debts: mortgage, loans, credit cards, money owed to individuals..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Unpaid Zakat (if any)</label>
                  <input name="unpaidZakat" value={form.unpaidZakat} onChange={handleChange} className={inputClass} placeholder="Amount of unpaid Zakat" />
                </div>
                <div>
                  <label className={labelClass}>Unfulfilled Hajj Obligation</label>
                  <input name="unpaidHajj" value={form.unpaidHajj} onChange={handleChange} className={inputClass} placeholder="If Hajj was obligatory but not performed" />
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">🕌 Islamic Burial Wishes</p>
                <div>
                  <label className={labelClass}>Funeral Instructions</label>
                  <textarea name="funeralInstructions" value={form.funeralInstructions} onChange={handleChange} className={inputClass + ' min-h-[80px]'} placeholder="e.g., Ghusl according to Sunnah, shrouded in white kafan, no embalming, burial as soon as possible..." />
                </div>
                <div className="mt-3">
                  <label className={labelClass}>Preferred Burial Location</label>
                  <input name="burialLocation" value={form.burialLocation} onChange={handleChange} className={inputClass} placeholder="e.g., Muslim section of local cemetery, home country..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Assets */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">🏠 Assets Inventory</h2>
                <p className="text-sm text-gray-400">List your assets so your executor knows what to distribute.</p>
              </div>
              {form.assets.map((asset, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 relative">
                  {form.assets.length > 1 && (
                    <button onClick={() => removeAsset(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                  <div>
                    <label className={labelClass}>Asset Type</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ASSET_TYPES.map(t => (
                        <button key={t.id} onClick={() => handleAssetChange(idx, 'type', t.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${asset.type === t.id ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Description</label>
                      <input value={asset.description} onChange={e => handleAssetChange(idx, 'description', e.target.value)} className={inputClass} placeholder="e.g., Family home at 123 Main St" />
                    </div>
                    <div>
                      <label className={labelClass}>Est. Value</label>
                      <input value={asset.estimatedValue} onChange={e => handleAssetChange(idx, 'estimatedValue', e.target.value)} className={inputClass} placeholder="e.g., $250,000" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Location / Account Details</label>
                    <input value={asset.location} onChange={e => handleAssetChange(idx, 'location', e.target.value)} className={inputClass} placeholder="Where is this asset held?" />
                  </div>
                </div>
              ))}
              <button onClick={addAsset} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs">+</span> Add Another Asset
              </button>
              <div>
                <label className={labelClass}>Total Estimated Estate Value</label>
                <input name="totalEstimatedValue" value={form.totalEstimatedValue} onChange={handleChange} className={inputClass} placeholder="Approximate total value of all assets" />
              </div>
            </div>
          )}

          {/* STEP 6: Charity */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">💚 Charitable Bequests (Wasiyyah)</h2>
                <p className="text-sm text-gray-400">You may bequeath up to one-third (⅓) of your estate to non-heirs or charity.</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  <strong>Islamic Rule:</strong> The Prophet ﷺ told Sa'd ibn Abi Waqqas: "One-third, and one-third is a lot. It is better to leave your heirs rich than to leave them poor, begging from people." (Bukhari & Muslim)
                </p>
              </div>
              <div>
                <label className={labelClass}>Percentage of Estate for Charity</label>
                <input name="charityPercent" value={form.charityPercent} onChange={handleChange} className={inputClass} placeholder="e.g., 20 (max 33.33)" />
                {Number(form.charityPercent) > 33.33 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Cannot exceed one-third (33.33%) of your estate</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Charity Details</label>
                <textarea name="charity" value={form.charity} onChange={handleChange} className={inputClass + ' min-h-[120px]'} placeholder="Describe how you want your charitable bequest distributed. e.g.:\n- 10% to build a water well in Africa\n- 5% to local Islamic school\n- 5% to orphan sponsorship" />
              </div>
              <div>
                <label className={labelClass}>Specific Organizations (optional)</label>
                <textarea name="charityOrgs" value={form.charityOrgs} onChange={handleChange} className={inputClass + ' min-h-[60px]'} placeholder="Name specific charities or organizations, with addresses if possible" />
              </div>
            </div>
          )}

          {/* STEP 7: Heirs */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">👪 Heirs</h2>
                <p className="text-sm text-gray-400">List your living heirs. Their shares are determined by Islamic inheritance law (Fara'id), not by your will.</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Note:</strong> In Islam, you cannot change the shares of your heirs through your will. The Quran specifies exact shares. Use our <Link href="/inheritance" className="underline font-medium">Inheritance Calculator</Link> to see the breakdown.
                </p>
              </div>
              {form.heirs.map((heir, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 relative">
                  {form.heirs.length > 1 && (
                    <button onClick={() => removeHeir(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input value={heir.name} onChange={e => handleHeirChange(idx, 'name', e.target.value)} className={inputClass} placeholder="Heir's full name" />
                    </div>
                    <div>
                      <label className={labelClass}>Relationship</label>
                      <select value={heir.relationship} onChange={e => handleHeirChange(idx, 'relationship', e.target.value)} className={inputClass}>
                        <option value="">Select...</option>
                        {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Contact Info</label>
                      <input value={heir.contact} onChange={e => handleHeirChange(idx, 'contact', e.target.value)} className={inputClass} placeholder="Phone or email" />
                    </div>
                    <div>
                      <label className={labelClass}>Islamic Share (reference)</label>
                      <input value={heir.share} onChange={e => handleHeirChange(idx, 'share', e.target.value)} className={inputClass} placeholder="e.g., 1/8, 1/6, residuary" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addHeir} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs">+</span> Add Heir
              </button>
            </div>
          )}

          {/* STEP 8: Guardian */}
          {step === 8 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">🛡️ Guardian for Minor Children</h2>
                <p className="text-sm text-gray-400">If you have children under 18, appoint a guardian to care for them.</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  <strong>Important:</strong> Choose someone who will raise your children upon Islamic values. Discuss this with them beforehand.
                </p>
              </div>
              <div>
                <label className={labelClass}>Names of Minor Children</label>
                <textarea name="childrenNames" value={form.childrenNames} onChange={handleChange} className={inputClass + ' min-h-[60px]'} placeholder="List names and ages of children under 18" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Guardian Name</label>
                  <input name="guardianName" value={form.guardianName} onChange={handleChange} className={inputClass} placeholder="Person who will care for your children" />
                </div>
                <div>
                  <label className={labelClass}>Guardian Phone</label>
                  <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} className={inputClass} placeholder="Contact number" />
                </div>
                <div>
                  <label className={labelClass}>Guardian Address</label>
                  <input name="guardianAddress" value={form.guardianAddress} onChange={handleChange} className={inputClass} placeholder="Full address" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Alternate Guardian</label>
                  <input name="alternateGuardian" value={form.alternateGuardian} onChange={handleChange} className={inputClass} placeholder="If primary guardian cannot serve" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Additional Notes</label>
                <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} className={inputClass + ' min-h-[80px]'} placeholder="Any other wishes, instructions, or messages to your family..." />
              </div>
            </div>
          )}

          {/* STEP 9: Review & Print */}
          {step === 9 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">📜 Review & Print Your Will</h2>
                <p className="text-sm text-gray-400">Review the document below, then print or save as PDF.</p>
              </div>

              {/* Witnesses */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Witnesses (2 required for validity)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Witness 1 Name</label>
                    <input name="witness1Name" value={form.witness1Name} onChange={handleChange} className={inputClass} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelClass}>Witness 1 Address</label>
                    <input name="witness1Address" value={form.witness1Address} onChange={handleChange} className={inputClass} placeholder="Address" />
                  </div>
                  <div>
                    <label className={labelClass}>Witness 2 Name</label>
                    <input name="witness2Name" value={form.witness2Name} onChange={handleChange} className={inputClass} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelClass}>Witness 2 Address</label>
                    <input name="witness2Address" value={form.witness2Address} onChange={handleChange} className={inputClass} placeholder="Address" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Date of Will</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} />
              </div>

              {/* Preview */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-2xl p-6 sm:p-8 bg-white dark:bg-gray-800 overflow-auto max-h-[600px] shadow-inner">
                <div id="will-preview" className="prose prose-stone dark:prose-invert max-w-none text-[14px] leading-relaxed">
                  <div className="text-center mb-8">
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400" style={{ fontFamily: "'Amiri', serif" }}>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                    <p className="text-xs text-gray-400 mt-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
                    <p className="font-bold mt-6 text-xl text-gray-800 dark:text-gray-100">LAST WILL AND TESTAMENT (WASIYYAH)</p>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300">I, <strong>{form.fullName || '[Full Name]'}</strong>{form.address ? `, residing at ${form.address}${form.city ? `, ${form.city}` : ''}${form.country ? `, ${form.country}` : ''}` : ''}{form.idNumber ? `, identification number ${form.idNumber}` : ''}, being of sound mind and body, hereby declare this to be my last will and testament, prepared in accordance with Islamic Shariah.</p>

                  <p className="mt-4 text-gray-700 dark:text-gray-300">I bear witness that there is no god but Allah (La ilaha illallah), and I bear witness that Muhammad ﷺ is His final Messenger (Muhammadur Rasulullah).</p>
                  {form.customShahada && <p className="mt-2 text-gray-700 dark:text-gray-300">{form.customShahada}</p>}

                  <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">1. Executor (Wasi)</h3>
                  <p className="text-gray-700 dark:text-gray-300">I appoint <strong>{form.executor || '[Executor Name]'}</strong>{form.executorRelation ? ` (${form.executorRelation})` : ''}{form.executorAddress ? `, of ${form.executorAddress}` : ''}{form.executorPhone ? `, contact: ${form.executorPhone}` : ''} as the executor of my estate.</p>
                  {form.alternateExecutor && <p className="text-gray-700 dark:text-gray-300">If they are unable to serve, I appoint <strong>{form.alternateExecutor}</strong>{form.alternateExecutorPhone ? ` (${form.alternateExecutorPhone})` : ''} as alternate executor.</p>}

                  <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">2. Debts & Obligations</h3>
                  <p className="text-gray-700 dark:text-gray-300">I direct that all my lawful debts and funeral expenses be paid from my estate before any distribution.</p>
                  {form.debts && <p className="text-gray-700 dark:text-gray-300"><strong>Debts:</strong> {form.debts}</p>}
                  {form.unpaidZakat && <p className="text-gray-700 dark:text-gray-300"><strong>Unpaid Zakat:</strong> {form.unpaidZakat}</p>}
                  {form.unpaidHajj && <p className="text-gray-700 dark:text-gray-300"><strong>Hajj Obligation:</strong> {form.unpaidHajj}</p>}

                  {(form.funeralInstructions || form.burialLocation) && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">3. Funeral & Burial</h3>
                      {form.funeralInstructions && <p className="text-gray-700 dark:text-gray-300">{form.funeralInstructions}</p>}
                      {form.burialLocation && <p className="text-gray-700 dark:text-gray-300"><strong>Preferred burial:</strong> {form.burialLocation}</p>}
                    </>
                  )}

                  {form.assets.filter(a => a.description).length > 0 && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">4. Assets</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        {form.assets.filter(a => a.description).map((a, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300">{ASSET_TYPES.find(t => t.id === a.type)?.icon} {a.description}{a.estimatedValue ? ` (est. ${a.estimatedValue})` : ''}{a.location ? ` — ${a.location}` : ''}</li>
                        ))}
                      </ul>
                      {form.totalEstimatedValue && <p className="text-gray-700 dark:text-gray-300 mt-2"><strong>Total estimated value:</strong> {form.totalEstimatedValue}</p>}
                    </>
                  )}

                  {form.charity && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">5. Charitable Bequests</h3>
                      <p className="text-gray-700 dark:text-gray-300">I bequeath {form.charityPercent ? `${form.charityPercent}% of my net estate` : 'the following'} for charity (Sadaqah Jariyah):</p>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{form.charity}</p>
                      {form.charityOrgs && <p className="text-gray-700 dark:text-gray-300 mt-2"><strong>Organizations:</strong> {form.charityOrgs}</p>}
                    </>
                  )}

                  {form.heirs.filter(h => h.name).length > 0 && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">6. Heirs</h3>
                      <p className="text-gray-700 dark:text-gray-300">My living heirs are:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        {form.heirs.filter(h => h.name).map((h, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300"><strong>{h.name}</strong> — {h.relationship || 'Relationship not specified'}{h.share ? ` (share: ${h.share})` : ''}{h.contact ? ` [${h.contact}]` : ''}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className="mt-6 text-gray-700 dark:text-gray-300">The remainder of my estate (after debts, funeral expenses, and the above bequests) shall be distributed among my heirs according to the Islamic laws of inheritance (Fara'id) as prescribed in the Holy Quran.</p>

                  {(form.guardianName || form.childrenNames) && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">7. Guardianship of Minor Children</h3>
                      {form.childrenNames && <p className="text-gray-700 dark:text-gray-300"><strong>Children:</strong> {form.childrenNames}</p>}
                      {form.guardianName && <p className="text-gray-700 dark:text-gray-300">I appoint <strong>{form.guardianName}</strong>{form.guardianPhone ? ` (${form.guardianPhone})` : ''}{form.guardianAddress ? `, of ${form.guardianAddress}` : ''} as guardian.</p>}
                      {form.alternateGuardian && <p className="text-gray-700 dark:text-gray-300">Alternate guardian: <strong>{form.alternateGuardian}</strong></p>}
                    </>
                  )}

                  {form.additionalNotes && (
                    <>
                      <h3 className="mt-6 font-bold text-gray-800 dark:text-gray-100">8. Additional Notes</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{form.additionalNotes}</p>
                    </>
                  )}

                  <div className="mt-12 pt-8 border-t border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300">Signed: ________________________________________</p>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">Name: {form.fullName || '________________________________________'}</p>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">Date: {form.date || '________________________________________'}</p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Witness 1:</p>
                        <p className="text-gray-700 dark:text-gray-300">Name: {form.witness1Name || '________________________'}</p>
                        <p className="text-gray-700 dark:text-gray-300">Address: {form.witness1Address || '________________________'}</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">Signature: ________________________</p>
                      </div>
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Witness 2:</p>
                        <p className="text-gray-700 dark:text-gray-300">Name: {form.witness2Name || '________________________'}</p>
                        <p className="text-gray-700 dark:text-gray-300">Address: {form.witness2Address || '________________________'}</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">Signature: ________________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={handlePrint} className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                  🖨️ Print / Save as PDF
                </button>
                <button onClick={() => setStep(1)} className="px-6 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-all">
                  ✏️ Edit
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
            {step > 1 ? (
              <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-all">
                ← Previous
              </button>
            ) : <div />}
            {step < 9 && (
              <button onClick={nextStep} className="px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-700 text-sm transition-all shadow-md active:scale-[0.98]">
                Next Step →
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>⚠️ Important Disclaimer:</strong> This tool generates a template for educational purposes. It is <u>not</u> a substitute for professional legal or Shariah advice. For a legally binding Islamic will, please consult a qualified Islamic scholar and a lawyer familiar with your country&apos;s inheritance laws. Laws vary significantly by jurisdiction.
          </p>
        </div>

        {/* Quick tips */}
        <div className="mt-4 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-sm">💡 Quick Tips</h3>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <li>• Your will is <strong>auto-saved</strong> in your browser as you type</li>
            <li>• You cannot bequeath more than ⅓ of your estate to non-heirs</li>
            <li>• You cannot change the Quranic shares of your heirs through a will</li>
            <li>• Two adult Muslim witnesses are required for validity</li>
            <li>• Update your will whenever your circumstances change (marriage, children, assets)</li>
            <li>• Keep a printed copy with your executor and in a safe place</li>
          </ul>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #will-preview, #will-preview * { visibility: visible; }
          #will-preview { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
