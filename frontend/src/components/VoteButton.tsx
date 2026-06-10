import React, { useEffect, useState } from 'react';

interface VoteButtonProps {
  featureId: string;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ featureId }) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCount = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${apiBase}/vision/votes/${featureId}`);
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch (_) {
      setCount(0);
    }
  };

  const handleVote = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      await fetch(`${apiBase}/vision/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: featureId }),
      });
      await fetchCount();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [featureId]);

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className="flex items-center justify-center gap-2 mt-2 px-4 py-2 min-h-[44px] min-w-[44px] bg-white/5 border border-white/10 rounded-xl backdrop-blur-md text-primary-container hover:bg-primary-container/20 hover:border-primary-container/40 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto group"
    >
      <span className={`material-symbols-outlined text-[18px] transition-transform ${loading ? 'animate-spin' : 'group-hover:-rotate-12'}`}>
        {loading ? 'sync' : 'thumb_up'}
      </span>
      <span className="font-semibold text-sm tracking-wide">
        Vote{count !== null ? ` (${count})` : ''}
      </span>
    </button>
  );
};
