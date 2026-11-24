import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { DataSourceMode, LinkConfiguration, MediaId } from '../types/network';
import { MEDIA_METADATA } from '../utils/calculations';

interface TopologyModuleProps {
  selectedMedia: MediaId;
  config: LinkConfiguration;
  dataSourceMode: DataSourceMode;
}

export const TopologyModule: React.FC<TopologyModuleProps> = ({
  selectedMedia,
  config,
  dataSourceMode,
}) => {
  const meta = MEDIA_METADATA[selectedMedia];
  const [isReplayActive, setIsReplayActive] = useState(true);

  // Packet movement animates strictly when genuine imported NS-3 results are loaded
  const showAnimatedPackets = dataSourceMode === 'imported' && isReplayActive;

  return (
    <section
      id="module-topology"
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <p className="text-xs font-medium text-cyan-300/80">
            Module 1 · Link Schematic
          </p>
          <h2 className="text-xl font-semibold tracking-tight mt-0.5 heading-gradient">
            Network Topology
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono-tabular">
            <span className="text-slate-100 font-medium">{meta.shortName}</span>
            <span aria-hidden="true" className="text-cyan-400/60">·</span>
            <span className="text-cyan-300">{meta.ns3ChannelClass}</span>
          </div>

          {dataSourceMode === 'imported' ? (
            <button
              type="button"
              onClick={() => setIsReplayActive((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:border-cyan-300/70 hover:shadow-[0_0_16px_rgba(34,211,238,0.25)] transition-all whitespace-nowrap shrink-0"
            >
              {isReplayActive ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause Trace Flow
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Replay Trace Flow
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              Static preview · Import NS-3 data for trace flow animation
            </span>
          )}
        </div>
      </div>

      {/* Interactive Futuristic Schematic Stage */}
      <div className="mt-5 glass-subpanel rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <svg
          viewBox="0 0 760 230"
          className="w-full h-auto max-h-[240px]"
          role="img"
          aria-label={`Network topology diagram for ${meta.shortName}`}
        >
          <defs>
            <filter id="glow-soft" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="node-header-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <marker
              id="arrow-forward"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={meta.accentHex} />
            </marker>
          </defs>

          {/* Subtle Cyber Grid */}
          <pattern id="topo-grid-dark" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="0.75"
            />
          </pattern>
          <rect x="0" y="0" width="760" height="230" fill="#050a19" rx="8" />
          <rect x="0" y="0" width="760" height="230" fill="url(#topo-grid-dark)" rx="8" />

          {/* Source Node (Node 0) */}
          <g transform="translate(36, 60)" filter="url(#glow-soft)">
            <rect
              x="0"
              y="0"
              width="156"
              height="104"
              rx="10"
              fill="#0b132b"
              stroke="#22d3ee"
              strokeOpacity="0.65"
              strokeWidth="1.5"
            />
            <rect
              x="1"
              y="1"
              width="154"
              height="30"
              rx="9"
              fill="url(#node-header-grad)"
            />
            <circle cx="140" cy="16" r="3.5" fill="#22d3ee" />
            <text
              x="14"
              y="20"
              fontSize="11"
              fontWeight="600"
              fill="#e2e8f0"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Node 0 · Source
            </text>
            <text
              x="14"
              y="52"
              fontSize="11.5"
              fill="#67e8f9"
              fontFamily="IBM Plex Mono, monospace"
            >
              10.1.1.1
            </text>
            <text
              x="14"
              y="71"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="DM Sans, sans-serif"
            >
              UdpClient / OnOffApp
            </text>
            <text
              x="14"
              y="88"
              fontSize="10"
              fill="#cbd5e1"
              fontFamily="IBM Plex Mono, monospace"
            >
              {config.packetCount.toLocaleString()} pkts · {config.packetSizeBytes} B
            </text>
          </g>

          {/* Destination Node (Node 1) */}
          <g transform="translate(568, 60)" filter="url(#glow-soft)">
            <rect
              x="0"
              y="0"
              width="156"
              height="104"
              rx="10"
              fill="#0b132b"
              stroke="#8b5cf6"
              strokeOpacity="0.7"
              strokeWidth="1.5"
            />
            <rect
              x="1"
              y="1"
              width="154"
              height="30"
              rx="9"
              fill="url(#node-header-grad)"
            />
            <circle cx="140" cy="16" r="3.5" fill="#a78bfa" />
            <text
              x="14"
              y="20"
              fontSize="11"
              fontWeight="600"
              fill="#e2e8f0"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Node 1 · Destination
            </text>
            <text
              x="14"
              y="52"
              fontSize="11.5"
              fill="#c4b5fd"
              fontFamily="IBM Plex Mono, monospace"
            >
              10.1.1.2
            </text>
            <text
              x="14"
              y="71"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="DM Sans, sans-serif"
            >
              PacketSink / FlowMonitor
            </text>
            <text
              x="14"
              y="88"
              fontSize="10"
              fill="#cbd5e1"
              fontFamily="IBM Plex Mono, monospace"
            >
              Duration: {config.simulationDurationSec}s
            </text>
          </g>

          {/* Medium-Specific Link Representation */}
          {selectedMedia === 'csma' && (
            <g>
              {/* Glowing Shared CSMA Bus */}
              <line
                x1="214"
                y1="146"
                x2="546"
                y2="146"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeOpacity="0.28"
                strokeLinecap="round"
                filter="url(#glow-soft)"
              />
              <line
                x1="214"
                y1="146"
                x2="546"
                y2="146"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Node 0 drop cable */}
              <line x1="192" y1="112" x2="246" y2="112" stroke="#64748b" strokeWidth="1.5" />
              <line x1="246" y1="112" x2="246" y2="146" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="246" cy="146" r="4.5" fill="#fbbf24" filter="url(#glow-soft)" />

              {/* Node 1 drop cable */}
              <line x1="514" y1="146" x2="514" y2="112" stroke="#f59e0b" strokeWidth="2" />
              <line x1="514" y1="112" x2="568" y2="112" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="514" cy="146" r="4.5" fill="#fbbf24" filter="url(#glow-soft)" />

              {/* Contention Peer Node */}
              <rect
                x="312"
                y="40"
                width="136"
                height="52"
                rx="8"
                fill="#0b132b"
                stroke="#f59e0b"
                strokeOpacity="0.65"
                strokeWidth="1.5"
              />
              <text
                x="380"
                y="62"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#fcd34d"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                CSMA Shared Bus
              </text>
              <text
                x="380"
                y="79"
                textAnchor="middle"
                fontSize="10"
                fill="#cbd5e1"
                fontFamily="IBM Plex Mono, monospace"
              >
                Twisted Pair · Backoff
              </text>
              <line
                x1="380"
                y1="92"
                x2="380"
                y2="146"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle cx="380" cy="146" r="4" fill="#fbbf24" />

              {/* Direction guide */}
              <line
                x1="264"
                y1="130"
                x2="496"
                y2="130"
                stroke="#fbbf24"
                strokeWidth="1.5"
                markerEnd="url(#arrow-forward)"
              />

              {/* Animated Packet Pulses (Imported genuine NS-3 flow only) */}
              {showAnimatedPackets && (
                <g filter="url(#glow-soft)">
                  <circle r="4.5" fill="#fde68a">
                    <animateMotion
                      dur="1.9s"
                      repeatCount="indefinite"
                      path="M 192 112 L 246 112 L 246 146 L 514 146 L 514 112 L 568 112"
                    />
                  </circle>
                  <circle r="4" fill="#fbbf24">
                    <animateMotion
                      dur="1.9s"
                      begin="0.95s"
                      repeatCount="indefinite"
                      path="M 192 112 L 246 112 L 246 146 L 514 146 L 514 112 L 568 112"
                    />
                  </circle>
                </g>
              )}

              <text
                x="380"
                y="182"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#fde68a"
                fontFamily="IBM Plex Mono, monospace"
              >
                {config.bandwidthMbps} Mbps · {config.propagationDelayMs} ms prop delay
              </text>
              <text
                x="380"
                y="200"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="DM Sans, sans-serif"
              >
                Shared Copper Collision Domain · Carrier Sense Multiple Access
              </text>
            </g>
          )}

          {selectedMedia === 'p2p' && (
            <g>
              {/* Glowing Optical Core */}
              <line
                x1="192"
                y1="112"
                x2="568"
                y2="112"
                stroke="#06b6d4"
                strokeWidth="7"
                strokeOpacity="0.25"
                filter="url(#glow-soft)"
              />
              <line
                x1="192"
                y1="112"
                x2="568"
                y2="112"
                stroke="#22d3ee"
                strokeWidth="3"
                markerEnd="url(#arrow-forward)"
              />
              <line
                x1="192"
                y1="119"
                x2="568"
                y2="119"
                stroke="#38bdf8"
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />

              {/* Optical Transceivers */}
              <rect
                x="202"
                y="100"
                width="26"
                height="24"
                rx="5"
                fill="#083344"
                stroke="#22d3ee"
                strokeWidth="1.3"
              />
              <text
                x="215"
                y="116"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#67e8f9"
                fontFamily="IBM Plex Mono, monospace"
              >
                TX
              </text>
              <rect
                x="532"
                y="100"
                width="26"
                height="24"
                rx="5"
                fill="#083344"
                stroke="#22d3ee"
                strokeWidth="1.3"
              />
              <text
                x="545"
                y="116"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#67e8f9"
                fontFamily="IBM Plex Mono, monospace"
              >
                RX
              </text>

              <rect
                x="286"
                y="48"
                width="188"
                height="40"
                rx="8"
                fill="#0b132b"
                stroke="#22d3ee"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
              <text
                x="380"
                y="72"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#67e8f9"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                Dedicated Fiber P2P Link
              </text>

              {/* Animated Optical Pulses (Imported genuine NS-3 flow only) */}
              {showAnimatedPackets && (
                <g filter="url(#glow-soft)">
                  <circle r="4.5" fill="#a5f3fc">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M 228 112 L 532 112" />
                  </circle>
                  <circle r="4" fill="#22d3ee">
                    <animateMotion
                      dur="1.2s"
                      begin="0.4s"
                      repeatCount="indefinite"
                      path="M 228 112 L 532 112"
                    />
                  </circle>
                  <circle r="4" fill="#38bdf8">
                    <animateMotion
                      dur="1.2s"
                      begin="0.8s"
                      repeatCount="indefinite"
                      path="M 228 112 L 532 112"
                    />
                  </circle>
                </g>
              )}

              <text
                x="380"
                y="156"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#67e8f9"
                fontFamily="IBM Plex Mono, monospace"
              >
                {config.bandwidthMbps} Mbps · {config.propagationDelayMs} ms prop delay
              </text>
              <text
                x="380"
                y="175"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="DM Sans, sans-serif"
              >
                Full-Duplex Optical Waveguide · Zero MAC Contention
              </text>
            </g>
          )}

          {selectedMedia === 'wifi' && (
            <g>
              {/* Wireless Access Point */}
              <rect
                x="312"
                y="40"
                width="136"
                height="54"
                rx="8"
                fill="#0b132b"
                stroke="#a78bfa"
                strokeOpacity="0.75"
                strokeWidth="1.5"
                filter="url(#glow-soft)"
              />
              <text
                x="380"
                y="62"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#ddd6fe"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                Wi-Fi AP / Channel
              </text>
              <text
                x="380"
                y="80"
                textAnchor="middle"
                fontSize="10"
                fill="#c4b5fd"
                fontFamily="IBM Plex Mono, monospace"
              >
                {config.wifiSettings.standard} · {config.wifiSettings.distanceMeters}m
              </text>

              {/* Glowing RF Links */}
              <line
                x1="192"
                y1="112"
                x2="310"
                y2="72"
                stroke="#a78bfa"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                markerEnd="url(#arrow-forward)"
                filter="url(#glow-soft)"
              />
              <line
                x1="450"
                y1="72"
                x2="564"
                y2="112"
                stroke="#a78bfa"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                markerEnd="url(#arrow-forward)"
                filter="url(#glow-soft)"
              />

              {/* Glowing RF Signal Arcs */}
              <path
                d="M 352 114 Q 380 94 408 114"
                fill="none"
                stroke="#a78bfa"
                strokeOpacity="0.75"
                strokeWidth="1.6"
              />
              <path
                d="M 336 128 Q 380 98 424 128"
                fill="none"
                stroke="#22d3ee"
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />

              {/* Animated RF Packet Pulses (Imported genuine NS-3 flow only) */}
              {showAnimatedPackets && (
                <g filter="url(#glow-soft)">
                  <circle r="4.5" fill="#ddd6fe">
                    <animateMotion
                      dur="2.1s"
                      repeatCount="indefinite"
                      path="M 192 112 L 310 72 L 450 72 L 564 112"
                    />
                  </circle>
                  <circle r="4" fill="#22d3ee">
                    <animateMotion
                      dur="2.1s"
                      begin="1.05s"
                      repeatCount="indefinite"
                      path="M 192 112 L 310 72 L 450 72 L 564 112"
                    />
                  </circle>
                </g>
              )}

              <text
                x="380"
                y="160"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#ddd6fe"
                fontFamily="IBM Plex Mono, monospace"
              >
                {config.bandwidthMbps} Mbps · {config.wifiSettings.channelConfig}
              </text>
              <text
                x="380"
                y="179"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="DM Sans, sans-serif"
              >
                {config.wifiSettings.propagationModel} · Tx {config.wifiSettings.txPowerDbm} dBm
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Network Configuration Summary Grid */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-[var(--border-hairline)]">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Transmission Model</p>
          <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
            {meta.shortName}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">NS-3 Device</p>
          <p
            className="text-sm font-mono-tabular text-cyan-300 mt-1 truncate"
            title={meta.ns3DeviceClass}
          >
            {meta.ns3DeviceClass}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Packet Load</p>
          <p className="text-sm font-mono-tabular text-[var(--text-primary)] mt-1">
            {config.packetCount.toLocaleString()} × {config.packetSizeBytes} B
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Link Bandwidth</p>
          <p className="text-sm font-mono-tabular text-[var(--text-primary)] mt-1">
            {config.bandwidthMbps} Mbps
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Propagation Delay</p>
          <p className="text-sm font-mono-tabular text-[var(--text-primary)] mt-1">
            {config.propagationDelayMs} ms
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Duration</p>
          <p className="text-sm font-mono-tabular text-[var(--text-primary)] mt-1">
            {config.simulationDurationSec} s
          </p>
        </div>
      </div>

      {selectedMedia === 'wifi' && (
        <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
          <span className="font-medium text-violet-300">Wi-Fi Parameters:</span>
          <span className="font-mono-tabular">{config.wifiSettings.standard}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono-tabular">{config.wifiSettings.channelConfig}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{config.wifiSettings.propagationModel}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono-tabular">Distance {config.wifiSettings.distanceMeters} m</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono-tabular">Tx Power {config.wifiSettings.txPowerDbm} dBm</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>RTS/CTS {config.wifiSettings.rtsCtsEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      )}
    </section>
  );
};
