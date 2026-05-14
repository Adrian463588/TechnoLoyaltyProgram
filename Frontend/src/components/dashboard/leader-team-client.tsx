"use client";

import { useState, useMemo } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { AlertTriangle, Coins, Search, Users } from "lucide-react";
import { Division, TierStatus } from "@/types";
import type { TeamSummaryResponse } from "@/lib/api-client";

type TeamMember = {
  id: string;
  name: string;
  division: Division;
  tokens: number;
  tier: TierStatus;
  status: "Active" | "Downgraded" | "Reset";
};

const mockTeamData: TeamMember[] = [
  { id: "EMP-001", name: "Alice Optel", division: "Optel", tokens: 5200, tier: "Gold", status: "Active" },
  { id: "EMP-005", name: "Bob Techno", division: "Techno", tokens: 1200, tier: "Silver", status: "Downgraded" },
  { id: "EMP-012", name: "Charlie Optel", division: "Optel", tokens: 0, tier: "Bronze", status: "Reset" },
  { id: "EMP-018", name: "Diana Techno", division: "Techno", tokens: 8500, tier: "Platinum", status: "Active" },
  { id: "EMP-022", name: "Eve Optel", division: "Optel", tokens: 3000, tier: "Silver", status: "Active" },
];

export function LeaderTeamClient({ data }: { data: TeamSummaryResponse[] | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<"All" | Division>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Downgraded" | "Reset">("All");

  const teamData: TeamMember[] = data ? data.map(m => ({
    id: m.id,
    name: m.name,
    division: (m.division === "OPTEL" ? "Optel" : "Techno") as Division,
    tokens: m.tokens,
    tier: (m.tier.charAt(0).toUpperCase() + m.tier.slice(1).toLowerCase()) as TierStatus,
    status: (m.status.charAt(0).toUpperCase() + m.status.slice(1).toLowerCase()) as "Active" | "Downgraded" | "Reset",
  })) : mockTeamData;

  const filteredData = useMemo(() => {
    return teamData.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDivision = divisionFilter === "All" || m.division === divisionFilter;
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      return matchesSearch && matchesDivision && matchesStatus;
    });
  }, [teamData, searchQuery, divisionFilter, statusFilter]);

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.getValue("name")}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: "division",
      header: "Division",
      cell: ({ row }) => (
        <Badge variant="outline" className={
          row.getValue("division") === "Optel"
            ? "bg-secondary/10 text-secondary border-secondary/30"
            : "bg-primary/10 text-primary border-primary/30"
        }>
          {row.getValue("division") as string}
        </Badge>
      ),
    },
    {
      accessorKey: "tokens",
      header: "Total Tokens",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Coins className="w-3.5 h-3.5 text-primary" />
          {(row.getValue("tokens") as number).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "tier",
      header: "Current Tier",
      cell: ({ row }) => <TierBadge tier={row.getValue("tier") as TierStatus} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={row.getValue("status") as "Active" | "Downgraded" | "Reset" | "Inactive"} />
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <button
          className="text-sm text-primary font-medium hover:underline"
          data-testid="leader-team-table-action-view"
        >
          View Detail
        </button>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalTokens = teamData.reduce((acc, curr) => acc + curr.tokens, 0);
  const eligibleMembers = teamData.filter((m) => m.tokens >= 2000).length;
  const alertsCount = teamData.filter((m) => m.status !== "Active").length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-fade-up-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team View</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your team&apos;s loyalty performance and eligibility.
          </p>
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Team Aggregate Tokens"
          value={totalTokens.toLocaleString()}
          icon={Coins}
          description="Combined across all members"
          accent="primary"
          data-testid="leader-team-total-tokens"
        />
        <StatCard
          label="Eligible for Rewards"
          value={`${eligibleMembers} Members`}
          icon={Users}
          description="Have 2,000+ tokens"
          accent="secondary"
          data-testid="leader-team-eligible-members"
        />
        <StatCard
          label="Alerts (Reset/Downgrade)"
          value={`${alertsCount} Members`}
          icon={AlertTriangle}
          description="Need attention"
          accent="destructive"
          data-testid="leader-team-alerts-count"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            className="pl-9 bg-muted/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Optel", "Techno"] as const).map((div) => (
            <Button
              key={div}
              variant={divisionFilter === div ? "default" : "outline"}
              size="sm"
              onClick={() => setDivisionFilter(div)}
            >
              {div}
            </Button>
          ))}
          <div className="h-8 w-px bg-border mx-1" />
          {(["All", "Active", "Downgraded", "Reset"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Members Data Grid */}
      <BentoCard className="overflow-x-auto p-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">Team Members</h3>
          <span className="text-xs text-muted-foreground">
            {filteredData.length} of {teamData.length} members
          </span>
        </div>
        <Table data-testid="leader-team-table">
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-testid="leader-team-table-row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No members match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </BentoCard>
    </div>
  );
}
