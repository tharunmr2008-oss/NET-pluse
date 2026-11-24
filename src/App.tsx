import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  PlayCircle,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  CalculatedPerformanceMetrics,
  DataSourceMode,
  ImportValidationResult,
  LinkConfiguration,
  MediaId,
  RawSimulationRecord,
} from './types/network';
import { computePerformanceMetrics, MEDIA_ORDER } from './utils/calculations';
import {
  cloneDefaultConfigs,
  generateAllIllustrativeRecords,
} from './utils/demoData';
import {
  downloadPerformanceReport,
  exportComparisonCsv,
} from './utils/fileHandlers';
import Antigravity from './components/Antigravity';
import { LandingIntro } from './components/LandingIntro';
import { TopologyModule } from './components/TopologyModule';
import { TransmissionMediaModule } from './components/TransmissionMediaModule';
import { PerformanceModule } from './components/PerformanceModule';
import { ComparisonModule } from './components/ComparisonModule';
import { ImportModal } from './components/ImportModal';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaId>('csma');
  const [configs, setConfigs] = useState<Record<MediaId, LinkConfiguration>>(() =>
    cloneDefaultConfigs()
  );
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('demo');
  const [importedRecords, setImportedRecords] = useState<
    Partial<Record<MediaId, RawSimulationRecord>>
  >({});
  const [importedMeta, setImportedMeta] = useState<{
    fileName: string;
    warnings: string[];
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activeConfig = configs[selectedMedia];

  const calculatedMetrics = useMemo<
    Partial<Record<MediaId, CalculatedPerformanceMetrics>>
  >(() => {
    if (dataSourceMode === 'empty') {
      return {};
    }

    if (dataSourceMode === 'demo') {
      const demoRaw = generateAllIllustrativeRecords(configs);
      return {
        csma: computePerformanceMetrics(demoRaw.csma, 'demo'),
        p2p: computePerformanceMetrics(demoRaw.p2p, 'demo'),
        wifi: computePerformanceMetrics(demoRaw.wifi, 'demo'),
      };
    }

    const result: Partial<Record<MediaId, CalculatedPerformanceMetrics>> = {};
    for (const id of MEDIA_ORDER) {
      const rec = importedRecords[id];
      if (rec) {
        result[id] = computePerformanceMetrics(rec, 'imported');
      }
    }
    return result;
  }, [configs, dataSourceMode, importedRecords]);

  const handleUpdateConfig = (nextConfig: LinkConfiguration) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedMedia]: nextConfig,
    }));
  };

  const handleSyncTrafficAcrossAll = () => {
    const source = configs[selectedMedia];
    setConfigs((prev) => ({
      csma: {
        ...prev.csma,
        packetCount: source.packetCount,
        packetSizeBytes: source.packetSizeBytes,
        simulationDurationSec: source.simulationDurationSec,
      },
      p2p: {
        ...prev.p2p,
        packetCount: source.packetCount,
        packetSizeBytes: source.packetSizeBytes,
        simulationDurationSec: source.simulationDurationSec,
      },
      wifi: {
        ...prev.wifi,
        packetCount: source.packetCount,
        packetSizeBytes: source.packetSizeBytes,
        simulationDurationSec: source.simulationDurationSec,
      },
    }));
  };

  const handleEnableDemoMode = () => {
    setDataSourceMode('demo');
    setImportedMeta(null);
  };

  const handleImportSuccess = (result: ImportValidationResult) => {
    const nextConfigs = cloneDefaultConfigs();
    let firstImportedMedia: MediaId | null = null;

    for (const id of MEDIA_ORDER) {
      const rec = result.records[id];
      if (rec) {
        nextConfigs[id] = rec.config;
        if (!firstImportedMedia) {
          firstImportedMedia = id;
        }
      }
    }

    setConfigs(nextConfigs);
    setImportedRecords(result.records);
    setImportedMeta({
      fileName: result.fileName,
      warnings: result.warnings,
    });
    setDataSourceMode('imported');
    if (firstImportedMedia && !result.records[selectedMedia]) {
      setSelectedMedia(firstImportedMedia);
    }
    setIsImportModalOpen(false);
  };

  const handleExportCsv = () => {
    const provenance =
      dataSourceMode === 'demo'
        ? 'ILLUSTRATIVE DATA - NOT ACTUAL NS-3 RESULTS'
        : `IMPORTED NS-3 SIMULATION DATA (${importedMeta?.fileName ?? 'unknown file'})`;
    exportComparisonCsv(calculatedMetrics, provenance);
  };

  const handleDownloadReport = () => {
    const provenance =
      dataSourceMode === 'demo'
        ? 'ILLUSTRATIVE DATA – NOT ACTUAL NS-3 RESULTS (Demo Mode)'
        : `IMPORTED NS-3 SIMULATION DATA (${importedMeta?.fileName ?? 'unknown file'})`;
    downloadPerformanceReport(calculatedMetrics, provenance, dataSourceMode === 'demo');
  };

  const handleReset = () => {
    setConfigs(cloneDefaultConfigs());
    setImportedRecords({});
    setImportedMeta(null);
    setDataSourceMode('empty');
    setSelectedMedia('csma');
  };

  const hasComparisonData = Object.keys(calculatedMetrics).length > 0;

  const antigravityColors = useMemo(() => {
    if (!showIntro) return ['#0a69f8', '#06b6d4', '#0b9ddd'];
    if (selectedMedia === 'csma') return ['#f59e0b', '#06b6d4', '#0a69f8'];
    if (selectedMedia === 'wifi') return ['#8b5cf6', '#06b6d4', '#0a69f8'];
    return ['#0a69f8', '#06b6d4', '#0b9ddd'];
  }, [showIntro, selectedMedia]);

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Global Antigravity WebGL2 Interactive Effect across the entire page */}
      <div className="fixed inset-0 z-30 pointer-events-none" aria-hidden="true">
        <Antigravity
          colors={antigravityColors}
          count={1500}
          magnetRadius={4}
          ringRadius={8}
          particleSize={1.1}
          autoAnimate={true}
          particleShape="tetrahedron"
          waveAmplitude={1.9}
          waveCount={4}
          rotationSpeed={0.75}
          depthFactor={0.8}
          ambient={0.34}
          opacity={showIntro ? 0.96 : 0.46}
        />
      </div>

      {showIntro ? (
        <LandingIntro
          onComplete={() => setShowIntro(false)}
          previewMedia={selectedMedia}
          onSelectPreviewMedia={setSelectedMedia}
        />
      ) : (
        <>
          {/* Soft Ambient Background Lighting Effects */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-36 left-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]" />
            <div className="absolute top-1/3 -right-24 h-[440px] w-[440px] rounded-full bg-violet-600/12 blur-[150px]" />
            <div className="absolute bottom-0 left-1/3 h-[380px] w-[460px] rounded-full bg-blue-600/10 blur-[140px]" />
          </div>

          {/* Top Navigation Bar (3-zone contract) */}
          <header className="sticky top-0 z-20 bg-[#050917]/75 backdrop-blur-xl border-b border-cyan-500/20">
            <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
              <a
                href="#top"
                className="font-display text-lg font-bold tracking-tight heading-gradient whitespace-nowrap shrink-0"
              >
                NetPulse
              </a>

              <nav
                aria-label="Dashboard Modules"
                className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
              >
                <a
                  href="#module-topology"
                  className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Topology
                </a>
                <a
                  href="#module-media"
                  className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Transmission Media
                </a>
                <a
                  href="#module-performance"
                  className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Performance
                </a>
                <a
                  href="#module-comparison"
                  className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Comparison
                </a>
              </nav>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="glow-btn-primary px-4 py-2 text-xs font-semibold rounded-lg text-white whitespace-nowrap shrink-0"
              >
                Import NS-3 Results
              </button>
            </div>
          </header>

      <main
        id="top"
        className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        {/* Project Title & Workspace Action Toolbar */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-medium text-cyan-300/85">
                Computer Networks Capstone Project · NS-3 Link Analysis
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1 heading-gradient">
                NetPulse
              </h1>
              <p className="text-sm text-slate-300 mt-1.5">
                Twisted Pair (CSMA) · Fiber Optic (Point-to-Point) · Wireless (Wi-Fi)
              </p>
            </div>

            {/* Functional Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleEnableDemoMode}
                aria-pressed={dataSourceMode === 'demo'}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                  dataSourceMode === 'demo'
                    ? 'border-amber-400/70 bg-amber-950/45 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.22)]'
                    : 'border-cyan-500/30 bg-slate-950/70 text-slate-200 hover:border-cyan-400/60 hover:shadow-[0_0_14px_rgba(34,211,238,0.18)]'
                }`}
              >
                <PlayCircle className="h-4 w-4" />
                Demo Mode
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-cyan-500/35 bg-slate-950/70 text-slate-100 hover:border-cyan-400/70 hover:shadow-[0_0_16px_rgba(34,211,238,0.24)] transition-all whitespace-nowrap shrink-0"
              >
                <Upload className="h-4 w-4 text-cyan-300" />
                Import CSV / JSON
              </button>

              <button
                type="button"
                disabled={!hasComparisonData}
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-violet-500/35 bg-slate-950/70 text-slate-100 hover:border-violet-400/70 hover:shadow-[0_0_16px_rgba(167,139,250,0.24)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4 text-violet-300" />
                Export CSV
              </button>

              <button
                type="button"
                disabled={!hasComparisonData}
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-cyan-400/45 bg-cyan-950/45 text-cyan-100 hover:border-cyan-300/80 hover:shadow-[0_0_18px_rgba(34,211,238,0.28)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all whitespace-nowrap shrink-0"
              >
                <FileText className="h-4 w-4 text-cyan-300" />
                Download Report
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700/80 bg-slate-950/70 text-slate-300 hover:text-white hover:border-slate-500 transition-all whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Data Provenance Banner */}
          {dataSourceMode === 'demo' && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-start sm:items-center gap-2.5 text-xs text-[var(--color-warning-text)]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0 text-amber-400" />
                <div>
                  <span className="font-bold">ILLUSTRATIVE DATA – NOT ACTUAL NS-3 RESULTS.</span>{' '}
                  <span className="text-amber-100/90">
                    Demo Mode displays synthetic sample data to demonstrate workflow, calculations, and charts. This web app does not execute NS-3 directly—import genuine NS-3 CSV or JSON files for actual measurements.
                  </span>
                </div>
              </div>
            </div>
          )}

          {dataSourceMode === 'imported' && importedMeta && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3 text-xs text-[var(--color-success-text)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <span className="font-bold">IMPORTED NS-3 SIMULATION DATA</span> · File:{' '}
                  <span className="font-mono-tabular text-white">{importedMeta.fileName}</span> · Models loaded:{' '}
                  <span className="font-semibold text-white">
                    {Object.keys(importedRecords).length} of 3
                  </span>
                </span>
              </div>
              {importedMeta.warnings.length > 0 && (
                <ul className="mt-1.5 list-disc pl-6 space-y-0.5 text-amber-200">
                  {importedMeta.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {dataSourceMode === 'empty' && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-950/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-300"
            >
              <span>
                Workspace reset. Choose <strong className="text-cyan-300">Demo Mode</strong> to preview illustrative sample metrics, or <strong className="text-cyan-300">Import CSV / JSON</strong> to analyze genuine NS-3 simulation outputs.
              </span>
            </div>
          )}
        </div>

        {/* MODULE 1: NETWORK TOPOLOGY */}
        <TopologyModule
          selectedMedia={selectedMedia}
          config={activeConfig}
          dataSourceMode={dataSourceMode}
        />

        {/* MODULE 2: TRANSMISSION MEDIA */}
        <TransmissionMediaModule
          selectedMedia={selectedMedia}
          onSelectMedia={setSelectedMedia}
          config={activeConfig}
          onUpdateConfig={handleUpdateConfig}
          onSyncTrafficAcrossAll={handleSyncTrafficAcrossAll}
          dataSourceMode={dataSourceMode}
        />

        {/* MODULE 3: PERFORMANCE MEASUREMENT */}
        <PerformanceModule
          selectedMedia={selectedMedia}
          onSelectMedia={setSelectedMedia}
          metricsMap={calculatedMetrics}
          dataSourceMode={dataSourceMode}
          onEnableDemo={handleEnableDemoMode}
          onOpenImport={() => setIsImportModalOpen(true)}
        />

        {/* MODULE 4: RESULT COMPARISON */}
        <ComparisonModule
          metricsMap={calculatedMetrics}
          dataSourceMode={dataSourceMode}
          selectedMedia={selectedMedia}
          onSelectMedia={setSelectedMedia}
        />
      </main>

      <footer className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-cyan-500/15 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          NS-3 Link Models: Twisted Pair (ns3::CsmaChannel) · Fiber Optic (ns3::PointToPointChannel) · Wireless (ns3::YansWifiChannel)
        </span>
        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="text-cyan-300/80 hover:text-cyan-200 hover:underline self-start sm:self-auto"
        >
          Replay Intro Screen
        </button>
      </footer>

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
          />
        </>
      )}
    </div>
  );
}
