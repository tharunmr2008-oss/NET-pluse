import React from 'react';
import {
  DataSourceMode,
  LinkConfiguration,
  MediaId,
  WifiChannelConfig,
  WifiPropagationModel,
  WifiStandard,
} from '../types/network';
import { MEDIA_METADATA, MEDIA_ORDER } from '../utils/calculations';

interface TransmissionMediaModuleProps {
  selectedMedia: MediaId;
  onSelectMedia: (media: MediaId) => void;
  config: LinkConfiguration;
  onUpdateConfig: (next: LinkConfiguration) => void;
  onSyncTrafficAcrossAll: () => void;
  dataSourceMode: DataSourceMode;
}

const WIFI_STANDARDS: WifiStandard[] = ['802.11a', '802.11b', '802.11g', '802.11n', '802.11ac', '802.11ax'];
const WIFI_CHANNELS: WifiChannelConfig[] = [
  '2.4 GHz · 20 MHz',
  '5 GHz · 40 MHz',
  '5 GHz · 80 MHz',
];
const WIFI_PROP_MODELS: WifiPropagationModel[] = [
  'LogDistancePropagationLossModel',
  'FriisPropagationLossModel',
  'NakagamiPropagationLossModel',
];

export const TransmissionMediaModule: React.FC<TransmissionMediaModuleProps> = ({
  selectedMedia,
  onSelectMedia,
  config,
  onUpdateConfig,
  onSyncTrafficAcrossAll,
  dataSourceMode,
}) => {
  const handleNumberChange = (
    field: 'packetCount' | 'packetSizeBytes' | 'bandwidthMbps' | 'propagationDelayMs' | 'simulationDurationSec',
    rawValue: string
  ) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const minMap: Record<typeof field, number> = {
      packetCount: 1,
      packetSizeBytes: 64,
      bandwidthMbps: 0.5,
      propagationDelayMs: 0.01,
      simulationDurationSec: 0.5,
    };
    const clamped = Math.max(minMap[field], parsed);
    onUpdateConfig({
      ...config,
      [field]: clamped,
    });
  };

  const updateWifi = <K extends keyof LinkConfiguration['wifiSettings']>(
    key: K,
    value: LinkConfiguration['wifiSettings'][K]
  ) => {
    onUpdateConfig({
      ...config,
      wifiSettings: {
        ...config.wifiSettings,
        [key]: value,
      },
    });
  };

  const isImportedLocked = dataSourceMode === 'imported';

  const inputClass =
    'w-full rounded-lg border border-cyan-500/25 bg-slate-950/80 px-3 py-2 text-sm font-mono-tabular text-slate-100 disabled:bg-slate-900/50 disabled:text-slate-500 disabled:border-slate-800 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-all';

  return (
    <section
      id="module-media"
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <p className="text-xs font-medium text-cyan-300/80">
            Module 2 · Link Model & Parameters
          </p>
          <h2 className="text-xl font-semibold tracking-tight mt-0.5 heading-gradient">
            Transmission Media
          </h2>
        </div>
        {!isImportedLocked && (
          <button
            type="button"
            onClick={onSyncTrafficAcrossAll}
            className="text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Sync packet count, size & duration to all 3 models
          </button>
        )}
      </div>

      {/* Three Selectable Media Options */}
      <div
        className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3.5"
        role="radiogroup"
        aria-label="Transmission Media Selection"
      >
        {MEDIA_ORDER.map((id) => {
          const meta = MEDIA_METADATA[id];
          const isSelected = selectedMedia === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMedia(id)}
              className={`text-left rounded-xl border p-4 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                isSelected
                  ? 'border-cyan-400/75 bg-cyan-950/35 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
                  : 'border-slate-700/70 bg-slate-950/45 hover:border-cyan-400/40 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  {meta.shortName}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: meta.accentHex,
                    boxShadow: `0 0 10px ${meta.accentHex}`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs font-mono-tabular text-cyan-300/90 mt-1">
                {meta.ns3ChannelClass}
              </p>
              <p className="text-xs text-slate-300/90 mt-2 leading-relaxed">
                {meta.mediumDescription}
              </p>
            </button>
          );
        })}
      </div>

      {isImportedLocked && (
        <div className="mt-4 rounded-xl border border-cyan-500/35 bg-cyan-950/35 px-4 py-3 text-xs text-cyan-200">
          Viewing imported NS-3 simulation parameters. Metric values remain locked to the imported file so actual measurements are never altered. Switch to Demo Mode or Reset to modify simulation parameters interactively.
        </div>
      )}

      {/* Link & Traffic Configuration Controls */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <label className="block">
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Packet Count (pkts)
          </span>
          <input
            type="number"
            min={1}
            step={100}
            disabled={isImportedLocked}
            value={config.packetCount}
            onChange={(e) => handleNumberChange('packetCount', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Packet Size (bytes)
          </span>
          <input
            type="number"
            min={64}
            max={65500}
            step={64}
            disabled={isImportedLocked}
            value={config.packetSizeBytes}
            onChange={(e) => handleNumberChange('packetSizeBytes', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Bandwidth (Mbps)
          </span>
          <input
            type="number"
            min={0.5}
            step={5}
            disabled={isImportedLocked}
            value={config.bandwidthMbps}
            onChange={(e) => handleNumberChange('bandwidthMbps', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Propagation Delay (ms)
          </span>
          <input
            type="number"
            min={0.01}
            step={0.1}
            disabled={isImportedLocked}
            value={config.propagationDelayMs}
            onChange={(e) => handleNumberChange('propagationDelayMs', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Simulation Duration (s)
          </span>
          <input
            type="number"
            min={0.5}
            step={1}
            disabled={isImportedLocked}
            value={config.simulationDurationSec}
            onChange={(e) => handleNumberChange('simulationDurationSec', e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {/* Wi-Fi Specific Configuration */}
      <div className="mt-5 pt-5 border-t border-[var(--border-hairline)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <h3 className="text-sm font-semibold text-slate-100">
            Wi-Fi Model Settings (IEEE 802.11 / YansWifiChannel)
          </h3>
          <span className="text-xs text-slate-400">
            {selectedMedia === 'wifi'
              ? 'Active for Wireless (Wi-Fi) link'
              : 'Select Wireless (Wi-Fi) above to apply these parameters'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              IEEE Standard
            </span>
            <select
              disabled={isImportedLocked}
              value={config.wifiSettings.standard}
              onChange={(e) => updateWifi('standard', e.target.value as WifiStandard)}
              className={inputClass}
            >
              {WIFI_STANDARDS.map((std) => (
                <option key={std} value={std} className="bg-slate-950 text-slate-100">
                  {std}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Frequency & Width
            </span>
            <select
              disabled={isImportedLocked}
              value={config.wifiSettings.channelConfig}
              onChange={(e) => updateWifi('channelConfig', e.target.value as WifiChannelConfig)}
              className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 disabled:bg-slate-900/50 disabled:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-all"
            >
              {WIFI_CHANNELS.map((ch) => (
                <option key={ch} value={ch} className="bg-slate-950 text-slate-100">
                  {ch}
                </option>
              ))}
            </select>
          </label>

          <label className="block lg:col-span-2">
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Propagation Loss Model
            </span>
            <select
              disabled={isImportedLocked}
              value={config.wifiSettings.propagationModel}
              onChange={(e) => updateWifi('propagationModel', e.target.value as WifiPropagationModel)}
              className={inputClass}
            >
              {WIFI_PROP_MODELS.map((model) => (
                <option key={model} value={model} className="bg-slate-950 text-slate-100">
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Distance (m)
            </span>
            <input
              type="number"
              min={1}
              max={500}
              step={5}
              disabled={isImportedLocked}
              value={config.wifiSettings.distanceMeters}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) updateWifi('distanceMeters', Math.max(1, v));
              }}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Tx (dBm)
              </span>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                disabled={isImportedLocked}
                value={config.wifiSettings.txPowerDbm}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) updateWifi('txPowerDbm', Math.max(0, Math.min(30, v)));
                }}
                className={inputClass}
              />
            </label>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-slate-950/80 px-2.5 py-2 cursor-pointer select-none hover:border-cyan-400/50 transition-colors">
                <input
                  type="checkbox"
                  disabled={isImportedLocked}
                  checked={config.wifiSettings.rtsCtsEnabled}
                  onChange={(e) => updateWifi('rtsCtsEnabled', e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <span className="text-xs font-medium text-slate-100 whitespace-nowrap">
                  RTS/CTS
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
