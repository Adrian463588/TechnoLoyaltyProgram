import { Badge } from "@/components/ui/badge";
import { RewardRequestStatus, TierStatus } from "@/types";
import { AlertTriangle, CheckCircle, Clock, Package, ShieldAlert, Truck, XCircle } from "lucide-react";

interface RedemptionStatusBadgeProps {
  status: RewardRequestStatus;
}

export function RedemptionStatusBadge({ status }: RedemptionStatusBadgeProps) {
  switch (status) {
    case "Pending":
      return (
        <Badge className="bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
    case "Verified":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
          <CheckCircle className="w-3 h-3 mr-1" /> Verified
        </Badge>
      );
    case "Rejected":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>
      );
    case "Purchased":
      return (
        <Badge className="bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20">
          <Package className="w-3 h-3 mr-1" /> Purchased
        </Badge>
      );
    case "PickupScheduled":
      return (
        <Badge className="bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30">
          <Truck className="w-3 h-3 mr-1" /> Scheduled
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-primary/20 text-primary border-primary/40 hover:bg-primary/30">
          <CheckCircle className="w-3 h-3 mr-1" /> Completed
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface TierBadgeProps {
  tier: TierStatus;
}

const tierConfig: Record<TierStatus, { className: string; label: string }> = {
  Bronze: {
    className: "bg-orange-950/30 text-orange-400 border-orange-400/30",
    label: "🥉 Bronze",
  },
  Silver: {
    className: "bg-slate-700/30 text-slate-300 border-slate-400/30",
    label: "🥈 Silver",
  },
  Gold: {
    className: "bg-yellow-950/30 text-yellow-400 border-yellow-400/30",
    label: "🥇 Gold",
  },
  Platinum: {
    className: "bg-cyan-950/30 text-cyan-300 border-cyan-400/30",
    label: "💎 Platinum",
  },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

interface EmployeeStatusBadgeProps {
  status: "Active" | "Downgraded" | "Reset" | "Inactive";
}

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
          <CheckCircle className="w-3 h-3 mr-1" /> Active
        </Badge>
      );
    case "Downgraded":
      return (
        <Badge className="bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Downgraded
        </Badge>
      );
    case "Reset":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
          <ShieldAlert className="w-3 h-3 mr-1" /> Reset
        </Badge>
      );
    case "Inactive":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Inactive
        </Badge>
      );
  }
}
