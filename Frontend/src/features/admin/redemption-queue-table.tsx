"use client";

import React, { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { RedemptionStatusChip, RedemptionStatus } from "@/components/shared/status-badge";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import { DocumentVerificationDrawer } from "./document-verification-drawer";
import { motion } from "framer-motion";

type RedemptionRequest = {
  id: string;
  mitraName: string;
  rewardName: string;
  tokenCost: number;
  status: RedemptionStatus;
  submittedAt: string;
};

const mockData: RedemptionRequest[] = [
  { id: "REQ-001", mitraName: "John Doe", rewardName: "Starbucks Voucher", tokenCost: 50, status: "PENDING_VERIFICATION", submittedAt: "2026-10-14" },
  { id: "REQ-002", mitraName: "Jane Smith", rewardName: "Wireless Mouse", tokenCost: 500, status: "VERIFIED", submittedAt: "2026-10-12" },
  { id: "REQ-003", mitraName: "Bob Johnson", rewardName: "Cinema XXI Ticket", tokenCost: 100, status: "COMPLETED", submittedAt: "2026-10-10" },
];

const columnHelper = createColumnHelper<RedemptionRequest>();

export function RedemptionQueueTable() {
  const [data] = useState(() => [...mockData]);
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "Request ID",
      cell: info => <span className="font-mono text-[--color-text-secondary]">{info.getValue()}</span>,
    }),
    columnHelper.accessor("mitraName", {
      header: "Mitra Name",
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("rewardName", {
      header: "Reward",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("tokenCost", {
      header: "Cost",
      cell: info => <span className="font-mono">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => <RedemptionStatusChip status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      cell: info => (
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => setSelectedRequest(info.row.original)}
          className="p-2 hover:bg-white/10 rounded-md transition-colors text-[--color-brand-hover]"
          title="Verify Documents"
        >
          <CheckSquare size={18} />
        </motion.button>
      ),
    })
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="text-label border-b border-[--color-border-subtle]">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="pb-3 px-4 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-sm">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="table-row border-b border-[--color-border-subtle] last:border-0">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-4 px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[--color-border-subtle]">
        <div className="text-sm text-[--color-text-secondary]">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded-md border border-[--color-border-subtle] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded-md border border-[--color-border-subtle] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {selectedRequest && (
        <DocumentVerificationDrawer 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
        />
      )}
    </div>
  );
}
