import React, { useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, Trophy } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalculatedPerformanceMetrics, DataSourceMode, MediaId } from '../types/network';
import { MEDIA_METADATA, MEDIA_ORDER, getBestPerformers } from '../utils/calculations';

interface ComparisonModuleProps {
  metricsMap: Partial<Record<MediaId, CalculatedPerformanceMetrics>>;
  dataSourceMode: DataSourceMode;
  selectedMedia: MediaId;
  onSelectMedia: (media: MediaId) => void;
}

type ChartType = 'bar' | 'line';

interface ChartDatum {
  mediaId: MediaId;
  name: string;
  shortName: string;
  ns3ChannelClass: string;
  transmittedPackets: number;
  receivedPackets: number;
  lostPackets: number;
  bandwidthMbps: number;
  delayMs: number;
  lossPct: number;
  throughputMbps: number;
  color: string;
}

export const ComparisonModule: React.FC<ComparisonModuleProps> = ({
  metricsMap,
  dataSourceMode,
  selectedMedia,
  onSelectMedia,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const availableRows = MEDIA_ORDER
    .map((id) => metricsMap[id])
    .filter((item): item is CalculatedPerformanceMetrics => Boolean(item));

  const chartData: ChartDatum[] = availableRows.map((m) => ({
    mediaId: m.mediaId,
    name: `${m.mediaLabel} (${m.linkModelLabel})`,
    shortName: m.mediaLabel,
    ns3ChannelClass: m.ns3ChannelClass,
    transmittedPackets: m.transmittedPackets,
    receivedPackets: m.receivedPackets,
    lostPackets: m.lostPackets,
    bandwidthMbps: m.config.bandwidthMbps,
    delayMs: Number(m.averageDelayMs.toFixed(3)),
    lossPct: Number(m.packetLossPercent.toFixed(2)),
    throughputMbps: Number(m.throughputMbps.toFixed(3)),
    color: MEDIA_METADATA[m.mediaId].accentHex,
  }));

  const bestPerformers = getBestPerformers(metricsMap);
  const selectedMeta = MEDIA_METADATA[selectedMedia];

  const renderMetricChart = (
    title: string,
    subtitle: string,
    dataKey: 'delayMs' | 'lossPct' | 'throughputMbps',
    unit: string,
    seriesLabel: string,
    lineStroke: string,
    higherIsBetter: boolean
  ) => {
    const formatShort = (val: unknown) => {
      const num = Number(val ?? 0);
      if (dataKey === 'lossPct') return `${num.toFixed(2)}%`;
      if (dataKey === 'delayMs') return `${num.toFixed(3)} ms`;
      return `${num.toFixed(3)} Mbps`;
    };

    const values = chartData.map((d) => d[dataKey]);
    const meanValue =
      values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
    const bestValue =
      values.length > 0
        ? higherIsBetter
          ? Math.max(...values)
          : Math.min(...values)
        : 0;

    return (
      <div className="glass-subpanel rounded-xl p-5 border border-cyan-500/25 shadow-[0_0_24px_rgba(6,182,212,0.08)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              X: Transmission Medium · Y: {unit} · Mean:{' '}
              <span className="font-mono-tabular text-slate-200">
                {formatShort(meanValue)}
              </span>
            </p>
          </div>
          <span className="text-xs font-medium text-cyan-300/95">{subtitle}</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 28, right: 18, left: 6, bottom: 18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.16)"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 12, fill: '#e2e8f0' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.32)' }}
                  tickLine={false}
                  label={{
                    value: 'Transmission Medium',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#cbd5e1' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.22)' }}
                  tickLine={false}
                  width={60}
                  domain={[0, (dataMax: number) => Number((dataMax * 1.18 || 1).toFixed(3))]}
                  label={{
                    value: unit,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 11,
                    offset: 6,
                  }}
                />
                <ReferenceLine
                  y={meanValue}
                  stroke="rgba(148, 163, 184, 0.5)"
                  strokeDasharray="4 4"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as ChartDatum;
                    return (
                      <div className="rounded-xl border border-cyan-400/45 bg-[#060b1d]/95 p-3 text-xs shadow-[0_0_24px_rgba(6,182,212,0.25)]">
                        <p className="font-semibold text-cyan-200">{item.name}</p>
                        <p className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                          {item.ns3ChannelClass} · {item.bandwidthMbps} Mbps link
                        </p>
                        <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{seriesLabel}:</span>
                            <span className="font-mono-tabular font-semibold text-white">
                              {formatShort(item[dataKey])}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Rx / Tx Packets:</span>
                            <span className="font-mono-tabular text-slate-200">
                              {item.receivedPackets.toLocaleString()} /{' '}
                              {item.transmittedPackets.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Lost Packets:</span>
                            <span className="font-mono-tabular text-slate-200">
                              {item.lostPackets.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: 'rgba(34, 211, 238, 0.06)' }}
                />
                <Legend
                  verticalAlign="top"
                  height={26}
                  formatter={() => (
                    <span className="text-xs text-slate-300">
                      {seriesLabel} (Selected: {selectedMeta.name} · Dashed line = Mean)
                    </span>
                  )}
                />
                <Bar dataKey={dataKey} name={seriesLabel} radius={[8, 8, 0, 0]} maxBarSize={68}>
                  <LabelList
                    dataKey={dataKey}
                    position="top"
                    formatter={formatShort}
                    style={{
                      fill: '#f1f5f9',
                      fontSize: 11,
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontWeight: 600,
                    }}
                  />
                  {chartData.map((entry) => {
                    const isSelected = entry.mediaId === selectedMedia;
                    return (
                      <Cell
                        key={entry.mediaId}
                        fill={entry.color}
                        fillOpacity={isSelected ? 1 : 0.52}
                        stroke={isSelected ? '#ffffff' : entry.color}
                        strokeWidth={isSelected ? 1.75 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 30, right: 26, left: 6, bottom: 18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.16)"
                />
                <XAxis
                  dataKey="shortName"
                  padding={{ left: 36, right: 36 }}
                  tick={{ fontSize: 12, fill: '#e2e8f0' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.32)' }}
                  tickLine={false}
                  label={{
                    value: 'Transmission Medium',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#cbd5e1' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.22)' }}
                  tickLine={false}
                  width={60}
                  domain={[0, (dataMax: number) => Number((dataMax * 1.2 || 1).toFixed(3))]}
                  label={{
                    value: unit,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 11,
                    offset: 6,
                  }}
                />
                <ReferenceLine
                  y={meanValue}
                  stroke="rgba(148, 163, 184, 0.5)"
                  strokeDasharray="4 4"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as ChartDatum;
                    return (
                      <div className="rounded-xl border border-cyan-400/45 bg-[#060b1d]/95 p-3 text-xs shadow-[0_0_24px_rgba(6,182,212,0.25)]">
                        <p className="font-semibold text-cyan-200">{item.name}</p>
                        <p className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                          {item.ns3ChannelClass} · {item.bandwidthMbps} Mbps link
                        </p>
                        <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{seriesLabel}:</span>
                            <span className="font-mono-tabular font-semibold text-white">
                              {formatShort(item[dataKey])}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Rx / Tx Packets:</span>
                            <span className="font-mono-tabular text-slate-200">
                              {item.receivedPackets.toLocaleString()} /{' '}
                              {item.transmittedPackets.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Lost Packets:</span>
                            <span className="font-mono-tabular text-slate-200">
                              {item.lostPackets.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={26}
                  formatter={() => (
                    <span className="text-xs text-slate-300">
                      {seriesLabel} (Selected: {selectedMeta.name} · Dashed line = Mean)
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  name={seriesLabel}
                  stroke={lineStroke}
                  strokeWidth={3}
                  activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                  dot={(dotProps) => {
                    const { cx, cy, payload } = dotProps as {
                      cx?: number;
                      cy?: number;
                      payload?: ChartDatum;
                    };
                    if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
                      return <g key="empty-dot" />;
                    }
                    const isSelected = payload.mediaId === selectedMedia;
                    return (
                      <g key={`dot-${payload.mediaId}`}>
                        {isSelected && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={12}
                            fill={payload.color}
                            fillOpacity={0.28}
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 6.5 : 5}
                          fill={payload.color}
                          stroke={isSelected ? '#ffffff' : '#0b1229'}
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }}
                >
                  <LabelList
                    dataKey={dataKey}
                    position="top"
                    offset={12}
                    formatter={formatShort}
                    style={{
                      fill: '#f1f5f9',
                      fontSize: 11,
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontWeight: 600,
                    }}
                  />
                </Line>
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Detailed Exact-Value Breakdown Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          {chartData.map((item) => {
            const isSelected = item.mediaId === selectedMedia;
            const isBest = Math.abs(item[dataKey] - bestValue) < 1e-6;
            return (
              <button
                key={item.mediaId}
                type="button"
                onClick={() => onSelectMedia(item.mediaId)}
                className={`rounded-lg px-2 py-2 border transition-all ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-950/35'
                    : 'border-slate-800/80 bg-slate-950/40 hover:border-cyan-500/35'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-medium">{item.shortName}</span>
                </div>
                <p className="mt-1 font-mono-tabular text-xs font-semibold text-white">
                  {formatShort(item[dataKey])}
                </p>
                {isBest && (
                  <p className="text-[10px] font-medium text-cyan-300 mt-0.5">Best</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      id="module-comparison"
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <p className="text-xs font-medium text-cyan-300/80">
            Module 4 · Cross-Model Evaluation
          </p>
          <h2 className="text-xl font-semibold tracking-tight mt-0.5 heading-gradient">
            Result Comparison
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {dataSourceMode !== 'empty' && (
            <span
              className={`text-xs font-semibold ${
                dataSourceMode === 'demo' ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {dataSourceMode === 'demo'
                ? 'ILLUSTRATIVE DATA – NOT ACTUAL NS-3 RESULTS'
                : 'IMPORTED NS-3 SIMULATION DATA'}
            </span>
          )}

          {/* Clear Bar Graph / Line Graph Selector */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-cyan-500/25"
            role="group"
            aria-label="Chart Type Selector"
          >
            <button
              type="button"
              onClick={() => setChartType('bar')}
              aria-pressed={chartType === 'bar'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                chartType === 'bar'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.22)]'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Bar Graph
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              aria-pressed={chartType === 'line'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                chartType === 'line'
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-400/55 shadow-[0_0_14px_rgba(167,139,250,0.25)]'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              Line Graph
            </button>
          </div>
        </div>
      </div>

      {availableRows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-100">
            Comparison charts and tables will appear once data is loaded.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Use Demo Mode for illustrative sample data or import an NS-3 CSV/JSON result file.
          </p>
        </div>
      ) : (
        <>
          {/* Metric-Wise Best Performer Identification */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestPerformers.map((entry) => (
              <div
                key={entry.metric}
                className="glass-subpanel rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/45 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-200">
                    <Trophy className="h-3.5 w-3.5 text-cyan-300" />
                    Best {entry.metricLabel}
                  </span>
                  <span className="text-xs text-slate-400">{entry.ruleLabel}</span>
                </div>
                <p className="text-base font-semibold text-white mt-2">
                  {entry.winnerNames.join(' & ')}
                </p>
                <p className="text-sm font-mono-tabular font-semibold text-cyan-300 mt-0.5">
                  {entry.formattedValue}
                </p>
              </div>
            ))}
          </div>

          {/* Large Presentation-Ready Comparison Charts (Bar / Line Switchable) */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
            {renderMetricChart(
              'End-to-End Delay',
              'Lower is better',
              'delayMs',
              'Delay (ms)',
              'Average Delay (ms)',
              '#22d3ee',
              false
            )}
            {renderMetricChart(
              'Packet Loss',
              'Lower is better',
              'lossPct',
              'Loss (%)',
              'Packet Loss (%)',
              '#a78bfa',
              false
            )}
            {renderMetricChart(
              'Throughput',
              'Higher is better',
              'throughputMbps',
              'Throughput (Mbps)',
              'Throughput (Mbps)',
              '#38bdf8',
              true
            )}
          </div>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto glass-subpanel rounded-xl border border-cyan-500/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-cyan-500/20 text-xs font-medium text-cyan-200/90">
                  <th className="py-3.5 px-4">Transmission Media</th>
                  <th className="py-3.5 px-4">NS-3 Link Model</th>
                  <th className="py-3.5 px-4 text-right">Transmitted</th>
                  <th className="py-3.5 px-4 text-right">Received</th>
                  <th className="py-3.5 px-4 text-right">Lost</th>
                  <th className="py-3.5 px-4 text-right">Avg Delay (ms)</th>
                  <th className="py-3.5 px-4 text-right">Packet Loss (%)</th>
                  <th className="py-3.5 px-4 text-right">Throughput (Mbps)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {availableRows.map((row) => {
                  const isFocused = row.mediaId === selectedMedia;
                  return (
                    <tr
                      key={row.mediaId}
                      onClick={() => onSelectMedia(row.mediaId)}
                      className={`cursor-pointer transition-colors ${
                        isFocused
                          ? 'bg-cyan-950/40'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-100 whitespace-nowrap">
                        {row.mediaLabel}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono-tabular text-cyan-300/90 whitespace-nowrap">
                        {row.linkModelLabel} · {row.ns3ChannelClass}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-200">
                        {row.transmittedPackets.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-200">
                        {row.receivedPackets.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-200">
                        {row.lostPackets.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-cyan-200">
                        {row.averageDelayMs.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-violet-200">
                        {row.packetLossPercent.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-white">
                        {row.throughputMbps.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
