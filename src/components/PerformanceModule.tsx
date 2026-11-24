import React from 'react';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Gauge,
  Send,
  Timer,
} from 'lucide-react';
import { CalculatedPerformanceMetrics, DataSourceMode, MediaId } from '../types/network';
import { MEDIA_METADATA, MEDIA_ORDER } from '../utils/calculations';

interface PerformanceModuleProps {
  selectedMedia: MediaId;
  onSelectMedia: (media: MediaId) => void;
  metricsMap: Partial<Record<MediaId, CalculatedPerformanceMetrics>>;
  dataSourceMode: DataSourceMode;
  onEnableDemo: () => void;
  onOpenImport: () => void;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({
  selectedMedia,
  onSelectMedia,
  metricsMap,
  dataSourceMode,
  onEnableDemo,
  onOpenImport,
}) => {
  const activeMetrics = metricsMap[selectedMedia];
  const meta = MEDIA_METADATA[selectedMedia];

  return (
    <section
      id="module-performance"
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <p className="text-xs font-medium text-cyan-300/80">
            Module 3 · Metric Readout & Formulas
          </p>
          <h2 className="text-xl font-semibold tracking-tight mt-0.5 heading-gradient">
            Performance Measurement
          </h2>
        </div>

        {/* Segmented Media Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/85 border border-cyan-500/20 rounded-lg self-start md:self-auto">
          {MEDIA_ORDER.map((id) => {
            const isActive = selectedMedia === id;
            const hasData = Boolean(metricsMap[id]);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectMedia(id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
                }`}
              >
                {MEDIA_METADATA[id].name}
                {dataSourceMode === 'imported' && !hasData ? ' (No data)' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {dataSourceMode === 'empty' || !activeMetrics ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-100">
            {dataSourceMode === 'empty'
              ? 'No simulation data loaded yet.'
              : `No measurements imported for ${meta.shortName}.`}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Import your actual NS-3 CSV or JSON simulation output, or activate Demo Mode to walk through the dashboard using illustrative sample data.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenImport}
              className="glow-btn-primary px-4 py-2 text-xs font-semibold rounded-lg text-white whitespace-nowrap shrink-0"
            >
              Import NS-3 Results (CSV / JSON)
            </button>
            <button
              type="button"
              onClick={onEnableDemo}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-cyan-500/35 bg-slate-950/70 text-slate-100 hover:border-cyan-400/70 hover:shadow-[0_0_16px_rgba(34,211,238,0.2)] transition-all whitespace-nowrap shrink-0"
            >
              Load Demo Mode (Illustrative)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Source Attribution Line */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-slate-100">{meta.shortName}</span>
              <span aria-hidden="true" className="text-cyan-400/60">·</span>
              <span className="font-mono-tabular text-cyan-300">{meta.ns3ChannelClass}</span>
              <span aria-hidden="true" className="text-cyan-400/60">·</span>
              <span className="font-mono-tabular">
                Duration {activeMetrics.measurementDurationSec} s
              </span>
            </div>
            <span
              className={`font-semibold ${
                activeMetrics.dataSource === 'demo'
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {activeMetrics.dataSource === 'demo'
                ? 'ILLUSTRATIVE DATA – NOT ACTUAL NS-3 RESULTS'
                : 'IMPORTED NS-3 SIMULATION DATA'}
            </span>
          </div>

          {/* Packet Counts Row */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-subpanel rounded-xl p-4 hover:border-cyan-400/40 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Transmitted Packets</p>
                <Send className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.65)]" />
              </div>
              <p className="text-2xl font-semibold font-mono-tabular text-slate-50 mt-2">
                {activeMetrics.transmittedPackets.toLocaleString()}
              </p>
            </div>

            <div className="glass-subpanel rounded-xl p-4 hover:border-cyan-400/40 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Received Packets</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
              <p className="text-2xl font-semibold font-mono-tabular text-slate-50 mt-2">
                {activeMetrics.receivedPackets.toLocaleString()}
              </p>
            </div>

            <div className="glass-subpanel rounded-xl p-4 hover:border-cyan-400/40 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Lost Packets</p>
                <AlertOctagon className="h-4 w-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
              <p className="text-2xl font-semibold font-mono-tabular text-slate-50 mt-2">
                {activeMetrics.lostPackets.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Primary KPI Cards: Average Delay, Packet Loss, Throughput */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/45 via-slate-950/80 to-slate-950/90 p-5 shadow-[0_0_24px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-cyan-200">Average Delay</p>
                <Timer className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>
              <p className="text-3xl font-bold font-mono-tabular text-white mt-2">
                {activeMetrics.averageDelayMs.toFixed(3)}
                <span className="text-sm font-normal text-cyan-300 ml-1.5">ms</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">End-to-end packet latency</p>
            </div>

            <div className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-950/45 via-slate-950/80 to-slate-950/90 p-5 shadow-[0_0_24px_rgba(139,92,246,0.1)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-violet-200">Packet Loss</p>
                <Activity className="h-5 w-5 text-violet-300 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
              </div>
              <p className="text-3xl font-bold font-mono-tabular text-white mt-2">
                {activeMetrics.packetLossPercent.toFixed(2)}
                <span className="text-sm font-normal text-violet-300 ml-1">%</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Dropped ratio over transmitted</p>
            </div>

            <div className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-950/45 via-slate-950/80 to-slate-950/90 p-5 shadow-[0_0_24px_rgba(59,130,246,0.1)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-blue-200">Throughput</p>
                <Gauge className="h-5 w-5 text-blue-300 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              </div>
              <p className="text-3xl font-bold font-mono-tabular text-white mt-2">
                {activeMetrics.throughputMbps.toFixed(3)}
                <span className="text-sm font-normal text-blue-300 ml-1.5">Mbps</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Effective received bit rate</p>
            </div>
          </div>

          {/* Transparent Formula Verification */}
          <div className="mt-5 pt-4 border-t border-[var(--border-hairline)] grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="glass-subpanel rounded-xl px-4 py-3">
              <p className="font-medium text-cyan-200">
                Packet Loss (%) Formula
              </p>
              <p className="font-mono-tabular text-slate-300 mt-1">
                ((Transmitted − Received) / Transmitted) × 100
              </p>
              <p className="font-mono-tabular text-slate-400 mt-1">
                = (({activeMetrics.transmittedPackets.toLocaleString()} −{' '}
                {activeMetrics.receivedPackets.toLocaleString()}) /{' '}
                {activeMetrics.transmittedPackets.toLocaleString()}) × 100 ={' '}
                <span className="font-semibold text-white">
                  {activeMetrics.packetLossPercent.toFixed(2)}%
                </span>
              </p>
            </div>

            <div className="glass-subpanel rounded-xl px-4 py-3">
              <p className="font-medium text-cyan-200">
                Throughput (Mbps) Formula
              </p>
              <p className="font-mono-tabular text-slate-300 mt-1">
                (Received Bytes × 8) / (Measurement Duration × 1,000,000)
              </p>
              <p className="font-mono-tabular text-slate-400 mt-1">
                = ({activeMetrics.receivedBytes.toLocaleString()} × 8) / (
                {activeMetrics.measurementDurationSec} × 1,000,000) ={' '}
                <span className="font-semibold text-white">
                  {activeMetrics.throughputMbps.toFixed(3)} Mbps
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
