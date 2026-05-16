/**
 * /leader/team/[employeeId] — Team member detail (PRD TL-03)
 *
 * Server Component: fetches member detail from backend with TL RBAC enforced server-side.
 * Falls back gracefully if backend unavailable.
 */
import { auth, getServerToken } from "@/lib/auth";
import { leaderApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const metadata = { title: "Member Detail | Berijalan Loyalty" };

export default async function MemberDetailPage({
  params,
}: {
  params: { employeeId: string };
}) {
  await auth();
  const token = await getServerToken();

  let detail = null;
  try {
    detail = await leaderApi.getMemberDetail(token, params.employeeId);
  } catch {
    notFound();
  }

  if (!detail) notFound();

  const { member, ledger } = detail;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 p-6">
      {/* Back */}
      <Link
        href="/leader/team"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Team
      </Link>

      {/* Header */}
      <BentoCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{member.npk}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <TierBadge tier={member.tier as "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND"} />
              <EmployeeStatusBadge status={member.status as "ACTIVE" | "DOWNGRADED" | "RESET" | "INACTIVE"} />
              <span className="text-xs text-muted-foreground">{member.division}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {member.totalTokens?.toLocaleString() ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Token Ledger History */}
      <BentoCard className="overflow-hidden p-0">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-lg">Token History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Recent 20 ledger entries</p>
        </div>
        {ledger.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No token history found.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance After</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.eventType}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        entry.amount >= 0
                          ? "text-emerald-600 font-semibold"
                          : "text-destructive font-semibold"
                      }
                    >
                      {entry.amount >= 0 ? "+" : ""}
                      {entry.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.balanceAfter.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {entry.reason ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </BentoCard>
    </div>
  );
}
