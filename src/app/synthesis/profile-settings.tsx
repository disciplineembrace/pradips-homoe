'use client';
/// Doctor/Clinic Profile Settings — user-specific branding for Synthesis reports
import { useState, useEffect, useRef } from 'react';
import { DoctorProfile, loadProfile, saveProfile } from './storage';

interface Props {
  onClose: () => void;
  onSaved: (profile: DoctorProfile) => void;
}

export function ProfileSettings({ onClose, onSaved }: Props) {
  const [profile, setProfile] = useState<DoctorProfile>(loadProfile());
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('Logo must be under 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update('logo', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    onSaved(profile);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#173B2D]">Report Profile / Clinic Profile</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <p className="text-xs text-stone-500 mb-4">
            This profile is used ONLY for Synthesis case papers and repertorization reports.
            It does not change the website branding.
          </p>

          <div className="space-y-4">
            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.doctorName}
                onChange={e => update('doctorName', e.target.value)}
                placeholder="Dr. Pradip Sagathiya"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Qualification</label>
              <input
                type="text"
                value={profile.qualification}
                onChange={e => update('qualification', e.target.value)}
                placeholder="BHMS, MD (Hom.)"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Clinic Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Clinic Name (optional)</label>
              <input
                type="text"
                value={profile.clinicName}
                onChange={e => update('clinicName', e.target.value)}
                placeholder="Pradip's Homoeopathic Clinic"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Clinic Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Clinic Address (optional)</label>
              <textarea
                value={profile.clinicAddress}
                onChange={e => update('clinicAddress', e.target.value)}
                placeholder="123 Main Street, City, State - PIN"
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Phone (optional)</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
                />
              </div>
            </div>

            {/* Registration No */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Registration No (optional)</label>
              <input
                type="text"
                value={profile.registrationNo}
                onChange={e => update('registrationNo', e.target.value)}
                placeholder="Reg. No. 12345"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Logo (optional, max 500KB)</label>
              <div className="flex items-center gap-3">
                {profile.logo && (
                  <img src={profile.logo} alt="Logo" className="w-16 h-16 object-contain border border-stone-200 rounded" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="text-xs"
                />
                {profile.logo && (
                  <button onClick={() => update('logo', null)} className="text-xs text-red-600 hover:underline">Remove</button>
                )}
              </div>
            </div>

            {/* Report Footer */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Report Footer (optional)</label>
              <input
                type="text"
                value={profile.reportFooter}
                onChange={e => update('reportFooter', e.target.value)}
                placeholder="This report is generated for clinical reference only."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="mt-5 p-4 border border-stone-200 rounded-lg bg-stone-50">
              <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Report Header Preview</div>
              <div className="text-center py-4 bg-white border border-stone-200 rounded">
                {profile.logo && (
                  <img src={profile.logo} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
                )}
                {profile.clinicName && <div className="font-serif text-lg text-[#173B2D]">{profile.clinicName}</div>}
                {profile.doctorName && <div className="text-sm font-semibold text-stone-700">{profile.doctorName}</div>}
                {profile.qualification && <div className="text-xs text-stone-500">{profile.qualification}</div>}
                {profile.clinicAddress && <div className="text-xs text-stone-500 mt-1">{profile.clinicAddress}</div>}
                {profile.phone && <div className="text-xs text-stone-500">{profile.phone}</div>}
                {profile.email && <div className="text-xs text-stone-500">{profile.email}</div>}
                {profile.registrationNo && <div className="text-xs text-stone-500">Reg. No: {profile.registrationNo}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Preview Report Header'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800">Cancel</button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-[#173B2D] text-white hover:bg-[#0f2a20]'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
