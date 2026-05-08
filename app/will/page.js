export const metadata = {
  title: 'Islamic Will — Draft Your Wasiyyah Easily | I Love Islam',
  description: 'Draft your Islamic will and wasiyyah for free. Based on Islamic inheritance law. Simple step by step guide. No sign-up needed.',
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function IslamicWill() {
  const [formData, setFormData] = useState({
    fullName: '',
    executor: '',
    charity: '',
    debts: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-serif">
      {/* Consistent Dark Green Header */}
      <header className="bg-[#0a3d2e] text-white py-4 px-5 flex items-center">
        <Link href="/" className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
          ← Back
        </Link>
        <h1 className="flex-1 text-center text-xl font-semibold">⚖️ Islamic Will</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#0a3d2e] mb-2">Islamic Will Generator</h1>
          <p className="text-gray-600 text-sm">Create a basic Wasiyyah (Islamic Will) draft</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6 text-[#0a3d2e]">Your Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">FULL LEGAL NAME</label>
                <input 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border-b border-gray-300 py-3 outline-none focus:border-[#0a3d2e] transition-colors text-lg"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">EXECUTOR / TRUSTEE NAME</label>
                <input 
                  name="executor"
                  value={formData.executor}
                  onChange={handleChange}
                  className="w-full border-b border-gray-300 py-3 outline-none focus:border-[#0a3d2e] transition-colors text-lg"
                  placeholder="Name of the person who will execute the will"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CHARITABLE BEQUESTS (Max 1/3)</label>
                <textarea 
                  name="charity"
                  value={formData.charity}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-[#0a3d2e] min-h-[120px]"
                  placeholder="Example: 10% to orphanage, help poor students, etc."
                />
              </div>

              <button 
                onClick={() => setShowPreview(true)}
                className="w-full bg-[#0a3d2e] hover:bg-[#1a6b4a] text-white py-4 rounded-2xl font-semibold transition-all"
              >
                Generate Will Draft
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[500px] relative">
            <div className="absolute top-6 right-6 text-xs text-gray-400">DRAFT PREVIEW</div>

            {showPreview ? (
              <div id="will-preview" className="prose prose-stone max-w-none text-[15px] leading-relaxed">
                <div className="text-center mb-8">
                  <p className="font-bold text-xl text-[#0a3d2e]">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                  <p className="font-bold mt-6 text-lg">LAST WILL AND TESTAMENT (WASIYYAH)</p>
                </div>

                <p>I, <strong>{formData.fullName || '[Your Full Name]'}</strong>, being of sound mind and body, hereby declare this to be my last will and testament according to Islamic Shariah.</p>
                
                <p className="mt-4">I bear witness that there is no god but Allah, and Muhammad ﷺ is His final Messenger.</p>
                
                <p className="mt-4">I appoint <strong>{formData.executor || '[Executor Name]'}</strong> as the executor of my estate.</p>
                
                <p className="mt-4">I direct that all my debts and funeral expenses be paid first.</p>
                
                <p className="mt-4">I bequeath the following for charity (Sadaqah Jariyah):<br/>
                  <strong>{formData.charity || 'No specific charitable bequests mentioned.'}</strong>
                </p>
                
                <p className="mt-6">The remainder of my estate shall be distributed among my heirs according to the Islamic laws of inheritance (Fara'id).</p>

                <div className="mt-12 pt-8 border-t border-dashed border-gray-300">
                  <p className="italic">Signature: _______________________________</p>
                  <p className="italic mt-4">Date: ___________________________________</p>
                  <p className="italic mt-4">Witness 1: _______________________________</p>
                  <p className="italic mt-4">Witness 2: _______________________________</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-400 italic">
                Fill the form on the left and click "Generate Will Draft"
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showPreview && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handlePrint}
              className="bg-[#0a3d2e] text-white px-10 py-4 rounded-2xl font-semibold hover:bg-[#1a6b4a] transition-all flex items-center justify-center gap-2"
            >
              🖨️ Print / Save as PDF
            </button>
            
            <button 
              onClick={() => setShowPreview(false)}
              className="border border-gray-300 px-8 py-4 rounded-2xl font-medium hover:bg-gray-50"
            >
              Edit Again
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important Disclaimer:</strong> This is a basic educational template only. It does not replace professional legal or Shariah advice. Please consult a qualified Islamic scholar and a lawyer in your country to make your will legally valid.
          </p>
        </div>
      </div>
    </div>
  );
}