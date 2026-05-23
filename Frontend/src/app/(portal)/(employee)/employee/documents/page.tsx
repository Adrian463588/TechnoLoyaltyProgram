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
        
        {/* Header Banner */}
        <BentoCard className="p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="h-6 w-6 text-[--color-accent]" />
            <h1 className="text-card-heading text-2xl">My Documents</h1>
          </div>
          <p className="text-[--color-text-secondary]">
            Upload and manage your identification documents for verification.
          </p>
        </BentoCard>

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
            By uploading these documents, you agree to Berijalan's data processing policies.
          </p>
        </div>
      </div>
    </div>
  );
}
