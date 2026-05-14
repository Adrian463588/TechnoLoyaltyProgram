"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { motion } from "framer-motion"
import { CheckCircle, FileSpreadsheet, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<"idle" | "validating" | "preview" | "success">("idle")

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setUploadStatus("validating")
    
    // Simulate API call validation
    setTimeout(() => {
      setUploadStatus("preview")
    }, 1500)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  const handleCommit = async () => {
    // Here we would call the backend API: POST /api/admin/uploads/:id/commit
    setUploadStatus("success")
  }

  return (
    <>
      <div 
        {...getRootProps()} 
        data-testid="upload-dropzone" id="admin-upload-dropzone"
        className={cn(
          "mt-2 border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-slate-200 bg-slate-50/30 hover:border-primary/40 hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} data-testid="admin-upload-file-input" />
        <div className="bg-white w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <UploadCloud className={cn("w-8 h-8 transition-colors", isDragActive ? "text-primary" : "text-slate-400")} />
        </div>
        <p className="text-base font-bold text-foreground">
          {isDragActive ? "Drop to Process" : "Select Performance File"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Maximum file size: 10MB (.xlsx, .csv)
        </p>
      </div>

      {uploadStatus === "validating" && (
        <div className="p-6 bg-slate-100/50 rounded-2xl animate-pulse border-2 border-dashed flex items-center justify-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Verifying Schema...
        </div>
      )}

      {uploadStatus === "preview" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-2"
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <p className="text-sm font-black text-foreground">{files[0]?.name}</p>
            </div>
            <Badge variant="outline" className="bg-vivid-green/10 text-vivid-green border-vivid-green/20 font-bold">142 VALID ROWS</Badge>
          </div>
          
          <div className="bg-white/40 border-2 rounded-2xl overflow-hidden shadow-inner">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow className="border-0">
                  <TableHead className="font-bold text-[10px] uppercase tracking-tighter">NPK</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-tighter">Division</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-tighter text-right">Value</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-tighter text-center">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-slate-100">
                  <TableCell className="font-mono text-xs">EMP001</TableCell>
                  <TableCell className="text-xs font-bold">Optel</TableCell>
                  <TableCell className="text-xs font-black text-right">12</TableCell>
                  <TableCell><CheckCircle className="w-4 h-4 text-vivid-green mx-auto" /></TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="font-mono text-xs">EMP002</TableCell>
                  <TableCell className="text-xs font-bold">Techno</TableCell>
                  <TableCell className="text-xs font-black text-right">4</TableCell>
                  <TableCell><CheckCircle className="w-4 h-4 text-vivid-green mx-auto" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" className="font-bold uppercase tracking-widest text-xs h-10" onClick={() => setUploadStatus("idle")}>Discard</Button>
            <Button 
              data-testid="admin-upload-submit-button" 
              onClick={handleCommit}
              className="font-bold uppercase tracking-widest text-xs h-10 px-8 shadow-lg shadow-primary/20"
            >
              Commit Ledger
            </Button>
          </div>
        </motion.div>
      )}

      {uploadStatus === "success" && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-vivid-green/5 border-2 border-vivid-green/20 rounded-[2rem] text-center space-y-4 shadow-xl shadow-vivid-green/10"
        >
          <div className="w-16 h-16 bg-vivid-green rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-vivid-green/30">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-black text-xl text-foreground">Sync Complete</h4>
            <p className="text-sm text-vivid-green font-bold uppercase tracking-tighter mt-1">Tokens Distributed & Audited</p>
          </div>
          <Button variant="outline" size="sm" className="mt-2 font-bold uppercase tracking-widest text-[10px] border-2" onClick={() => setUploadStatus("idle")}>
            Initialize Next Sync
          </Button>
        </motion.div>
      )}
    </>
  )
}
