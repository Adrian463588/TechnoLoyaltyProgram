"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuccessAnimation } from "@/components/shared/success-animation";
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ClientPagination } from "@/components/shared/client-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UploadStatus = "idle" | "validating" | "preview" | "committing" | "success" | "error";

interface ParsedRow {
  rowNumber: number;
  npk: string;
  name: string;
  [key: string]: unknown;
}

interface ValidationIssue {
  rowNumber: number;
  column: string;
  issue: string;
  severity: "ERROR" | "WARNING";
}

interface UploadSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  hasErrors: boolean;
  canCommit: boolean;
}

interface ProcessResponse {
  division?: string;
  aiDetected?: boolean;
  columnMapping?: Record<string, string>;
  unmappedColumns?: string[];
  rows: ParsedRow[];
  issues: ValidationIssue[];
  summary: UploadSummary;
}

const DIVISION_LABELS: Record<string, string> = {
  OPTEL:  "Optel (Slot-based)",
  TECHNO: "Techno (Sprint-based)",
};

export default function UploadsClient() {

  const [files,         setFiles        ] = useState<File[]>([]);
  const [division,      setDivision     ] = useState<string>("");
  const [uploadStatus,  setUploadStatus ] = useState<UploadStatus>("idle");
  const [parseResult,   setParseResult  ] = useState<ProcessResponse | null>(null);
  const [errorRows,     setErrorRows    ] = useState<number[]>([]);
  const [shakeRows,     setShakeRows    ] = useState<number[]>([]);
  const [apiError,      setApiError     ] = useState<string | null>(null);
  const [currentPage,   setCurrentPage  ] = useState<number>(1);
  const [showInvalidModal, setShowInvalidModal] = useState<boolean>(false);
  const itemsPerPage = 10;

  // Ref tracks latest division value; updated via effect to avoid render-phase mutation
  const divisionRef = useRef(division);
  useEffect(() => {
    divisionRef.current = division;
  });


  // ── Drop handler ────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !acceptedFiles[0]) return;
    const file = acceptedFiles[0];
    setFiles([file]);
    setUploadStatus("validating");
    setParseResult(null);
    setApiError(null);
    setErrorRows([]);
    setCurrentPage(1);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (divisionRef.current) fd.append("division", divisionRef.current);

      const res = await fetch(`/api/admin/uploads/process?t=${Date.now()}`, {
        method: "POST",
        body:   fd,
      });

      const data: ProcessResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Failed to process file");
        setUploadStatus("error");
        return;
      }

      setParseResult(data);
      setUploadStatus("preview");

      // Trigger shake on error rows
      const errNums = data.issues
        .filter((i) => i.severity === "ERROR")
        .map((i) => i.rowNumber);
      setErrorRows(errNums);

      if (errNums.length > 0) {
        setTimeout(() => {
          setShakeRows(errNums);
          setTimeout(() => setShakeRows([]), 600);
        }, 300);
      }

      // Auto-detect division display
      if (data.division && !divisionRef.current) {
        setDivision(data.division);
      }
    } catch (err) {
      console.error("[UploadsClient] process error:", err);
      setApiError("Network error — please check your connection and try again.");
      setUploadStatus("error");
    }
  }, []); // uses divisionRef to read latest division without stale closure risk

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple:  false,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
  });

  // ── Commit ──────────────────────────────────────────────────
  const handleCommit = useCallback(async () => {
    if (!parseResult) return;

    if (parseResult.summary.hasErrors) {
      setShowInvalidModal(true);
      return;
    }

    setUploadStatus("committing");

    try {
      const res = await fetch("/api/admin/uploads/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division: parseResult.division ?? division,
          rows:     parseResult.rows,
        }),
      });

      const data = await res.json() as { success?: boolean; processed?: number; created?: number; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setUploadStatus("success");
      toast.success(
        `Berhasil commit ${String(data.created ?? parseResult.summary.validRows)} baris ke ledger`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Commit gagal — silakan coba lagi";
      toast.error(msg);
      setUploadStatus("preview");
    }
  }, [parseResult, files, division]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setUploadStatus("idle");
    setParseResult(null);
    setApiError(null);
    setErrorRows([]);
    setCurrentPage(1);
  }, []);

  // ── Render helpers ───────────────────────────────────────────
  const detectedDiv = parseResult?.division ?? division;
  
  // Pagination logic
  const paginatedRows = parseResult?.rows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  const totalPages = parseResult ? Math.ceil(parseResult.rows.length / itemsPerPage) : 0;

  return (
    <div className="w-full">
      {/* ── UPLOAD & PREVIEW ── */}
      <div className="space-y-6">

          {/* Division selector */}
          <BentoCard className="p-5 border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/20 shadow-sm animate-fade-up-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Upload Template</p>
                <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                  Select a specific division or leave blank for auto-detection.
                </p>
              </div>
              <Select value={division} onValueChange={(v) => setDivision(v ?? "")}>
                <SelectTrigger 
                  className="w-full sm:w-[220px] bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] rounded-xl" 
                  data-testid="division-select"
                >
                  <SelectValue placeholder="Auto-detect template" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[var(--color-border-subtle)] shadow-xl">
                  <SelectItem value="OPCENT">Operation Center (OPCENT)</SelectItem>
                  <SelectItem value="TELE">Telephony Center (TELE)</SelectItem>
                  <SelectItem value="TECHNO">Techno (TECHNO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </BentoCard>

          {/* Drop zone & Validating State */}
          {(uploadStatus === "idle" || uploadStatus === "validating" || uploadStatus === "preview") && (
            <div className="space-y-6 animate-fade-up-in">
              <div
                {...getRootProps()}
                data-testid="upload-dropzone"
                className={cn(
                  "relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed p-20 cursor-pointer transition-all duration-300 shadow-inner",
                  isDragActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-[1.02] ring-4 ring-[var(--color-accent)]/5"
                    : uploadStatus === "validating"
                    ? "border-[var(--color-accent)]/30 bg-slate-50 cursor-not-allowed"
                    : "border-slate-300 bg-slate-100 hover:border-[var(--color-accent)]/50 hover:bg-slate-200"
                )}
              >
                <input {...getInputProps()} data-testid="file-input" disabled={uploadStatus === "validating"} />
                
                {uploadStatus === "validating" ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-16 w-16">
                      <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent)]/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-700">Memproses File...</p>
                      <p className="text-slate-500 mt-1 font-medium">Mohon tunggu sebentar</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "flex h-24 w-24 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm",
                      isDragActive
                        ? "bg-[var(--color-accent)] text-white rotate-12 scale-110"
                        : "bg-white border border-slate-200 text-slate-400 group-hover:text-slate-600"
                    )}>
                      <UploadCloud size={40} className={cn("transition-transform duration-500", isDragActive && "animate-bounce")} />
                    </div>

                    {isDragActive ? (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--color-accent)]">Drop it here!</p>
                        <p className="text-slate-600 font-medium mt-1">Release to start processing</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xl font-bold text-slate-700">Drag & drop your Excel file</p>
                        <p className="text-slate-500 mt-2 font-medium">
                          or <span className="text-[var(--color-accent)] underline underline-offset-4 decoration-2">browse your computer</span>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {uploadStatus === "error" && (
            <BentoCard className="p-8 border-red-200 bg-red-50/30 animate-fade-up-in">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-900">Processing Failed</p>
                  <p className="text-sm text-red-700/80 mt-1 leading-relaxed">{apiError}</p>
                  <Button 
                    variant="outline" 
                    className="mt-6 border-red-200 text-red-700 hover:bg-red-50 rounded-xl" 
                    onClick={handleReset}
                  >
                    Try Another File
                  </Button>
                </div>
              </div>
            </BentoCard>
          )}

          {/* Preview */}
          {uploadStatus === "preview" && parseResult && (
            <div className="space-y-6 animate-fade-up-in">
              {/* Summary bar */}
              <BentoCard className="p-5 border-[var(--color-border-subtle)] shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[200px]">
                        {files[0]?.name}
                      </span>
                      {detectedDiv && (
                        <Badge variant="outline" className="bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20 text-[10px] font-bold">
                          {DIVISION_LABELS[detectedDiv] ?? detectedDiv}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {parseResult.summary.validRows} Valid
                      </span>
                      <span className={cn("px-2 py-0.5 rounded border", parseResult.summary.errorRows > 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-neutral-50 text-neutral-400 border-neutral-100")}>
                        {parseResult.summary.errorRows} Errors
                      </span>
                      <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                        {parseResult.summary.warningRows} Warnings
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none rounded-xl" onClick={handleReset}>Cancel</Button>
                    <Button
                      onClick={handleCommit}
                      className="flex-1 sm:flex-none btn-primary rounded-xl"
                      data-testid="commit-btn"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Commit Data
                    </Button>
                  </div>
                </div>

                {/* Issues list */}
                {parseResult.issues.length > 0 && (
                  <div className="mt-6 space-y-2 border-t border-[var(--color-border-subtle)] pt-5">
                    <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">Validation Details</p>
                    <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {parseResult.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start gap-3 rounded-xl px-4 py-3 text-xs transition-colors",
                            issue.severity === "ERROR"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-orange-50 text-orange-700 border border-orange-100"
                          )}
                        >
                          {issue.severity === "ERROR"
                            ? <XCircle className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
                            : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
                          }
                          <div className="flex-1">
                            <span className="font-bold mr-1.5 underline decoration-red-200">Row {issue.rowNumber}</span>
                            <span className="font-semibold">{issue.column}:</span> {issue.issue}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </BentoCard>

              {/* AI Mapping Panel */}
              {(parseResult.columnMapping && Object.keys(parseResult.columnMapping).length > 0) && (
                <BentoCard className="p-5 border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.02] shadow-sm mt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-[var(--color-accent)]/10 pb-3">
                      <div className="bg-[var(--color-accent)]/10 p-1.5 rounded-lg">
                        <span className="text-[var(--color-accent)] text-lg">🤖</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI Column Detection</h3>
                        <p className="text-xs text-[var(--color-text-tertiary)]">Gemini AI automatically mapped your file headers to system fields.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(parseResult.columnMapping).map(([original, mapped]) => (
                        <div key={original} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl">
                          <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]" title={original}>&quot;{original}&quot;</span>
                          <span className="text-slate-300 mx-2">→</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono">
                            {mapped} <CheckCircle className="inline w-3 h-3 ml-1" />
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {parseResult.unmappedColumns && parseResult.unmappedColumns.length > 0 && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-orange-800">Unmapped Columns Ignored:</p>
                            <p className="text-[10px] text-orange-600 mt-0.5 font-mono">
                              {parseResult.unmappedColumns.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </BentoCard>
              )}

              {/* Data preview table */}
              <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)] mt-6">
                <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">Data Preview</p>
                  </div>
                  <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
                    {parseResult.rows.length} Rows
                  </Badge>
                </div>
                <div className="overflow-x-auto hide-scrollbar">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-[var(--color-surface-elevated)]/50">
                      <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                        <TableHead className="w-16 py-4 px-6 text-center">#</TableHead>
                        <TableHead className="py-4 px-6">NPK</TableHead>
                        <TableHead className="py-4 px-6">Name</TableHead>
                        <TableHead className="py-4 px-6">Fungsi</TableHead>
                        <TableHead className="py-4 px-6">Division</TableHead>
                        <TableHead className="py-4 px-6">Tier</TableHead>
                        <TableHead className="py-4 px-6 text-right">Token</TableHead>
                        <TableHead className="py-4 px-6 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row) => {
                        const hasError = errorRows.includes(row.rowNumber);
                        const isShaking = shakeRows.includes(row.rowNumber);
                        return (
                          <TableRow
                            key={row.rowNumber}
                            className={cn(
                              "transition-all duration-200 border-[var(--color-border-subtle)]",
                              hasError ? "bg-red-50/50" : "hover:bg-[var(--color-accent)]/[0.05]",
                              isShaking && "animate-shake"
                            )}
                          >
                            <TableCell className="py-4 px-6 text-center text-[var(--color-text-tertiary)] text-sm font-normal">{row.rowNumber}</TableCell>
                            <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-normal">{row.npk}</TableCell>
                            <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-normal group-hover:text-[var(--color-text-primary)] transition-colors">{row.name}</TableCell>
                            <TableCell className="py-4 px-6 text-sm text-[var(--color-text-tertiary)] font-normal">{(row as any).fungsi || "-"}</TableCell>
                            <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-normal">{(row as any).division || "-"}</TableCell>
                            <TableCell className="py-4 px-6">
                              <span className="font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm flex items-center w-fit gap-1.5 bg-blue-500/10 text-blue-600 border-blue-200">
                                {String((row as any).tier || "-")}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right text-sm text-[var(--color-text-secondary)] font-normal">
                              {typeof (row as any).token === "number"
                                ? (row as any).token.toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-center">
                              {(row as any).isResigned ? (
                                <Badge variant="destructive" className="text-[9px] font-bold rounded-md">Resigned</Badge>
                              ) : hasError ? (
                                <Badge variant="destructive" className="text-[9px] font-bold rounded-md">Invalid</Badge>
                              ) : (
                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-[9px] font-bold rounded-md">Valid</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <ClientPagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={parseResult.rows.length}
                  onPageChange={setCurrentPage}
                />
              </BentoCard>
            </div>
          )}

          {/* Committing */}
          {uploadStatus === "committing" && (
            <BentoCard className="p-16 flex flex-col items-center gap-6 text-center animate-fade-up-in">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent)]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-[var(--color-text-primary)]">Syncing Ledger</p>
                <p className="text-sm text-[var(--color-text-tertiary)] max-w-[240px]">
                  Saving distribution results to individual mitra balances…
                </p>
              </div>
            </BentoCard>
          )}

          {/* Success */}
          {uploadStatus === "success" && (
            <BentoCard className="p-16 flex flex-col items-center gap-6 text-center animate-fade-up-in">
              <SuccessAnimation />
              <div className="space-y-2">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">Transaction Successful</p>
                <p className="text-sm text-[var(--color-text-tertiary)] max-w-sm">
                  {parseResult?.summary.validRows} records have been successfully added to the system history.
                </p>
              </div>
              <Button onClick={handleReset} className="btn-primary rounded-xl px-8">Upload Another File</Button>
            </BentoCard>
          )}
      </div>

      {/* Invalid Data Modal */}
      <Dialog open={showInvalidModal} onOpenChange={setShowInvalidModal}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl overflow-hidden p-0 max-w-sm gap-0 ring-0">
          <div className="p-8 text-center bg-red-50 border-b border-red-100">
             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-red-600 mx-auto shadow-sm border border-red-100 mb-4">
                <AlertTriangle size={32} />
             </div>
             <DialogTitle className="text-xl font-black text-red-900 tracking-tight">Data Tidak Valid</DialogTitle>
             <DialogDescription className="text-red-700/70 font-bold text-[11px] uppercase tracking-widest mt-1">
               Terdapat baris data yang belum lengkap
             </DialogDescription>
          </div>
          <div className="p-8 space-y-6 bg-white">
            <p className="text-sm text-slate-600 leading-relaxed text-center">
              Maaf, Anda tidak dapat melanjutkan proses commit karena terdapat <strong>{parseResult?.summary.errorRows} baris</strong> yang memiliki data kosong pada kolom wajib (NPK, Nama, Fungsi, Token, atau Tier).
            </p>
            <Button
              onClick={() => setShowInvalidModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black shadow-lg"
            >
              Tutup & Periksa Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
