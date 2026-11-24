import {
  CalculatedPerformanceMetrics,
  ImportValidationResult,
  LinkConfiguration,
  MediaId,
  RawSimulationRecord,
  WifiChannelConfig,
  WifiPropagationModel,
  WifiStandard,
} from '../types/network';
import { MEDIA_METADATA, MEDIA_ORDER, getBestPerformers } from './calculations';
import { DEFAULT_CONFIGS, DEFAULT_WIFI_SETTINGS } from './demoData';

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s\-]+/g, '_');
}

function parseMediaId(rawValue: unknown): MediaId | null {
  if (typeof rawValue !== 'string') return null;
  const v = rawValue.trim().toLowerCase();
  if (
    v === 'csma' ||
    v === 'twisted_pair' ||
    v === 'twisted pair' ||
    v === 'twisted pair (csma)' ||
    v === 'ns3::csmachannel'
  ) {
    return 'csma';
  }
  if (
    v === 'p2p' ||
    v === 'point-to-point' ||
    v === 'point_to_point' ||
    v === 'fiber' ||
    v === 'fiber optic' ||
    v === 'fiber optic (point-to-point)' ||
    v === 'ns3::pointtopointchannel'
  ) {
    return 'p2p';
  }
  if (
    v === 'wifi' ||
    v === 'wi-fi' ||
    v === 'wireless' ||
    v === 'wireless (wi-fi)' ||
    v === 'ns3::yanswifichannel'
  ) {
    return 'wifi';
  }
  return null;
}

function toFiniteNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseWifiStandard(val: unknown): WifiStandard {
  const valid: WifiStandard[] = ['802.11a', '802.11b', '802.11g', '802.11n', '802.11ac', '802.11ax'];
  if (typeof val === 'string' && valid.includes(val.trim() as WifiStandard)) {
    return val.trim() as WifiStandard;
  }
  return DEFAULT_WIFI_SETTINGS.standard;
}

function parseWifiChannel(val: unknown): WifiChannelConfig {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes('2.4')) return '2.4 GHz · 20 MHz';
    if (trimmed.includes('80')) return '5 GHz · 80 MHz';
    if (trimmed.includes('40') || trimmed.includes('5')) return '5 GHz · 40 MHz';
  }
  return DEFAULT_WIFI_SETTINGS.channelConfig;
}

