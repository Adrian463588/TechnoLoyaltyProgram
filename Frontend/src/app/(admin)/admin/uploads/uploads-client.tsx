"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MonthlyUpload } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
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
          <BentoCard className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Division (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-detect from file headers. Supported: Optel & Techno templates.
                </p>
              </div>
              <Select value={division} onValueChange={(v) => setDivision(v ?? "")}>
                <SelectTrigger 
                  className="w-full sm:w-[220px]" 
                  data-testid="division-select"
                >
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
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
                "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-300",
                isDragActive
                  ? "border-primary bg-[rgba(124,196,70,0.08)] scale-[1.01] shadow-[0_0_40px_rgba(124,196,70,0.18)]"
                  : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <input {...getInputProps()} data-testid="file-input" />
              <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                isDragActive
                  ? "bg-primary/20 shadow-[0_0_24px_rgba(124,196,70,0.35)]"
                  : "bg-muted/50"
              )}>
                <UploadCloud className={cn("h-8 w-8 transition-colors duration-300", isDragActive ? "text-primary" : "text-muted-foreground")} />
              </div>

              {isDragActive ? (
                <div className="text-center animate-fade-up-in">
                  <p className="text-lg font-bold text-primary">Drop to Upload</p>
                  <p className="text-sm text-primary/70 mt-1">Release to process this file</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">Drag & drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">Supports: .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>
          )}

          {/* Validating skeleton */}
          {uploadStatus === "validating" && (
            <BentoCard className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-5 rounded-full bg-primary/20 animate-skeleton" />
                <p className="text-sm font-medium text-muted-foreground animate-skeleton">
                  Parsing &amp; validating <span className="text-foreground font-semibold">{files[0]?.name}</span>…
                </p>
              </div>
              <Table>
                <TableBody>
                  <TableRowSkeleton rows={5} />
                </TableBody>
              </Table>
            </BentoCard>
          )}

          {/* Error state */}
          {uploadStatus === "error" && (
            <BentoCard className="p-6 border border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-4">
                <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Processing Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{apiError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                    Try Again
                  </Button>
                </div>
              </div>
            </BentoCard>
          )}

          {/* Preview */}
          {uploadStatus === "preview" && parseResult && (
            <div className="space-y-4" data-testid="upload-file-selected">
              {/* Summary bar */}
              <BentoCard className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">File:</span>
                      <span className="font-medium text-foreground">{files[0]?.name}</span>
                    </div>
                    {detectedDiv && (
                      <span className="status-chip status-chip--info text-[10px]">
                        {DIVISION_LABELS[detectedDiv] ?? detectedDiv}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">{parseResult.summary.validRows}</span> valid •{" "}
                      <span className={cn("font-bold", parseResult.summary.errorRows > 0 ? "text-destructive" : "text-foreground")}>
                        {parseResult.summary.errorRows}
                      </span> errors •{" "}
                      <span className="font-bold text-yellow-400">{parseResult.summary.warningRows}</span> warnings
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>Cancel</Button>
                    <Button
                      size="sm"
                      disabled={!parseResult.summary.canCommit}
                      onClick={handleCommit}
                      data-testid="commit-btn"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Commit {parseResult.summary.validRows} Rows
                    </Button>
                  </div>
                </div>

                {/* Issues list */}
                {parseResult.issues.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Validation Issues</p>
                    {parseResult.issues.map((issue, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                          issue.severity === "ERROR"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-yellow-950/30 text-yellow-400 border border-yellow-700/30"
                        )}
                      >
                        {issue.severity === "ERROR"
                          ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        }
                        <span>
                          {issue.rowNumber > 0 && <span className="font-mono mr-1">[Row {issue.rowNumber}]</span>}
                          <span className="font-semibold">{issue.column}:</span> {issue.issue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </BentoCard>

              {/* Data preview table */}
              <BentoCard className="overflow-hidden p-0">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-sm font-medium text-foreground">Data Preview</p>
                  <p className="text-xs text-muted-foreground">Showing first 20 rows</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>NPK</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Partnership</TableHead>
                        <TableHead className="text-right">Tokens/Slots</TableHead>
                        <TableHead>Status</TableHead>
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
                              "transition-colors border-border",
                              hasError ? "bg-destructive/5 text-destructive" : "hover:bg-muted/20",
                              isShaking && "animate-shake"
                            )}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">{row.rowNumber}</TableCell>
                            <TableCell className="font-mono text-sm">{row.npk}</TableCell>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "status-chip",
                                  row.partnershipStatus === "ACTIVE" ? "status-chip--success" : "status-chip--info"
                                )}
                              >
                                {String(row.partnershipStatus ?? "-")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-tabular-nums">
                              {typeof row.totalSlots === "number"
                                ? row.totalSlots.toLocaleString()
                                : typeof row.totalSprintPerPeriod === "number"
                                ? row.totalSprintPerPeriod.toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {row.isResigned ? (
                                <span className="status-chip status-chip--error">Resigned</span>
                              ) : hasError ? (
                                <span className="status-chip status-chip--error">Error</span>
                              ) : (
                                <span className="status-chip status-chip--success">Valid</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {parseResult.rows.length > 20 && (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/10">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Showing 20 of {parseResult.rows.length} rows. All rows will be committed.
                    </p>
                  </div>
                )}
              </BentoCard>
            </div>
          )}

          {/* Committing */}
          {uploadStatus === "committing" && (
            <BentoCard className="p-8 flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-foreground">Committing data to ledger…</p>
              <p className="text-xs text-muted-foreground">Please do not close this page.</p>
            </BentoCard>
          )}

          {/* Success */}
          {uploadStatus === "success" && (
            <BentoCard className="p-8 flex flex-col items-center gap-4 text-center">
              <SuccessAnimation />
              <div>
                <p className="text-lg font-bold text-foreground mt-2">Upload Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseResult?.summary.validRows} rows committed to the token ledger.
                </p>
              </div>
              <Button onClick={handleReset}>Upload Another File</Button>
            </BentoCard>
          )}
      </div>

      {/* ── RIGHT COLUMN (HISTORY) ── */}
      <div className="col-span-1 lg:col-span-5 space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Recent Uploads</h3>
          {localHistory.length > 0 && (
            <span className="status-chip status-chip--info shadow-sm border border-border/50 px-2">
              {localHistory.length}
            </span>
          )}
        </div>
        <BentoCard className="overflow-hidden p-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {localHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No uploads yet</p>
                <p className="text-xs text-muted-foreground mt-1">Files you upload will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localHistory.map((upload) => (
                    <TableRow key={upload.id} className="hover:bg-muted/20 transition-colors border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground">{upload.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell suppressHydrationWarning className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(upload.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {upload.validRows.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "status-chip",
                            upload.status === "Completed" ? "status-chip--success" : upload.status === "Failed" ? "status-chip--error" : "status-chip--warning"
                          )}
                        >
                          {upload.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </BentoCard>
      </div>
    </div>
  );
}
