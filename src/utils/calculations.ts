import {
  BestPerformerEntry,
  CalculatedPerformanceMetrics,
  MediaId,
  MediaMetadata,
  RawSimulationRecord,
} from '../types/network';

export const MEDIA_METADATA: Record<MediaId, MediaMetadata> = {
  csma: {
    id: 'csma',
    name: 'Twisted Pair',
    shortName: 'Twisted Pair (CSMA)',
    linkModel: 'CSMA',
    ns3ChannelClass: 'ns3::CsmaChannel',
    ns3DeviceClass: 'ns3::CsmaNetDevice',
    mediumDescription: 'Shared copper Ethernet channel with carrier-sense multiple access and backoff contention.',
    accentHex: '#f59e0b',
  },
  p2p: {
    id: 'p2p',
    name: 'Fiber Optic',
    shortName: 'Fiber Optic (Point-to-Point)',
    linkModel: 'Point-to-Point',
    ns3ChannelClass: 'ns3::PointToPointChannel',
    ns3DeviceClass: 'ns3::PointToPointNetDevice',
    mediumDescription: 'Dedicated full-duplex optical link with zero MAC contention and low attenuation.',
    accentHex: '#22d3ee',
  },
  wifi: {
    id: 'wifi',
    name: 'Wireless',
    shortName: 'Wireless (Wi-Fi)',
    linkModel: 'Wi-Fi',
    ns3ChannelClass: 'ns3::YansWifiChannel',
    ns3DeviceClass: 'ns3::WifiNetDevice',
    mediumDescription: 'IEEE 802.11 RF medium subject to path loss, CSMA/CA DCF overhead, and interference.',
    accentHex: '#a78bfa',
  },
};

export const MEDIA_ORDER: MediaId[] = ['csma', 'p2p', 'wifi'];

export function calculateLostPackets(transmittedPackets: number, receivedPackets: number): number {
  return Math.max(0, transmittedPackets - receivedPackets);
}

/**
 * Packet Loss (%) = ((Transmitted Packets - Received Packets) / Transmitted Packets) * 100
 */
export function calculatePacketLossPercent(transmittedPackets: number, receivedPackets: number): number {
  if (transmittedPackets <= 0) {
    return 0;
  }
  const lost = transmittedPackets - receivedPackets;
  const pct = (lost / transmittedPackets) * 100;
  return Math.max(0, Math.min(100, pct));
}

/**
 * Throughput (Mbps) = (Received Bytes * 8) / (Measurement Duration * 1,000,000)
 */
export function calculateThroughputMbps(receivedBytes: number, measurementDurationSec: number): number {
  if (measurementDurationSec <= 0 || receivedBytes <= 0) {
    return 0;
  }
  return (receivedBytes * 8) / (measurementDurationSec * 1_000_000);
}

export function computePerformanceMetrics(
  record: RawSimulationRecord,
  dataSource: 'demo' | 'imported'
): CalculatedPerformanceMetrics {
  const meta = MEDIA_METADATA[record.mediaId];
  const transmitted = Math.max(0, Math.round(record.transmittedPackets));
  const received = Math.max(0, Math.min(transmitted, Math.round(record.receivedPackets)));
  const lost = calculateLostPackets(transmitted, received);
  const receivedBytes =
    typeof record.receivedBytes === 'number' && record.receivedBytes >= 0
      ? record.receivedBytes
      : received * record.config.packetSizeBytes;

  const duration = record.measurementDurationSec > 0
    ? record.measurementDurationSec
    : record.config.simulationDurationSec;

  const packetLossPercent = calculatePacketLossPercent(transmitted, received);
  const throughputMbps = calculateThroughputMbps(receivedBytes, duration);

  return {
    mediaId: record.mediaId,
    mediaLabel: meta.name,
    linkModelLabel: meta.linkModel,
    ns3ChannelClass: meta.ns3ChannelClass,
    transmittedPackets: transmitted,
    receivedPackets: received,
    lostPackets: lost,
    receivedBytes,
    averageDelayMs: Math.max(0, record.averageDelayMs),
    packetLossPercent,
    throughputMbps,
    measurementDurationSec: duration,
    config: record.config,
    dataSource,
  };
}

export function getBestPerformers(
  metricsMap: Partial<Record<MediaId, CalculatedPerformanceMetrics>>
): BestPerformerEntry[] {
  const available = MEDIA_ORDER
    .map((id) => metricsMap[id])
    .filter((item): item is CalculatedPerformanceMetrics => Boolean(item));

  if (available.length === 0) {
    return [];
  }

  const EPSILON = 1e-6;

  // 1. Delay: Lower is better
  const minDelay = Math.min(...available.map((m) => m.averageDelayMs));
  const delayWinners = available.filter((m) => Math.abs(m.averageDelayMs - minDelay) <= EPSILON);

  // 2. Packet Loss: Lower is better
  const minLoss = Math.min(...available.map((m) => m.packetLossPercent));
  const lossWinners = available.filter((m) => Math.abs(m.packetLossPercent - minLoss) <= EPSILON);

  // 3. Throughput: Higher is better
  const maxThroughput = Math.max(...available.map((m) => m.throughputMbps));
  const throughputWinners = available.filter((m) => Math.abs(m.throughputMbps - maxThroughput) <= EPSILON);

  return [
    {
      metric: 'delay',
      metricLabel: 'End-to-End Delay',
      ruleLabel: 'Lower delay is better',
      winnerIds: delayWinners.map((w) => w.mediaId),
      winnerNames: delayWinners.map((w) => MEDIA_METADATA[w.mediaId].shortName),
      formattedValue: `${minDelay.toFixed(3)} ms`,
    },
    {
      metric: 'loss',
      metricLabel: 'Packet Loss',
      ruleLabel: 'Lower packet loss is better',
      winnerIds: lossWinners.map((w) => w.mediaId),
      winnerNames: lossWinners.map((w) => MEDIA_METADATA[w.mediaId].shortName),
      formattedValue: `${minLoss.toFixed(2)}%`,
    },
    {
      metric: 'throughput',
      metricLabel: 'Throughput',
      ruleLabel: 'Higher throughput is better',
      winnerIds: throughputWinners.map((w) => w.mediaId),
      winnerNames: throughputWinners.map((w) => MEDIA_METADATA[w.mediaId].shortName),
      formattedValue: `${maxThroughput.toFixed(3)} Mbps`,
    },
  ];
}
