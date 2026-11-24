import { LinkConfiguration, MediaId, RawSimulationRecord, WifiSettings } from '../types/network';

export const DEFAULT_WIFI_SETTINGS: WifiSettings = {
  standard: '802.11n',
  channelConfig: '5 GHz · 40 MHz',
  propagationModel: 'LogDistancePropagationLossModel',
  distanceMeters: 35,
  txPowerDbm: 16,
  rtsCtsEnabled: false,
};

export const DEFAULT_CONFIGS: Record<MediaId, LinkConfiguration> = {
  csma: {
    packetCount: 5000,
    packetSizeBytes: 1024,
    bandwidthMbps: 100,
    propagationDelayMs: 1.5,
    simulationDurationSec: 10,
    wifiSettings: { ...DEFAULT_WIFI_SETTINGS },
  },
  p2p: {
    packetCount: 5000,
    packetSizeBytes: 1024,
    bandwidthMbps: 1000,
    propagationDelayMs: 0.4,
    simulationDurationSec: 10,
    wifiSettings: { ...DEFAULT_WIFI_SETTINGS },
  },
  wifi: {
    packetCount: 5000,
    packetSizeBytes: 1024,
    bandwidthMbps: 65,
    propagationDelayMs: 2.2,
    simulationDurationSec: 10,
    wifiSettings: { ...DEFAULT_WIFI_SETTINGS },
  },
};

export function cloneDefaultConfigs(): Record<MediaId, LinkConfiguration> {
  return {
    csma: { ...DEFAULT_CONFIGS.csma, wifiSettings: { ...DEFAULT_WIFI_SETTINGS } },
    p2p: { ...DEFAULT_CONFIGS.p2p, wifiSettings: { ...DEFAULT_WIFI_SETTINGS } },
    wifi: { ...DEFAULT_CONFIGS.wifi, wifiSettings: { ...DEFAULT_WIFI_SETTINGS } },
  };
}

/**
 * Generates ILLUSTRATIVE sample data (NOT actual NS-3 results) for Demo Mode.
 * Reflects configurable inputs so students can demonstrate workflow & formula behavior.
 */
export function generateIllustrativeRecord(
  mediaId: MediaId,
  config: LinkConfiguration
): RawSimulationRecord {
  const packetCount = Math.max(1, Math.round(config.packetCount));
  const packetSizeBytes = Math.max(64, Math.round(config.packetSizeBytes));
  const bandwidthMbps = Math.max(0.5, config.bandwidthMbps);
  const propagationDelayMs = Math.max(0.01, config.propagationDelayMs);
  const durationSec = Math.max(0.1, config.simulationDurationSec);

  // Offered load in Mbps
  const offeredLoadMbps = (packetCount * packetSizeBytes * 8) / (durationSec * 1_000_000);
  const serializationDelayMs = (packetSizeBytes * 8) / (bandwidthMbps * 1000);

  if (mediaId === 'p2p') {
    // Fiber Optic (Point-to-Point): dedicated link, minimal queuing/loss unless offered load exceeds bandwidth
    const utilization = offeredLoadMbps / bandwidthMbps;
    const congestionLossRatio = utilization > 0.96 ? Math.min(0.35, (utilization - 0.96) * 0.65) : 0.0012;
    const received = Math.max(0, Math.min(packetCount, Math.round(packetCount * (1 - congestionLossRatio))));
    const queuingMs = utilization > 0.85 ? (utilization - 0.85) * 4.2 : utilization * 0.35;
    const avgDelayMs = Number((propagationDelayMs + serializationDelayMs + queuingMs).toFixed(3));

    return {
      mediaId,
      transmittedPackets: packetCount,
      receivedPackets: received,
      receivedBytes: received * packetSizeBytes,
      averageDelayMs: avgDelayMs,
      measurementDurationSec: durationSec,
      config,
    };
  }

  if (mediaId === 'csma') {
    // Twisted Pair (CSMA): Ethernet framing & shared-medium backoff contention
    const effectiveCapacity = bandwidthMbps * 0.86;
    const utilization = offeredLoadMbps / effectiveCapacity;
    const baseLoss = 0.014;
    const contentionLoss = utilization > 0.72 ? Math.min(0.45, (utilization - 0.72) * 0.55) : utilization * 0.018;
    const totalLossRatio = Math.min(0.65, baseLoss + contentionLoss);
    const received = Math.max(0, Math.min(packetCount, Math.round(packetCount * (1 - totalLossRatio))));
    const backoffDelayMs = 1.65 + utilization * 3.8;
    const avgDelayMs = Number((propagationDelayMs + serializationDelayMs + backoffDelayMs).toFixed(3));

    return {
      mediaId,
      transmittedPackets: packetCount,
      receivedPackets: received,
      receivedBytes: received * packetSizeBytes,
      averageDelayMs: avgDelayMs,
      measurementDurationSec: durationSec,
      config,
    };
  }

  // Wireless (Wi-Fi): affected by IEEE 802.11 standard, distance, Tx power, RTS/CTS, and MAC DCF overhead
  const { standard, distanceMeters, txPowerDbm, propagationModel, rtsCtsEnabled } = config.wifiSettings;
  const standardEfficiency: Record<WifiSettings['standard'], number> = {
    '802.11b': 0.48,
    '802.11a': 0.56,
    '802.11g': 0.58,
    '802.11n': 0.68,
    '802.11ac': 0.74,
    '802.11ax': 0.79,
  };
  const modelPenalty: Record<WifiSettings['propagationModel'], number> = {
    FriisPropagationLossModel: 0.01,
    LogDistancePropagationLossModel: 0.025,
    NakagamiPropagationLossModel: 0.045,
  };

  const distanceFactor = Math.max(0, (distanceMeters - 10) / 140);
  const powerRelief = Math.max(-0.02, (txPowerDbm - 16) * 0.004);
  const effectiveCapacity = bandwidthMbps * standardEfficiency[standard];
  const utilization = offeredLoadMbps / Math.max(1, effectiveCapacity);

  const rawLossRatio =
    0.028 +
    modelPenalty[propagationModel] +
    distanceFactor * 0.14 -
    powerRelief +
    (utilization > 0.65 ? (utilization - 0.65) * 0.45 : utilization * 0.03) -
    (rtsCtsEnabled ? 0.008 : 0);

  const clampedLoss = Math.max(0.01, Math.min(0.75, rawLossRatio));
  const received = Math.max(0, Math.min(packetCount, Math.round(packetCount * (1 - clampedLoss))));

  const dcfOverheadMs = 4.2 + distanceFactor * 5.8 + (rtsCtsEnabled ? 1.1 : 0) + utilization * 7.4;
  const avgDelayMs = Number((propagationDelayMs + serializationDelayMs + dcfOverheadMs).toFixed(3));

  return {
    mediaId,
    transmittedPackets: packetCount,
    receivedPackets: received,
    receivedBytes: received * packetSizeBytes,
    averageDelayMs: avgDelayMs,
    measurementDurationSec: durationSec,
    config,
  };
}

export function generateAllIllustrativeRecords(
  configs: Record<MediaId, LinkConfiguration>
): Record<MediaId, RawSimulationRecord> {
  return {
    csma: generateIllustrativeRecord('csma', configs.csma),
    p2p: generateIllustrativeRecord('p2p', configs.p2p),
    wifi: generateIllustrativeRecord('wifi', configs.wifi),
  };
}
