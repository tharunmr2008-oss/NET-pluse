import React, { useEffect, useState } from 'react';
import { Cpu, Network, Radio, Sparkles, Zap } from 'lucide-react';
import { MediaId } from '../types/network';

interface LandingIntroProps {
  onComplete: () => void;
  previewMedia: MediaId;
  onSelectPreviewMedia: (media: MediaId) => void;
}

const INTRO_DURATION_MS = 4000;

const MODEL_CARDS: Array<{
  id: MediaId;
  title: string;
  channel: string;
  characteristic: string;
  accentText: string;
  borderActive: string;
  glowStyle: string;
  icon: 'cpu' | 'zap' | 'radio';
}> = [
  {
    id: 'csma',
    title: 'Twisted Pair (CSMA)',
    channel: 'ns3::CsmaChannel',
    characteristic: 'Shared Ethernet bus · Collision & backoff dynamics',
    accentText: 'text-amber-300',
    borderActive: 'border-amber-400/80 bg-amber-950/35 shadow-[0_0_28px_rgba(245,158,11,0.28)]',
    glowStyle: 'text-amber-400',
    icon: 'cpu',
  },
  {
    id: 'p2p',
    title: 'Fiber Optic (P2P)',
    channel: 'ns3::PointToPointChannel',
    characteristic: 'Dedicated optical core · Ultra-low latency & loss',
    accentText: 'text-cyan-300',
    borderActive: 'border-cyan-400/85 bg-cyan-950/35 shadow-[0_0_28px_rgba(34,211,238,0.32)]',
    glowStyle: 'text-cyan-400',
    icon: 'zap',
  },
  {
    id: 'wifi',
    title: 'Wireless (Wi-Fi)',
    channel: 'ns3::YansWifiChannel',
    characteristic: 'IEEE 802.11 RF propagation · Path loss & DCF',
    accentText: 'text-violet-300',
    borderActive: 'border-violet-400/85 bg-violet-950/35 shadow-[0_0_28px_rgba(167,139,250,0.32)]',
    glowStyle: 'text-violet-400',
    icon: 'radio',
  },
];

export const LandingIntro: React.FC<LandingIntroProps> = ({
  onComplete,
  previewMedia,
  onSelectPreviewMedia,
}) => {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / INTRO_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= INTRO_DURATION_MS) {
        setExiting(true);
        window.setTimeout(onComplete, 320);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setTilt({
      rx: Number((-ny * 4.5).toFixed(2)),
      ry: Number((nx * 5.5).toFixed(2)),
    });
  };

  const handleCardSelect = (id: MediaId) => {
    onSelectPreviewMedia(id);
    setPulseCount((c) => c + 1);
  };

  const renderIcon = (icon: 'cpu' | 'zap' | 'radio', className: string) => {
    if (icon === 'cpu') return <Cpu className={className} />;
    if (icon === 'zap') return <Zap className={className} />;
    return <Radio className={className} />;
  };

  const remainingSeconds = Math.max(0, ((100 - progress) / 100) * (INTRO_DURATION_MS / 1000));

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      onClick={() => setPulseCount((c) => c + 1)}
      className={`fixed inset-0 z-20 flex items-center justify-center bg-[#040712] px-4 sm:px-6 transition-opacity duration-300 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Radial Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-[140px]" />
      </div>

      {/* Interactive 3D-tilted Glass Centerpiece */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full max-w-4xl glass-panel rounded-3xl p-7 sm:p-10 text-center"
      >
        <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-cyan-300">
          <Network className="h-4 w-4 text-cyan-400" />
          <span>NetPulse · NS-3 Link Performance Platform</span>
        </div>

        <h1 className="mt-3 text-4xl sm:text-6xl font-bold tracking-tight heading-gradient leading-none">
          NetPulse
        </h1>
        <p className="mt-3 text-base sm:text-xl font-medium text-slate-100 text-balance">
          Impact of Transmission Media on Delay, Loss and Throughput
        </p>

        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          Move your cursor to steer the particle field, click anywhere to trigger a kinetic pulse burst{pulseCount > 0 ? ` (${pulseCount} bursts)` : ''}, or select a link model below.
        </p>

        {/* Interactive Link Model Selector Cards */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
          {MODEL_CARDS.map((card) => {
            const isSelected = previewMedia === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardSelect(card.id)}
                className={`rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? card.borderActive
                    : 'border-cyan-500/20 bg-slate-950/55 hover:border-cyan-400/55 hover:bg-slate-900/65'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${card.accentText}`}>
                    {card.title}
                  </span>
                  {renderIcon(card.icon, `h-4 w-4 ${card.glowStyle}`)}
                </div>
                <p className="mt-1 font-mono-tabular text-xs text-cyan-200/80">
                  {card.channel}
                </p>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {card.characteristic}
                </p>
              </button>
            );
          })}
        </div>

        {/* Strict 4-Second Auto-Launch Progress Bar */}
        <div className="mt-7 pt-4 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Opening NetPulse workspace in {remainingSeconds.toFixed(1)}s
            </span>
            <span className="font-mono-tabular text-cyan-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
