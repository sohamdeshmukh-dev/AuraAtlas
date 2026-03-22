'use client';
import { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { CITIES } from '@/lib/types';
import { ALL_COLLEGES } from '@/lib/collegeList';

export default function OnboardingPage() {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const filteredColleges = useMemo(() => {
        if (!selectedCity) return [];
        return ALL_COLLEGES.filter((c) => c.city === selectedCity);
    }, [selectedCity]);

    const saveAndContinue = async (collegeName: string | null) => {
        setSaving(true);
        setErrorMsg('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { error } = await supabase.from('profiles').upsert(
                {
                    id: user.id,
                    university_name: collegeName || null,
                    city: selectedCity || null,
                },
                { onConflict: 'id' }
            );

            if (error) {
                console.error('Failed to save onboarding data:', error);
                setErrorMsg('Could not save your info — continuing anyway.');
                // Still redirect after a short delay
                setTimeout(() => router.push('/'), 1500);
                return;
            }

            router.push('/');
        } catch (err) {
            console.error(err);
            setErrorMsg('Something went wrong — continuing anyway.');
            setTimeout(() => router.push('/'), 1500);
        } finally {
            setSaving(false);
        }
    };

    const handleGetStarted = () => {
        saveAndContinue(selectedCollege || null);
    };

    const handleSkip = () => {
        saveAndContinue(null);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050913] p-4 text-slate-200">
            <div className="w-full max-w-md rounded-[24px] border border-slate-700 bg-[#0A0F1C] p-8 shadow-2xl">
                <h1 className="mb-2 text-2xl font-bold text-white">Which campus are you at?</h1>
                <p className="mb-8 text-sm text-slate-400">
                    Help us show you mood trends for your campus. You can skip this step.
                </p>

                {/* City selector */}
                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-300">City</label>
                    <select
                        value={selectedCity}
                        onChange={(e) => {
                            setSelectedCity(e.target.value);
                            setSelectedCollege('');
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/50 p-2.5 text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">Select your city</option>
                        {CITIES.map((city) => (
                            <option key={city.name} value={city.name}>
                                {city.name}, {city.state}
                            </option>
                        ))}
                    </select>
                </div>

                {/* College selector */}
                <div className="mb-6">
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                        College{selectedCity ? ` (${filteredColleges.length} available)` : ''}
                    </label>
                    {!selectedCity ? (
                        <p className="rounded-lg border border-slate-700 bg-slate-900/50 p-2.5 text-sm text-slate-500">
                            Choose a city first
                        </p>
                    ) : (
                        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50">
                            <button
                                type="button"
                                onClick={() => setSelectedCollege('')}
                                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                                    selectedCollege === ''
                                        ? 'bg-indigo-600/20 text-indigo-300'
                                        : 'text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs">—</span>
                                <span>No college / skip</span>
                            </button>
                            {filteredColleges.map((college) => (
                                <button
                                    type="button"
                                    key={`${college.city}-${college.name}`}
                                    onClick={() => setSelectedCollege(college.name)}
                                    className={`flex w-full items-center gap-2.5 border-t border-slate-800/50 px-3 py-2 text-left text-sm transition-colors ${
                                        selectedCollege === college.name
                                            ? 'bg-indigo-600/20 text-indigo-300'
                                            : 'text-slate-200 hover:bg-slate-800'
                                    }`}
                                >
                                    {selectedCollege === college.name ? (
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/30 text-xs text-indigo-300">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-slate-500">
                                            ○
                                        </span>
                                    )}
                                    <span className="truncate">{college.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <p className="mb-4 rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                        {errorMsg}
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleGetStarted}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Get Started'}
                    </button>
                </div>
            </div>
        </div>
    );
}