function parseWifiPropModel(val: unknown): WifiPropagationModel {
  const valid: WifiPropagationModel[] = [
    'LogDistancePropagationLossModel',
    'FriisPropagationLossModel',
    'NakagamiPropagationLossModel',
  ];
  if (typeof val === 'string') {
    const found = valid.find((m) => m.toLowerCase() === val.trim().toLowerCase());
    if (found) return found;
  }
  return DEFAULT_WIFI_SETTINGS.propagationModel;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function validateAndBuildRecord(
  obj: Record<string, unknown>,
  rowLabel: string,
  errors: string[],
  warnings: string[]
): RawSimulationRecord | null {
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    normalized[normalizeKey(k)] = v;
  }

  const rawMedia =
    normalized.media ??
    normalized.media_id ??
    normalized.model ??
    normalized.link_model ??
    normalized.transmission_media;

  const mediaId = parseMediaId(rawMedia);
  if (!mediaId) {
    errors.push(
      `${rowLabel}: Unrecognized or missing transmission media "${String(rawMedia ?? '')}". Expected csma, p2p, or wifi.`
    );
    return null;
  }

  const transmittedPackets = toFiniteNumber(
    normalized.transmitted_packets ?? normalized.tx_packets ?? normalized.transmitted ?? normalized.packet_count
  );
  const receivedPackets = toFiniteNumber(
    normalized.received_packets ?? normalized.rx_packets ?? normalized.received
  );
  const averageDelayMs = toFiniteNumber(
    normalized.average_delay_ms ?? normalized.avg_delay_ms ?? normalized.delay_ms ?? normalized.mean_delay_ms
  );
  const measurementDurationSec = toFiniteNumber(
    normalized.measurement_duration_sec ??
      normalized.simulation_duration_sec ??
      normalized.duration_sec ??
      normalized.duration
  );

  if (transmittedPackets === null || transmittedPackets <= 0) {
    errors.push(`${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): transmitted_packets must be a positive number.`);
    return null;
  }
  if (receivedPackets === null || receivedPackets < 0) {
    errors.push(`${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): received_packets must be a non-negative number.`);
    return null;
  }
  if (receivedPackets > transmittedPackets) {
    errors.push(
      `${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): received_packets (${receivedPackets}) cannot exceed transmitted_packets (${transmittedPackets}).`
    );
    return null;
  }
  if (averageDelayMs === null || averageDelayMs < 0) {
    errors.push(`${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): average_delay_ms must be >= 0.`);
    return null;
  }

  const defaults = DEFAULT_CONFIGS[mediaId];
  const packetSizeBytes =
    toFiniteNumber(normalized.packet_size_bytes ?? normalized.packet_size) ?? defaults.packetSizeBytes;
  if (packetSizeBytes <= 0) {
    errors.push(`${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): packet_size_bytes must be positive.`);
    return null;
  }

  const resolvedDuration =
    measurementDurationSec !== null && measurementDurationSec > 0
      ? measurementDurationSec
      : defaults.simulationDurationSec;

  if (measurementDurationSec === null) {
    warnings.push(
      `${rowLabel} (${MEDIA_METADATA[mediaId].shortName}): measurement_duration_sec missing; defaulted to ${defaults.simulationDurationSec}s.`
    );
  }

  const receivedBytes = toFiniteNumber(normalized.received_bytes ?? normalized.rx_bytes);
  const bandwidthMbps = toFiniteNumber(normalized.bandwidth_mbps ?? normalized.data_rate_mbps) ?? defaults.bandwidthMbps;
  const propagationDelayMs =
    toFiniteNumber(normalized.propagation_delay_ms ?? normalized.prop_delay_ms) ?? defaults.propagationDelayMs;

  const config: LinkConfiguration = {
    packetCount: Math.round(toFiniteNumber(normalized.packet_count) ?? transmittedPackets),
    packetSizeBytes: Math.round(packetSizeBytes),
    bandwidthMbps: bandwidthMbps > 0 ? bandwidthMbps : defaults.bandwidthMbps,
    propagationDelayMs: propagationDelayMs >= 0 ? propagationDelayMs : defaults.propagationDelayMs,
    simulationDurationSec: resolvedDuration,
    wifiSettings: {
      standard: parseWifiStandard(normalized.wifi_standard),
      channelConfig: parseWifiChannel(normalized.wifi_channel),
      propagationModel: parseWifiPropModel(normalized.wifi_propagation_model),
      distanceMeters: toFiniteNumber(normalized.wifi_distance_m) ?? DEFAULT_WIFI_SETTINGS.distanceMeters,
      txPowerDbm: toFiniteNumber(normalized.wifi_tx_power_dbm) ?? DEFAULT_WIFI_SETTINGS.txPowerDbm,
      rtsCtsEnabled:
        typeof normalized.wifi_rts_cts === 'boolean'
          ? normalized.wifi_rts_cts
          : String(normalized.wifi_rts_cts ?? '').toLowerCase() === 'true',
    },
  };

  return {
    mediaId,
    transmittedPackets: Math.round(transmittedPackets),
    receivedPackets: Math.round(receivedPackets),
    receivedBytes: receivedBytes !== null && receivedBytes >= 0 ? receivedBytes : undefined,
    averageDelayMs,
    measurementDurationSec: resolvedDuration,
    config,
  };
}

