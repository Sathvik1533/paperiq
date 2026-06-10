import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PriorityResult {
  must_read: Array<{ question: string; reason: string; pyq_frequency: string }>;
  professors_bet: Array<{ question: string; reason: string; pyq_frequency: string }>;
  blind_spots: Array<{ topic: string; reason: string; pyq_frequency: string }>;
}

const ANALYSIS_STEPS = [
  { icon: 'upload_file', label: 'Extracting text from document…' },
  { icon: 'database', label: 'Fetching PYQ data from database…' },
  { icon: 'psychology', label: 'AI cross-referencing questions…' },
  { icon: 'check_circle', label: 'Building your priority list…' },
];

export const FacultyCrossCheck: React.FC<{ subjectId: string }> = ({ subjectId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PriorityResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [revealResults, setRevealResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
      setError('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResults(null);
      setError('');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setAnalysisStep(0);
    setRevealResults(false);

    // Animate through steps
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 2200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${apiBase}/analysis/${subjectId}/cross-reference`, {
        method: 'POST',
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || 'Analysis failed. Upload a valid file containing questions.');
      }

      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      // Brief pause to show final step, then reveal results with animation
      setTimeout(() => {
        setResults(json.data);
        setLoading(false);
        setTimeout(() => setRevealResults(true), 100);
      }, 800);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message);
      setLoading(false);
    }
  };

  const totalResults = results
    ? results.must_read.length + results.professors_bet.length + results.blind_spots.length
    : 0;

  return (
    <div className="rounded-2xl mt-8 relative overflow-hidden">
      {/* Inline styles for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fc-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fc-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fc-pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fc-count-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .fc-card-reveal { animation: fc-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .fc-shimmer-bar {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(249,115,22,0.12) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: fc-shimmer 1.8s ease-in-out infinite;
        }
        .fc-step-active .fc-step-ring {
          animation: fc-pulse-ring 1.5s ease-out infinite;
        }
        .fc-count-badge { animation: fc-count-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .fc-dropzone-active {
          border-color: #f97316 !important;
          background: rgba(249,115,22,0.08) !important;
          box-shadow: 0 0 40px rgba(249,115,22,0.15), inset 0 0 40px rgba(249,115,22,0.05);
        }
      `}} />

      {/* Header with gradient accent */}
      <div className="p-6 pb-0 relative">
        <div className="flex items-start gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#f97316] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>rule_folder</span>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              Faculty Cross-Check
              <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">AI</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-xl">
              Upload your professor's "Important Questions" — our AI cross-references them with PYQ history to build your <span className="text-white font-semibold">Ultimate Priority List</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4">
        {/* Upload Zone */}
        {!results && !loading && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-8
              flex flex-col items-center justify-center gap-4
              transition-all duration-300 min-h-[180px]
              ${dragOver
                ? 'fc-dropzone-active'
                : file
                  ? 'border-orange-500/40 bg-orange-500/5'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
              className="hidden"
            />

            {file ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-400 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                    <span className="material-symbols-outlined text-gray-400 text-[32px]">cloud_upload</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">Drop your file here, or <span className="text-orange-400 underline underline-offset-2">browse</span></p>
                  <p className="text-gray-500 text-xs mt-1.5">Supports PDF, DOCX, PNG, JPG, TXT</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA button */}
        {file && !results && !loading && (
          <button
            onClick={handleUpload}
            className="w-full mt-4 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.45)] text-[15px]"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Cross-Check Against PYQ Data
          </button>
        )}

        {/* Loading: Animated Steps */}
        {loading && (
          <div className="py-8 space-y-5">
            {ANALYSIS_STEPS.map((step, idx) => {
              const isActive = idx === analysisStep;
              const isDone = idx < analysisStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-4 transition-all duration-500 ${
                    isDone ? 'opacity-50' : isActive ? 'fc-step-active opacity-100' : 'opacity-20'
                  }`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    {isActive && <div className="fc-step-ring absolute inset-0 rounded-full border-2 border-orange-500/40" />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDone ? 'bg-green-500/20 border border-green-500/30' : isActive ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <span className={`material-symbols-outlined text-[18px] ${
                        isDone ? 'text-green-400' : isActive ? 'text-orange-400 animate-pulse' : 'text-gray-600'
                      }`} style={{ fontVariationSettings: isDone ? "'FILL' 1" : undefined }}>
                        {isDone ? 'check_circle' : step.icon}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
            <div className="h-2 rounded-full overflow-hidden bg-white/5 mt-4">
              <div
                className="h-full rounded-full fc-shimmer-bar transition-all duration-700"
                style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%)' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/8 border border-red-500/20 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-400 text-[20px] mt-0.5 shrink-0">error</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 fc-card-reveal" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-[15px]">Analysis Complete</h3>
                  <p className="text-gray-500 text-xs">{totalResults} insights generated from your document</p>
                </div>
              </div>
              <button
                onClick={() => { setResults(null); setFile(null); setRevealResults(false); }}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Upload another
              </button>
            </div>

            {/* Three Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Must Read */}
              <div
                className={`rounded-2xl border overflow-hidden transition-all ${revealResults ? 'fc-card-reveal' : 'opacity-0'}`}
                style={{ animationDelay: '150ms', borderColor: 'rgba(34,197,94,0.2)', background: 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, rgba(0,0,0,0) 100%)' }}
              >
                <div className="px-4 py-3 border-b border-green-500/10 flex items-center justify-between">
                  <h4 className="font-bold text-green-400 flex items-center gap-2 text-sm">
                    <span className="text-base">🔥</span> Must Read
                  </h4>
                  {revealResults && (
                    <span className="fc-count-badge inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                      {results.must_read.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 px-4 pt-3 pb-1">Faculty predicted + High PYQ frequency</p>
                <div className="p-4 pt-2 space-y-2.5 max-h-[400px] overflow-y-auto">
                  {results.must_read.length === 0 ? <div className="text-xs text-gray-600 py-4 text-center">No overlapping questions found</div> : null}
                  {results.must_read.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-green-500/20 hover:bg-green-500/[0.03] transition-all group/item">
                      <p className="text-white text-[13px] font-medium leading-relaxed">{item.question}</p>
                      <p className="text-[11px] text-green-500/70 mt-2 leading-relaxed opacity-0 group-hover/item:opacity-100 transition-opacity">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professor's Bet */}
              <div
                className={`rounded-2xl border overflow-hidden transition-all ${revealResults ? 'fc-card-reveal' : 'opacity-0'}`}
                style={{ animationDelay: '300ms', borderColor: 'rgba(249,115,22,0.2)', background: 'linear-gradient(180deg, rgba(249,115,22,0.06) 0%, rgba(0,0,0,0) 100%)' }}
              >
                <div className="px-4 py-3 border-b border-orange-500/10 flex items-center justify-between">
                  <h4 className="font-bold text-orange-400 flex items-center gap-2 text-sm">
                    <span className="text-base">⚠️</span> Professor's Bet
                  </h4>
                  {revealResults && (
                    <span className="fc-count-badge inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30" style={{ animationDelay: '100ms' }}>
                      {results.professors_bet.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 px-4 pt-3 pb-1">Faculty predicted, but rarely in PYQs</p>
                <div className="p-4 pt-2 space-y-2.5 max-h-[400px] overflow-y-auto">
                  {results.professors_bet.length === 0 ? <div className="text-xs text-gray-600 py-4 text-center">All professor questions match PYQs!</div> : null}
                  {results.professors_bet.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-orange-500/20 hover:bg-orange-500/[0.03] transition-all group/item">
                      <p className="text-white text-[13px] font-medium leading-relaxed">{item.question}</p>
                      <p className="text-[11px] text-orange-500/70 mt-2 leading-relaxed opacity-0 group-hover/item:opacity-100 transition-opacity">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blind Spots */}
              <div
                className={`rounded-2xl border overflow-hidden transition-all ${revealResults ? 'fc-card-reveal' : 'opacity-0'}`}
                style={{ animationDelay: '450ms', borderColor: 'rgba(59,130,246,0.2)', background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(0,0,0,0) 100%)' }}
              >
                <div className="px-4 py-3 border-b border-blue-500/10 flex items-center justify-between">
                  <h4 className="font-bold text-blue-400 flex items-center gap-2 text-sm">
                    <span className="text-base">📈</span> Blind Spots
                  </h4>
                  {revealResults && (
                    <span className="fc-count-badge inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30" style={{ animationDelay: '200ms' }}>
                      {results.blind_spots.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 px-4 pt-3 pb-1">High PYQ frequency, missed by Faculty</p>
                <div className="p-4 pt-2 space-y-2.5 max-h-[400px] overflow-y-auto">
                  {results.blind_spots.length === 0 ? <div className="text-xs text-gray-600 py-4 text-center">Professor covered all key topics!</div> : null}
                  {results.blind_spots.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 hover:bg-blue-500/[0.03] transition-all group/item">
                      <p className="text-white text-[13px] font-medium leading-relaxed">{item.topic}</p>
                      <p className="text-[11px] text-blue-500/70 mt-2 leading-relaxed opacity-0 group-hover/item:opacity-100 transition-opacity">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
