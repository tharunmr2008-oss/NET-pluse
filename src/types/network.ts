export type MediaId = 'csma' | 'p2p' | 'wifi';

export type DataSourceMode = 'empty' | 'demo' | 'imported';

export type WifiStandard = '802.11a' | '802.11b' | '802.11g' | '802.11n' | '802.11ac' | '802.11ax';

export type WifiChannelConfig =
  | '2.4 GHz · 20 MHz'
  | '5 GHz · 40 MHz'
  | '5 GHz · 80 MHz';

export type WifiPropagationModel =
  | 'LogDistancePropagationLossModel'
  | 'FriisPropagationLossModel'
  | 'NakagamiPropagationLossModel';

export interface WifiSettings {
  standard: WifiStandard;
  channelConfig: WifiChannelConfig;
  propagationModel: WifiPropagationModel;
  distanceMeters: number;
  txPowerDbm: number;
  rtsCtsEnabled: boolean;
}

export interface LinkConfiguration {
  packetCount: number;
  packetSizeBytes: number;
  bandwidthMbps: number;
  propagationDelayMs: number;
  simulationDurationSec: number;
  wifiSettings: WifiSettings;
}

export interface RawSimulationRecord {
  mediaId: MediaId;
  transmittedPackets: number;
  receivedPackets: number;
  receivedBytes?: number;
  averageDelayMs: number;
  measurementDurationSec: number;
  config: LinkConfiguration;
}

export interface CalculatedPerformanceMetrics {
  mediaId: MediaId;
  mediaLabel: string;
  linkModelLabel: string;
  ns3ChannelClass: string;
  transmittedPackets: number;
  receivedPackets: number;
  lostPackets: number;
  receivedBytes: number;
  averageDelayMs: number;
  packetLossPercent: number;
  throughputMbps: number;
  measurementDurationSec: number;
  config: LinkConfiguration;
  dataSource: Exclude<DataSourceMode, 'empty'>;
}

export interface MediaMetadata {
  id: MediaId;
  name: string;
  shortName: string;
  linkModel: string;
  ns3ChannelClass: string;
  ns3DeviceClass: string;
  mediumDescription: string;
  accentHex: string;
}

export interface BestPerformerEntry {
  metric: 'delay' | 'loss' | 'throughput';
  metricLabel: string;
  ruleLabel: string;
  winnerIds: MediaId[];
  winnerNames: string[];
  formattedValue: string;
}

export interface ImportValidationResult {
  ok: boolean;
  records: Partial<Record<MediaId, RawSimulationRecord>>;
  errors: string[];
  warnings: string[];
  fileName: string;
  format: 'csv' | 'json';
}