export function parseAndValidateNs3File(
  fileName: string,
  content: string
): ImportValidationResult {
  const lower = fileName.toLowerCase();
  const format: 'csv' | 'json' = lower.endsWith('.json') ? 'json' : 'csv';
  const errors: string[] = [];
  const warnings: string[] = [];
  const records: Partial<Record<MediaId, RawSimulationRecord>> = {};

  if (!content.trim()) {
    return {
      ok: false,
      records: {},
      errors: ['The uploaded file is empty.'],
      warnings: [],
      fileName,
      format,
    };
  }

  if (format === 'json') {
    try {
      const parsed = JSON.parse(content) as unknown;
      let items: Array<{ rowLabel: string; obj: Record<string, unknown> }> = [];

      if (Array.isArray(parsed)) {
        items = parsed
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((obj, idx) => ({ rowLabel: `Entry #${idx + 1}`, obj }));
      } else if (parsed && typeof parsed === 'object') {
        const container = parsed as Record<string, unknown>;
        const listCandidate = container.results ?? container.models ?? container.simulations;
        if (Array.isArray(listCandidate)) {
          items = listCandidate
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
            .map((obj, idx) => ({ rowLabel: `Entry #${idx + 1}`, obj }));
        } else {
          // Support object keyed by mediaId: { csma: {...}, p2p: {...}, wifi: {...} }
          for (const [k, v] of Object.entries(container)) {
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              const obj = { media: k, ...(v as Record<string, unknown>) };
              items.push({ rowLabel: `Key "${k}"`, obj });
            }
          }
        }
      }

      if (items.length === 0) {
        errors.push('JSON must contain an array of simulation objects or a "results" array.');
      } else {
        for (const item of items) {
          const rec = validateAndBuildRecord(item.obj, item.rowLabel, errors, warnings);
          if (rec) {
            if (records[rec.mediaId]) {
              warnings.push(`Duplicate entry for ${MEDIA_METADATA[rec.mediaId].shortName}; kept latest row.`);
            }
            records[rec.mediaId] = rec;
          }
        }
      }
    } catch {
      errors.push('Invalid JSON syntax. Please check commas, quotes, and brackets.');
    }
  } else {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    if (lines.length < 2) {
      errors.push('CSV file must include a header row and at least one data row.');
    } else {
      const headers = parseCsvLine(lines[0]);
      for (let rowIdx = 1; rowIdx < lines.length; rowIdx += 1) {
        const values = parseCsvLine(lines[rowIdx]);
        if (values.length !== headers.length) {
          errors.push(
            `Row ${rowIdx + 1}: Expected ${headers.length} columns but found ${values.length}.`
          );
          continue;
        }
        const rowObj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          rowObj[h] = values[i];
        });
        const rec = validateAndBuildRecord(rowObj, `Row ${rowIdx + 1}`, errors, warnings);
        if (rec) {
          if (records[rec.mediaId]) {
            warnings.push(`Duplicate entry for ${MEDIA_METADATA[rec.mediaId].shortName}; kept latest row.`);
          }
          records[rec.mediaId] = rec;
        }
      }
    }
  }

  const importedCount = Object.keys(records).length;
  if (importedCount === 0 && errors.length === 0) {
    errors.push('No valid CSMA, Point-to-Point, or Wi-Fi simulation records were found.');
  }

  return {
    ok: errors.length === 0 && importedCount > 0,
    records,
    errors,
    warnings,
    fileName,
    format,
  };
}

export function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadSampleNs3Csv(): void {
  const csv = [
    'media,transmitted_packets,received_packets,packet_size_bytes,received_bytes,average_delay_ms,measurement_duration_sec,bandwidth_mbps,propagation_delay_ms,wifi_standard,wifi_channel,wifi_propagation_model,wifi_distance_m,wifi_tx_power_dbm',
    'csma,5000,4918,1024,5036032,4.820,10,100,1.5,,,,,',
    'p2p,5000,4997,1024,5116928,0.615,10,1000,0.4,,,,,',
    'wifi,5000,4685,1024,4797440,12.440,10,65,2.2,802.11n,5 GHz · 40 MHz,LogDistancePropagationLossModel,35,16',
  ].join('\n');
  triggerDownload('ns3_sample_results.csv', csv, 'text/csv;charset=utf-8;');
}

export function downloadSampleNs3Json(): void {
  const payload = {
    source: 'NS-3 FlowMonitor Export Template',
    results: [
      {
        media: 'csma',
        transmitted_packets: 5000,
        received_packets: 4918,
        packet_size_bytes: 1024,
        received_bytes: 5036032,
        average_delay_ms: 4.82,
        measurement_duration_sec: 10,
        bandwidth_mbps: 100,
        propagation_delay_ms: 1.5,
      },
      {
        media: 'p2p',
        transmitted_packets: 5000,
        received_packets: 4997,
        packet_size_bytes: 1024,
        received_bytes: 5116928,
        average_delay_ms: 0.615,
        measurement_duration_sec: 10,
        bandwidth_mbps: 1000,
        propagation_delay_ms: 0.4,
      },
      {
        media: 'wifi',
        transmitted_packets: 5000,
        received_packets: 4685,
        packet_size_bytes: 1024,
        received_bytes: 4797440,
        average_delay_ms: 12.44,
        measurement_duration_sec: 10,
        bandwidth_mbps: 65,
        propagation_delay_ms: 2.2,
        wifi_standard: '802.11n',
        wifi_channel: '5 GHz · 40 MHz',
        wifi_propagation_model: 'LogDistancePropagationLossModel',
        wifi_distance_m: 35,
        wifi_tx_power_dbm: 16,
      },
    ],
  };
  triggerDownload('ns3_sample_results.json', JSON.stringify(payload, null, 2), 'application/json');
}

