'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* ── Step definitions ── */
const STEPS = [
  { id: 1, label: 'Your Details', icon: '👤' },
  { id: 2, label: 'Executor & Debts', icon: '⚖️' },
  { id: 3, label: 'Charity (Up to ⅓)', icon: '💚' },
  { id: 4, label: 'Heirs', icon: '👪' },
  { id: 5, label: 'Review & Print', icon: '📜' },
];

export default function IslamicWill() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    address: '',
    idNumber: '',
    executor: '',
    executorAddress: '',
    alternateExecutor: '',
    debts: '',
    funeralInstructions: '',
    charity: '',
    charityPercent: '',
    heirs: [{ name: '', relationship: '', share: '' }],
    additionalNotes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHeirChange = (index: number, field: string, value: string) => {
    const updated = [...form.heirs];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, heirs: updated });
  };

  const addHeir = () => {
    setForm({
      ...form,
      heirs: [...form.heirs, { name: '', relationship: '', share: '' }],
    });
  };

  const removeHeir = (index: number) => {
    const updated = form.heirs.filter((_, i) => i !== index);
    setForm({ ...form, heirs: updated });
  };

  const handlePrint = () => {
    window.print();
  };

  // Shared input style
  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-transparent';
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5';

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const generateWillContent = () => {
    const { fullName, address, idNumber, executor, executorAddress, alternateExecutor, debts, charity, charityPercent, heirs, funeralInstructions, additionalNotes, date } = form;
    return (
      <div id="will-preview" className="prose prose-stone max-w-none text-[15px] leading-relaxed">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-emerald-800">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <p className="font-bold mt-6 text-xl">LAST WILL AND TESTAMENT (WASIYYAH)</p>
          <p className="text-sm text-gray-500 mt-2">In the name of Allah, the Most Gracious, the Most Merciful</p>
        </div>

        <p>I, <strong>{fullName || '[Full Name]'}</strong>{address ? `, residing at ${address}` : ''}{idNumber ? `, identification number ${idNumber}` : ''}, being of sound mind and body, hereby declare this to be my last will and testament according to Islamic Shariah.</p>

        <p className="mt-4">I bear witness that there is no god but Allah, and Muhammad ﷺ is His final Messenger.</p>

        <p className="mt-4"><strong>Executor:</strong> I appoint <strong>{executor || '[Executor Name]'}</strong>{executorAddress ? `, of ${executorAddress}` : ''} as the executor of my estate. {alternateExecutor ? `If they are unable to serve, I appoint <strong>${alternateExecutor}</strong> as alternate executor.` : ''}</p>

        {debts && (
          <p className="mt-4"><strong>Debts & Expenses:</strong> I direct that all my lawful debts and funeral expenses be paid from my estate before any distribution. {debts}</p>
        )}

        {funeralInstructions && (
          <p className="mt-4"><strong>Funeral Instructions:</strong> {funeralInstructions}</p>
        )}

        {charity && (
          <p className="mt-4"><strong>Charitable Bequests (up to one‑third):</strong> I bequeath {charityPercent ? `${charityPercent}% of my estate` : 'the following'} for charity (Sadaqah Jariyah):<br/> {charity}</p>
        )}

        {heirs.filter(h => h.name).length > 0 && (
          <div className="mt-4">
            <p><strong>Heirs:</strong> For reference, my living heirs are:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {heirs.filter(h => h.name).map((h, i) => (
                <li key={i}>{h.name} – {h.relationship}{h.share ? ` (approximate share: ${h.share})` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6">The remainder of my estate (after debts, funeral expenses, and the above bequests) shall be distributed among my heirs according to the Islamic laws of inheritance (Fara'id).</p>

        {additionalNotes && (
          <p className="mt-4"><strong>Additional Notes:</strong> {additionalNotes}</p>
        )}

        <div className="mt-12 pt-8 border-t border-dashed border-gray-300">
          <p className="italic">Signed: __________________________________</p>
          <p className="italic mt-4">Date: {date || '_____________'}</p>
          <p className="italic mt-4">Witness 1: __________________________________</p>
          <p className="italic mt-4">Witness 2: __________________________________</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white py-4 px-5 shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">⚖️ Islamic Will</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-1 group transition-all ${
                  step === s.id ? 'scale-110' : 'opacity-50'
                }`}
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  step === s.id ? 'bg-emerald-800 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500'
                }`}>
                  {s.icon}
                </span>
                <span className={`text-xs font-medium ${step === s.id ? 'text-emerald-800' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 pb-12">
        {/* Step content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">👤 Your Personal Details</h2>
              <div>
                <label className={labelClass}>FULL LEGAL NAME</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} placeholder="Enter your full legal name" />
              </div>
              <div>
                <label className={labelClass}>ADDRESS</label>
                <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Your residential address" />
              </div>
              <div>
                <label className={labelClass}>ID / PASSPORT NUMBER</label>
                <input name="idNumber" value={form.idNumber} onChange={handleChange} className={inputClass} placeholder="Optional identification" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">⚖️ Executor & Debts</h2>
              <div>
                <label className={labelClass}>EXECUTOR NAME</label>
                <input name="executor" value={form.executor} onChange={handleChange} className={inputClass} placeholder="Person who will execute your will" />
              </div>
              <div>
                <label className={labelClass}>EXECUTOR ADDRESS</label>
                <input name="executorAddress" value={form.executorAddress} onChange={handleChange} className={inputClass} placeholder="Address of executor" />
              </div>
              <div>
                <label className={labelClass}>ALTERNATE EXECUTOR (optional)</label>
                <input name="alternateExecutor" value={form.alternateExecutor} onChange={handleChange} className={inputClass} placeholder="If primary executor cannot serve" />
              </div>
              <div>
                <label className={labelClass}>LIST OF DEBTS & LIABILITIES</label>
                <textarea name="debts" value={form.debts} onChange={handleChange} className={inputClass + ' min-h-[100px]'} placeholder="e.g., Home mortgage, personal loans, unpaid Zakat" />
              </div>
              <div>
                <label className={labelClass}>FUNERAL INSTRUCTIONS (optional)</label>
                <textarea name="funeralInstructions" value={form.funeralInstructions} onChange={handleChange} className={inputClass + ' min-h-[80px]'} placeholder="Any specific wishes for your janazah" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">💚 Charitable Bequests (Sadaqah Jariyah)</h2>
              <p className="text-sm text-gray-500">You may give up to <strong>one‑third</strong> of your estate to non‑heirs or charity. The remaining two‑thirds will be distributed according to Islamic inheritance (Fara'id).</p>
              <div>
                <label className={labelClass}>CHARITY DESCRIPTION</label>
                <textarea name="charity" value={form.charity} onChange={handleChange} className={inputClass + ' min-h-[120px]'} placeholder="e.g., 10% of my estate to build a mosque, 5% to an orphanage, etc." />
              </div>
              <div>
                <label className={labelClass}>PERCENTAGE OF ESTATE (optional)</label>
                <input name="charityPercent" value={form.charityPercent} onChange={handleChange} className={inputClass} placeholder="e.g., 20" />
                <p className="text-xs text-gray-400 mt-1">Must not exceed 33.33%</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">👪 Heirs (for reference)</h2>
              <p className="text-sm text-gray-500">List your living heirs and their relationship to you. This is for clarity; actual shares are determined by Islamic inheritance law.</p>
              {form.heirs.map((heir, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>NAME</label>
                      <input value={heir.name} onChange={(e) => handleHeirChange(idx, 'name', e.target.value)} className={inputClass} placeholder="Heir name" />
                    </div>
                    <div>
                      <label className={labelClass}>RELATIONSHIP</label>
                      <input value={heir.relationship} onChange={(e) => handleHeirChange(idx, 'relationship', e.target.value)} className={inputClass} placeholder="e.g., spouse, son" />
                    </div>
                    <div>
                      <label className={labelClass}>APPROX. SHARE</label>
                      <input value={heir.share} onChange={(e) => handleHeirChange(idx, 'share', e.target.value)} className={inputClass} placeholder="e.g., 1/8" />
                    </div>
                  </div>
                  <button onClick={() => removeHeir(idx)} className="text-red-400 hover:text-red-600 mt-5">✕</button>
                </div>
              ))}
              <button onClick={addHeir} className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">+</span> Add Heir
              </button>
              <div>
                <label className={labelClass}>ADDITIONAL NOTES</label>
                <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} className={inputClass + ' min-h-[80px]'} placeholder="Any extra wishes or instructions" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">📜 Review & Print</h2>
              <p className="text-sm text-gray-500">Review your will draft below. You can go back to any step to make changes.</p>
              <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 overflow-auto max-h-[600px]">
                {generateWillContent()}
              </div>
              <div className="flex gap-4">
                <button onClick={handlePrint} className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                  🖨️ Print / Save as PDF
                </button>
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50">
                  Edit Again
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button onClick={prevStep} className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">
                ← Previous
              </button>
            )}
            {step < 5 && (
              <button onClick={nextStep} className="ml-auto px-6 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-700">
                Next Step →
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Important Disclaimer:</strong> This is an educational template. It is <u>not</u> a substitute for professional legal or Shariah advice. For a legally valid Islamic will, please consult a qualified Islamic scholar and a lawyer familiar with your country's inheritance laws.
          </p>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #will-preview, #will-preview * {
            visibility: visible;
          }
          #will-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
        }
      `}</style>
    </div>
  );
}