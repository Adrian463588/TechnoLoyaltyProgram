"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MonthlyUpload } from "@/types";
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
import { TableRowSkeleton } from "@/components/shared/skeleton-card";
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  History,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

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
  rows: ParsedRow[];
  issues: ValidationIssue[];
  summary: UploadSummary;
}

const DIVISION_LABELS: Record<string, string> = {
  OPTEL:  "Optel (Slot-based)",
  TECHNO: "Techno (Sprint-based)",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function UploadsClient({ history }: { history: MonthlyUpload[] }) {

  const [files,         setFiles        ] = useState<File[]>([]);
  const [division,      setDivision     ] = useState<string>("");
  const [uploadStatus,  setUploadStatus ] = useState<UploadStatus>("idle");
  const [parseResult,   setParseResult  ] = useState<ProcessResponse | null>(null);
  const [errorRows,     setErrorRows    ] = useState<number[]>([]);
  const [shakeRows,     setShakeRows    ] = useState<number[]>([]);
  const [localHistory,  setLocalHistory ] = useState(history);
  const [apiError,      setApiError     ] = useState<string | null>(null);
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

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (divisionRef.current) fd.append("division", divisionRef.current);

      const res = await fetch("/api/admin/uploads/process", {
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
    if (!parseResult?.summary.canCommit) return;
    setUploadStatus("committing");

    try {
      // In a full DB integration this would POST to /api/admin/uploads/commit
      // For now we simulate the commit and add to local history
      await new Promise((r) => setTimeout(r, 1200));

      const newEntry: MonthlyUpload = {
        id:           crypto.randomUUID(),
        filename:     files[0]?.name ?? "upload.xlsx",
        uploadedAt:   new Date().toISOString(),
        status:       "Completed",
        validRows:    parseResult.summary.validRows,
        errorRows:    parseResult.summary.errorRows,
        issues:       [],
      };
      setLocalHistory((h) => [newEntry, ...h]);
      setUploadStatus("success");
      toast.success(`Committed ${parseResult.summary.validRows} rows successfully`);
    } catch {
      toast.error("Commit failed — please retry");
      setUploadStatus("preview");
    }
  }, [parseResult, files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setUploadStatus("idle");
    setParseResult(null);
    setApiError(null);
    setErrorRows([]);
  }, []);

  // ── Render helpers ───────────────────────────────────────────
  const detectedDiv = parseResult?.division ?? division;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
      {/* ── LEFT COLUMN (UPLOAD & PREVIEW) ── */}
      <div className="col-span-1 lg:col-span-7 space-y-6">

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
                  <SelectItem value="OPTEL">Optel (Slot-based)</SelectItem>
                  <SelectItem value="TECHNO">Techno (Sprint-based)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </BentoCard>

          {/* Drop zone */}
          {uploadStatus === "idle" && (
            <div
              {...getRootProps()}
              data-testid="upload-dropzone"
              className={cn(
                "relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed p-20 cursor-pointer transition-all duration-300 animate-fade-up-in shadow-inner",
                isDragActive
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-[1.02] ring-4 ring-[var(--color-accent)]/5"
                  : "border-slate-300 bg-slate-100 hover:border-[var(--color-accent)]/50 hover:bg-slate-200"
              )}
              style={{ animationDelay: "50ms" }}
            >
              <input {...getInputProps()} data-testid="file-input" />
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
                  
                  <div className="flex gap-3 justify-center mt-8">
                    {['.xlsx', '.xls', '.csv'].map(ext => (
                      <span key={ext} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white text-slate-500 border border-slate-200 shadow-sm">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Decorative corner accents */}
              {!isDragActive && (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                   <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-slate-400 rounded-tl-lg" />
                   <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-slate-400 rounded-tr-lg" />
                   <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-slate-400 rounded-bl-lg" />
                   <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-slate-400 rounded-br-lg" />
                </div>
              )}
            </div>
          )}

          {/* Validating skeleton */}
          {uploadStatus === "validating" && (
            <BentoCard className="p-8 space-y-6 animate-pulse border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)]" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-[var(--color-surface-elevated)]" />
                  <div className="h-3 w-32 rounded bg-[var(--color-surface-elevated)]/60" />
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 w-full rounded-lg bg-[var(--color-surface-elevated)]/40" />
                ))}
              </div>
            </BentoCard>
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
                      disabled={!parseResult.summary.canCommit}
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

              {/* Data preview table */}
              <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)]">
                <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">Data Preview</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Top 20 rows</p>
                </div>
                <div className="overflow-x-auto hide-scrollbar">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-[var(--color-surface-elevated)]/50">
                      <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                        <TableHead className="w-16 py-4 px-6 text-center">#</TableHead>
                        <TableHead className="py-4 px-6">NPK</TableHead>
                        <TableHead className="py-4 px-6">Name</TableHead>
                        <TableHead className="py-4 px-6">Partnership</TableHead>
                        <TableHead className="py-4 px-6 text-right">Tokens/Slots</TableHead>
                        <TableHead className="py-4 px-6 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.rows.slice(0, 20).map((row) => {
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
                            <TableCell className="py-4 px-6 text-center text-[var(--color-text-tertiary)] font-mono text-xs">{row.rowNumber}</TableCell>
                            <TableCell className="py-4 px-6 font-mono text-xs text-[var(--color-text-secondary)]">{row.npk}</TableCell>
                            <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-medium group-hover:text-[var(--color-text-primary)]">{row.name}</TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-bold text-[9px] tracking-widest px-2 py-0.5 rounded-md",
                                  row.partnershipStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                )}
                              >
                                {String(row.partnershipStatus ?? "-")}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right font-mono font-bold text-[var(--color-accent)]">
                              {typeof row.totalSlots === "number"
                                ? row.totalSlots.toLocaleString()
                                : typeof row.totalSprintPerPeriod === "number"
                                ? row.totalSprintPerPeriod.toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-center">
                              {row.isResigned ? (
                                <Badge variant="destructive" className="text-[9px] font-bold rounded-md">Resigned</Badge>
                              ) : hasError ? (
                                <Badge variant="destructive" className="text-[9px] font-bold rounded-md">Error</Badge>
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

      {/* ── RIGHT COLUMN (HISTORY) ── */}
      <div className="col-span-1 lg:col-span-5 space-y-5 lg:sticky lg:top-6 animate-fade-up-in" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Recent Activity</h3>
          </div>
          {localHistory.length > 0 && (
            <Badge variant="outline" className="rounded-full px-2 py-0 font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-base)]">
              {localHistory.length}
            </Badge>
          )}
        </div>
        <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)]">
            {localHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                <FileSpreadsheet className="h-12 w-12 text-[var(--color-text-tertiary)] mb-4 stroke-[1.5]" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Activity log is empty</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar overflow-y-auto max-h-[calc(100vh-16rem)]">
                <Table>
                  <TableHeader className="bg-[var(--color-surface-elevated)]/50 sticky top-0 z-10">
                    <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                      <TableHead className="py-3 px-4 font-semibold text-[var(--color-text-tertiary)] text-[10px] uppercase">File Details</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-[var(--color-text-tertiary)] text-[10px] uppercase text-right">Rows</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-[var(--color-text-tertiary)] text-[10px] uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localHistory.map((upload) => (
                      <TableRow key={upload.id} className="group hover:bg-[var(--color-accent)]/[0.03] transition-all border-[var(--color-border-subtle)]">
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] truncate max-w-[160px]" title={upload.filename}>
                              {upload.filename}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono whitespace-nowrap">
                              {formatDate(upload.uploadedAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <span className="font-mono text-xs font-bold text-[var(--color-text-secondary)]">
                            {upload.validRows.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-md",
                              upload.status === "Completed" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : upload.status === "Failed" 
                                  ? "bg-red-50 text-red-600 border-red-100" 
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                            )}
                          >
                            {upload.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </BentoCard>
      </div>
    </div>
  );
}