export function exportComparisonCsv(
  metricsMap: Partial<Record<MediaId, CalculatedPerformanceMetrics>>,
  dataSourceLabel: string
): void {
  const rows: string[] = [];
  rows.push(`# Provenance,${dataSourceLabel}`);
  rows.push(
    [
      'Transmission Media',
      'Link Model',
      'NS-3 Channel Class',
      'Transmitted Packets',
      'Received Packets',
      'Lost Packets',
      'Packet Size (Bytes)',
      'Received Bytes',
      'Bandwidth (Mbps)',
      'Propagation Delay (ms)',
      'Measurement Duration (s)',
      'Average Delay (ms)',
      'Packet Loss (%)',
      'Throughput (Mbps)',
      'Data Source',
    ].join(',')
  );

  for (const id of MEDIA_ORDER) {
    const m = metricsMap[id];
    if (!m) continue;
    rows.push(
      [
        `"${m.mediaLabel}"`,
        `"${m.linkModelLabel}"`,
        `"${m.ns3ChannelClass}"`,
        m.transmittedPackets,
        m.receivedPackets,
        m.lostPackets,
        m.config.packetSizeBytes,
        m.receivedBytes,
        m.config.bandwidthMbps,
        m.config.propagationDelayMs,
        m.measurementDurationSec,
        m.averageDelayMs.toFixed(3),
        m.packetLossPercent.toFixed(2),
        m.throughputMbps.toFixed(4),
        `"${m.dataSource === 'demo' ? 'ILLUSTRATIVE DATA - NOT ACTUAL NS-3 RESULTS' : 'IMPORTED NS-3 SIMULATION DATA'}"`,
      ].join(',')
    );
  }

  const best = getBestPerformers(metricsMap);
  if (best.length > 0) {
    rows.push('');
    rows.push('Best Performer Summary,Winner(s),Value,Criterion');
    for (const entry of best) {
      rows.push(
        `"${entry.metricLabel}","${entry.winnerNames.join(' & ')}","${entry.formattedValue}","${entry.ruleLabel}"`
      );
    }
  }

  triggerDownload('ns3_comparison_results.csv', rows.join('\n'), 'text/csv;charset=utf-8;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function downloadPerformanceReport(
  metricsMap: Partial<Record<MediaId, CalculatedPerformanceMetrics>>,
  dataSourceLabel: string,
  isDemo: boolean
): void {
  const rows = MEDIA_ORDER.map((id) => metricsMap[id]).filter(
    (item): item is CalculatedPerformanceMetrics => Boolean(item)
  );
  if (rows.length === 0) return;

  const best = getBestPerformers(metricsMap);
  const generatedAt = new Date().toLocaleString();

  const buildSvgBars = (
    title: string,
    unit: string,
    getter: (m: CalculatedPerformanceMetrics) => number,
    decimals: number,
    criterion: string
  ) => {
    const maxVal = Math.max(...rows.map(getter), 0.001);
    const barRows = rows
      .map((m, idx) => {
        const val = getter(m);
        const widthPct = Math.max(4, Math.round((val / maxVal) * 260));
        const y = 18 + idx * 38;
        const color = MEDIA_METADATA[m.mediaId].accentHex;
        return `
          <text x="0" y="${y + 15}" font-size="12" fill="#1e293b" font-family="sans-serif">${escapeHtml(m.mediaLabel)}</text>
          <rect x="115" y="${y}" width="${widthPct}" height="20" rx="4" fill="${color}" />
          <text x="${123 + widthPct}" y="${y + 15}" font-size="12" font-weight="600" fill="#0f172a" font-family="monospace">${val.toFixed(decimals)} ${escapeHtml(unit)}</text>
        `;
      })
      .join('');

    return `
      <div class="chart-box">
        <div class="chart-head">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(criterion)}</span>
        </div>
        <svg viewBox="0 0 470 ${28 + rows.length * 38}" width="100%" role="img" aria-label="${escapeHtml(title)}">
          ${barRows}
        </svg>
      </div>
    `;
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NetPulse NS-3 Performance Comparison Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; line-height: 1.5; }
    .container { max-width: 980px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; gap: 16px; }
    .brand { font-size: 13px; font-weight: 700; color: #0369a1; letter-spacing: 0.04em; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 6px 0 4px; color: #0f172a; }
    .meta { font-size: 12px; color: #475569; }
    .provenance { margin: 18px 0; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; ${
      isDemo
        ? 'background: #fffbeb; border: 1px solid #fcd34d; color: #92400e;'
        : 'background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;'
    } }
    h2 { font-size: 16px; margin: 26px 0 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .kpi-label { font-size: 12px; color: #475569; }
    .kpi-winner { font-size: 15px; font-weight: 700; margin-top: 6px; color: #0f172a; }
    .kpi-val { font-family: monospace; font-size: 14px; font-weight: 600; color: #0369a1; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12.5px; }
    th, td { border: 1px solid #e2e8f0; padding: 9px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    td.num, th.num { text-align: right; font-family: monospace; }
    .charts-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 12px; }
    .chart-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #ffffff; }
    .chart-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #334155; }
    .formulas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px; }
    .formula-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; font-family: monospace; }
    .print-note { margin-top: 24px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    @media print { body { background: #fff; padding: 0; } .container { border: none; padding: 12px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">NetPulse · Computer Networks Capstone Report</div>
        <h1>Impact of Transmission Media on Delay, Loss and Throughput Using Different Link Models (NS-3)</h1>
        <div class="meta">Twisted Pair (CSMA) · Fiber Optic (Point-to-Point) · Wireless (Wi-Fi)</div>
      </div>
      <div class="meta" style="text-align:right; white-space:nowrap;">
        Generated:<br /><strong>${escapeHtml(generatedAt)}</strong>
      </div>
    </div>

    <div class="provenance">
      Data Source: ${escapeHtml(dataSourceLabel)}
    </div>

    <h2>1. Metric-Wise Best Performers</h2>
    <div class="kpi-grid">
      ${best
        .map(
          (b) => `
        <div class="kpi">
          <div class="kpi-label">${escapeHtml(b.metricLabel)} (${escapeHtml(b.ruleLabel)})</div>
          <div class="kpi-winner">${escapeHtml(b.winnerNames.join(' & '))}</div>
          <div class="kpi-val">${escapeHtml(b.formattedValue)}</div>
        </div>`
        )
        .join('')}
    </div>

    <h2>2. Performance Comparison Table</h2>
    <table>
      <thead>
        <tr>
          <th>Transmission Media</th>
          <th>NS-3 Link Model</th>
          <th class="num">Tx Pkts</th>
          <th class="num">Rx Pkts</th>
          <th class="num">Lost</th>
          <th class="num">Bandwidth</th>
          <th class="num">Duration</th>
          <th class="num">Avg Delay</th>
          <th class="num">Packet Loss</th>
          <th class="num">Throughput</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td><strong>${escapeHtml(r.mediaLabel)}</strong></td>
            <td>${escapeHtml(r.linkModelLabel)} (${escapeHtml(r.ns3ChannelClass)})</td>
            <td class="num">${r.transmittedPackets.toLocaleString()}</td>
            <td class="num">${r.receivedPackets.toLocaleString()}</td>
            <td class="num">${r.lostPackets.toLocaleString()}</td>
            <td class="num">${r.config.bandwidthMbps} Mbps</td>
            <td class="num">${r.measurementDurationSec} s</td>
            <td class="num">${r.averageDelayMs.toFixed(3)} ms</td>
            <td class="num">${r.packetLossPercent.toFixed(2)}%</td>
            <td class="num"><strong>${r.throughputMbps.toFixed(3)} Mbps</strong></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>3. Visual Comparison Charts</h2>
    <div class="charts-grid">
      ${buildSvgBars('End-to-End Average Delay', 'ms', (m) => m.averageDelayMs, 3, 'Lower is better')}
      ${buildSvgBars('Packet Loss Percentage', '%', (m) => m.packetLossPercent, 2, 'Lower is better')}
      ${buildSvgBars('Measured Throughput', 'Mbps', (m) => m.throughputMbps, 3, 'Higher is better')}
    </div>

    <h2>4. Calculation Formulas</h2>
    <div class="formulas">
      <div class="formula-card">
        <strong>Packet Loss (%)</strong><br />
        ((Transmitted Packets - Received Packets) / Transmitted Packets) × 100
      </div>
      <div class="formula-card">
        <strong>Throughput (Mbps)</strong><br />
        (Received Bytes × 8) / (Measurement Duration × 1,000,000)
      </div>
    </div>

    <div class="print-note">
      <span>Generated by NetPulse NS-3 Link Performance Analyzer</span>
      <span>Tip: Open in any browser and use Print → Save as PDF for submission.</span>
    </div>
  </div>
</body>
</html>`;

  triggerDownload('netpulse_performance_report.html', html, 'text/html;charset=utf-8;');
}

