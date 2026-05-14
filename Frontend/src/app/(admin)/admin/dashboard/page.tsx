import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight,
  Calendar, 
  Clock, 
  Coins,
  FileSpreadsheet, 
  Gift, 
  LayoutGrid,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UploadDropzone } from "@/components/shared/upload-dropzone"
import { getServerToken } from "@/lib/auth"
import { adminApi } from "@/lib/api-client"

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

export default async function AdminDashboardPage() {
  const token = await getServerToken()
  
  let redemptions = mockRedemptions
  try {
    const apiRedemptions = await adminApi.listRedemptions(token)
    if (apiRedemptions && apiRedemptions.length > 0) {
      redemptions = apiRedemptions.map(r => {
        const isoString = r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString();
        const parts = isoString.split('T');
        const fallbackDate = new Date().toISOString().split('T')[0] as string;
        const dateStr = (parts[0] as string) ?? fallbackDate;
        return {
          id: r.id,
          employee: "Employee", // API currently doesn't return employee name in this DTO
          item: r.item.name,
          tokens: r.item.tokenCost,
          status: (r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()) as "Pending" | "Verified" | "Rejected" | "Scheduled",
          date: dateStr
        };
      })
    }
  } catch (error) {
    console.warn("Using mock data for redemptions. Fetch failed:", error instanceof Error ? error.message : "Unknown error")
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 pb-12 animate-fade-up-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">HC PM Control</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Precision management of uploads, redemptions, and system audit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] h-9 border-2">
            <Settings className="w-3.5 h-3.5 mr-2" /> System Config
          </Button>
          <Button size="sm" className="font-bold uppercase tracking-widest text-[10px] h-9 shadow-lg shadow-primary/20">
            <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Global Audit
          </Button>
        </div>
      </div>

      {/* ── Operational Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <GlassCard className="p-6 flex items-center gap-4 bg-corporate-50/50 border-corporate-200/50" data-testid="stat-card">
          <div className="p-3.5 bg-corporate-100 rounded-2xl text-corporate-600 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-corporate-500 uppercase tracking-widest">Active Period</p>
            <h3 className="text-lg font-black text-foreground leading-tight">P1 2026</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center gap-4" data-testid="stat-card">
          <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Cut-Off</p>
            <h3 className="text-lg font-black text-foreground leading-tight">Dec 15, 2025</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center gap-4 border-primary/20 bg-primary/5" data-testid="stat-card">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Pending</p>
            <h3 className="text-lg font-black text-foreground leading-tight">12 Requests</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center gap-4" data-testid="stat-card">
          <div className="p-3.5 bg-vivid-green/10 rounded-2xl text-vivid-green">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-vivid-green uppercase tracking-widest">Eligible</p>
            <h3 className="text-lg font-black text-foreground leading-tight">184 Members</h3>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Monthly Upload Module (Span 2) ── */}
        <GlassCard className="lg:col-span-2 p-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-black text-xl tracking-tight text-foreground">Data Injection</h3>
            </div>
            <Badge variant="outline" className="font-bold border-2">OPTEL & TECHNO</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Upload official .xlsx or .csv templates to synchronize monthly Slot and Sprint performance data.
          </p>

          <UploadDropzone />
        </GlassCard>

        {/* ── Redemption Management (Span 1) ── */}
        <GlassCard className="p-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-corporate-100 rounded-xl">
                <Gift className="w-5 h-5 text-corporate-600" />
              </div>
              <h3 className="font-black text-xl tracking-tight text-foreground">Queue</h3>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[440px] pr-1 custom-scrollbar">
            {redemptions.map((req: RedemptionRequest, idx: number) => (
              <div 
                key={req.id}
                className="group p-4 bg-white/40 border border-slate-100 rounded-2xl hover:border-primary/30 hover:bg-white/80 transition-all cursor-default shadow-sm hover:shadow-md animate-slide-in-right"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-black text-foreground leading-tight">{req.employee}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{req.id}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-black uppercase tracking-tighter px-1.5 h-5",
                    req.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    req.status === "Verified" ? "bg-vivid-green/10 text-vivid-green border-vivid-green/20" :
                    "bg-destructive/5 text-destructive border-destructive/10"
                  )}>
                    {req.status}
                  </Badge>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-2.5 mb-3 border border-slate-100/50">
                  <p className="text-xs font-bold text-slate-700 truncate">{req.item}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Coins className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{req.tokens.toLocaleString()} TOKENS</span>
                  </div>
                </div>
                {req.status === "Pending" && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="h-8 flex-1 font-bold uppercase tracking-widest text-[9px] bg-vivid-green hover:bg-vivid-green/90 shadow-lg shadow-vivid-green/20">Verify</Button>
                    <Button size="sm" variant="outline" className="h-8 flex-1 font-bold uppercase tracking-widest text-[9px] text-destructive border-destructive/20 hover:bg-destructive/5 border-2">Reject</Button>
                  </div>
                )}
                {req.status !== "Pending" && (
                  <div className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-[0.2em] py-1">
                    Synchronized
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-xs h-11 border-2 mt-auto">
            View All Traffic <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </GlassCard>
      </div>
    </div>
  )
}
