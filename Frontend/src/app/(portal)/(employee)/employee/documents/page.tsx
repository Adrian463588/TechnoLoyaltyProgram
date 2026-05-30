/**
 * /employee/documents — Document Upload Page (Server Component)
 */
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, type UserDocumentResponse } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { BentoCard } from "@/components/ui/bento-card";
import { FileText, Info } from "lucide-react";
import { DocumentsClient } from "./documents-client";

export const metadata = { title: "My Documents | Berijalan Loyalty" };

export default async function DocumentsPage() {
  await auth();
  const token = await getServerToken();

  let documents: UserDocumentResponse[] = [];
  try {
    documents = await employeeApi.getDocuments(token);
  } catch (err) {
    console.warn(
      "[documents] failed to fetch user documents:",
      err instanceof Error ? err.message : err,
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
              <FileText size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                My Documents
              </h1>
              <p className="text-sm text-[--color-text-secondary]">
                Upload and manage your identification documents for verification.
              </p>
            </div>
          </div>
        </div>

        {/* Informational Note */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 animate-fade-up-in" style={{ animationDelay: '100ms' }}>
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 shrink-0">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Important Information</h4>
            <p className="text-xs text-blue-800/70 leading-relaxed">
              Please ensure all uploaded documents are clearly legible and the details match your profile. 
              Accepted formats: <span className="font-bold text-blue-900">PNG, JPG, JPEG, and HEIC</span>. 
              Maximum file size is <span className="font-bold text-blue-900">5MB per document</span>.
            </p>
          </div>
        </div>

        {/* Upload Interface */}
        <DocumentsClient initialDocuments={documents} token={token} />
        
        {/* Verification Note */}
        <div className="pt-8 border-t border-slate-200">
           <p className="text-[11px] text-muted-foreground text-center italic leading-relaxed max-w-2xl mx-auto">
            Uploaded documents are stored securely and only accessible by authorized HC PM personnel for identity verification and administrative purposes. 
            By uploading these documents, you agree to Berijalan&apos;s data processing policies.
          </p>
        </div>
      </div>
    </div>
  );
}
