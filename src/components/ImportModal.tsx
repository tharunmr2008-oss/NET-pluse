import React, { useRef, useState } from 'react';
import { Upload, X, FileSpreadsheet, FileJson, AlertCircle } from 'lucide-react';
import { ImportValidationResult } from '../types/network';
import {
  downloadSampleNs3Csv,
  downloadSampleNs3Json,
  parseAndValidateNs3File,
} from '../utils/fileHandlers';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportValidationResult) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.csv') && !ext.endsWith('.json')) {
      setValidationResult({
        ok: false,
        records: {},
        errors: ['Unsupported file extension. Please upload a .csv or .json file.'],
        warnings: [],
        fileName: file.name,
        format: 'csv',
      });
      return;
    }

    const text = await file.text();
    const result = parseAndValidateNs3File(file.name, text);
    setValidationResult(result);

    if (result.ok) {
      onImportSuccess(result);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl glass-panel p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h2
              id="import-modal-title"
              className="text-lg font-semibold heading-gradient"
            >
              Import Actual NS-3 Simulation Results
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Upload CSV or JSON trace summaries exported from your NS-3 CSMA, Point-to-Point, and Wi-Fi simulations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setValidationResult(null);
              onClose();
            }}
            aria-label="Close import dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-5 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/35 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
              : 'border-cyan-500/30 bg-slate-950/60'
          }`}
        >
          <Upload className="mx-auto h-7 w-7 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          <p className="mt-3 text-sm font-medium text-slate-100">
            Drop your NS-3 CSV or JSON file here, or browse from disk
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Required fields: <span className="font-mono-tabular text-cyan-300">media</span> (csma, p2p, wifi),{' '}
            <span className="font-mono-tabular text-cyan-300">transmitted_packets</span>,{' '}
            <span className="font-mono-tabular text-cyan-300">received_packets</span>,{' '}
            <span className="font-mono-tabular text-cyan-300">average_delay_ms</span>,{' '}
            <span className="font-mono-tabular text-cyan-300">measurement_duration_sec</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glow-btn-primary mt-4 px-4 py-2 text-xs font-semibold rounded-lg text-white"
          >
            Select CSV or JSON File
          </button>
        </div>

        {/* Validation Feedback */}
        {validationResult && !validationResult.ok && (
          <div className="mt-4 rounded-xl border border-red-400/40 bg-red-950/45 p-4 text-xs text-red-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>Validation failed for {validationResult.fileName}</span>
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sample Templates */}
        <div className="mt-5 pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-300">
            Need the exact schema? Download a template matching NS-3 FlowMonitor exports:
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={downloadSampleNs3Csv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/35 bg-slate-950/75 text-slate-100 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-300" />
              Sample CSV
            </button>
            <button
              type="button"
              onClick={downloadSampleNs3Json}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-500/35 bg-slate-950/75 text-slate-100 hover:border-violet-400/70 hover:shadow-[0_0_12px_rgba(167,139,250,0.2)] transition-all whitespace-nowrap shrink-0"
            >
              <FileJson className="h-3.5 w-3.5 text-violet-300" />
              Sample JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
