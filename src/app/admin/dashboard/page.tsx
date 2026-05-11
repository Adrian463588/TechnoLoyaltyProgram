"use client"

import { useState } from "react"
import { BentoCard } from "@/components/ui/bento-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Calendar, CheckCircle, Clock, FileSpreadsheet, Gift, ShieldAlert, UploadCloud, XCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

type RedemptionRequest = {
  id: string
  employee: string
  item: string
  tokens: number
  status: "Pending" | "Verified" | "Rejected" | "Scheduled"
  date: string
}

const mockRedemptions: RedemptionRequest[] = [
  { id: "R001", employee: "Alice Optel", item: "Exclusive Partner Voucher", tokens: 2000, status: "Pending", date: "2026-05-10" },
  { id: "R002", employee: "Diana Techno", item: "Tech Gadget Bundle", tokens: 5000, status: "Verified", date: "2026-05-09" },
  { id: "R003", employee: "Bob Techno", item: "Extra PTO Day", tokens: 1500, status: "Rejected", date: "2026-05-08" },
]

export default function AdminDashboardPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<"idle" | "validating" | "preview" | "success">("idle")

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setUploadStatus("validating")
    // Mocking validation process
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

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">HC PM Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage operations, uploads, and redemptions.</p>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6 flex items-center gap-4 bg-secondary/10 border-secondary/20" data-testid="stat-card">
          <div className="p-4 bg-secondary/20 rounded-full text-secondary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Active Period</p>
            <h3 className="text-xl font-bold text-foreground">P1 (Dec 16 - Jun 15)</h3>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-primary/10 border-primary/20" data-testid="stat-card">
          <div className="p-4 bg-primary/20 rounded-full text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Last Cut-Off Date</p>
            <h3 className="text-xl font-bold text-foreground">Dec 15, 2025</h3>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-muted/50 border-border" data-testid="stat-card">
          <div className="p-4 bg-muted rounded-full text-muted-foreground">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Redemptions</p>
            <h3 className="text-xl font-bold text-foreground">12 Requests</h3>
          </div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Upload Module */}
        <BentoCard className="p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Monthly Upload Module
            </h3>
            <Badge variant="outline">Optel & Techno</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload CSV or Excel files containing the monthly Slot/Sprint data.
          </p>

          <div 
            {...getRootProps()} 
            data-testid="admin-upload-dropzone"
            className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} data-testid="admin-upload-file-input" />
            <UploadCloud className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">
              Drag & drop your file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .csv, .xlsx (Max 10MB)
            </p>
          </div>

          {uploadStatus === "validating" && (
            <div className="p-4 bg-muted/50 rounded-lg animate-pulse border flex items-center justify-center text-sm text-muted-foreground">
              Validating headers and staging rows...
            </div>
          )}

          {uploadStatus === "preview" && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{files[0]?.name}</p>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Valid: 142 rows</Badge>
              </div>
              
              <div className="bg-background border rounded overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Value (Slots/Sprints)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>EMP001</TableCell>
                      <TableCell>Optel</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-primary" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>EMP002</TableCell>
                      <TableCell>Techno</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-primary" /></TableCell>
                    </TableRow>
                    <TableRow className="bg-destructive/10">
                      <TableCell>EMP003</TableCell>
                      <TableCell>Optel</TableCell>
                      <TableCell className="text-destructive font-bold">-5</TableCell>
                      <TableCell><XCircle className="w-4 h-4 text-destructive" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadStatus("idle")}>Cancel</Button>
                <Button data-testid="admin-upload-submit-button" onClick={() => setUploadStatus("success")}>
                  Commit Upload
                </Button>
              </div>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-primary mx-auto" />
              <h4 className="font-semibold text-foreground">Upload Successful</h4>
              <p className="text-sm text-primary/80">Tokens have been calculated and ledgers updated.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setUploadStatus("idle")}>
                Upload Another
              </Button>
            </div>
          )}
        </BentoCard>

        {/* Redemption Management */}
        <BentoCard className="p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Redemption Requests
            </h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRedemptions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.employee}</TableCell>
                    <TableCell>
                      <div className="text-sm">{req.item}</div>
                      <div className="text-xs text-muted-foreground">{req.tokens} Tokens • {req.date}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        req.status === "Pending" ? "default" :
                        req.status === "Verified" ? "secondary" :
                        "destructive"
                      } className={
                        req.status === "Pending" ? "bg-secondary/10 text-secondary hover:bg-secondary/20" :
                        req.status === "Verified" ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Verify</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}
