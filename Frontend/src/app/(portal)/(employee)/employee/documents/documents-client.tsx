"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  X 
} from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { employeeApi, type UserDocumentResponse } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface DocumentType {
  id: string;
  label: string;
  type: "ID_CARD_MITRA" | "KTP" | "NPWP";
  description: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { 
    id: "1", 
    label: "ID Card Mitra", 
    type: "ID_CARD_MITRA", 
    description: "Your official company partnership identification card." 
  },
  { 
    id: "2", 
    label: "KTP (Identity Card)", 
    type: "KTP", 
    description: "National ID card for identity verification." 
  },
  { 
    id: "3", 
    label: "NPWP (Tax ID)", 
    type: "NPWP", 
    description: "Personal tax identification number card." 
  },
];

export function DocumentsClient({ initialDocuments, token }: { initialDocuments: UserDocumentResponse[], token: string }) {
  const [documents, setDocuments] = useState<UserDocumentResponse[]>(initialDocuments);
  const [uploadingType, setUploadingingType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentType | null>(null);

  const getDocByType = (type: string) => documents.find(d => d.type === type);

  const handleUpload = async (type: string, file: File) => {
    setUploadingingType(type);
    try {
      const result = await employeeApi.uploadDocument(token, type, file);
      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== type);
        return [...filtered, result];
      });
      toast.success(`${type.replace(/_/g, ' ')} uploaded successfully!`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingingType(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    const docType = confirmDelete;
    try {
      await employeeApi.deleteDocument(token, docType.type);
      setDocuments(prev => prev.filter(d => d.type !== docType.type));
      toast.success(`${docType.label} removed`);
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete document");
    }
  };

  return (
    <div className="space-y-8 animate-fade-up-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = getDocByType(docType.type);
          const isUploading = uploadingType === docType.type;

          return (
            <DocumentUploadCard 
              key={docType.id}
              docType={docType}
              existingDoc={existingDoc}
              isUploading={isUploading}
              onUpload={(file) => handleUpload(docType.type, file)}
              onDelete={() => setConfirmDelete(docType)}
              onView={(url) => setPreviewUrl(url)}
            />
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent 
          className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 leading-none">
              <Eye size={16} className="text-primary" />
              Document Preview
            </DialogTitle>
            <DialogClose className="text-slate-400 hover:text-slate-600 transition-all outline-none flex items-center justify-center cursor-pointer">
              <X size={20} />
            </DialogClose>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center min-h-[400px]">
            {previewUrl && (
              <img 
                src={previewUrl.startsWith('http') ? previewUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/${previewUrl}`} 
                alt="Document Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Preview+Not+Available';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-sm">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <DialogHeader className="mb-0 p-0">
              <DialogTitle className="text-xl font-bold text-neutral-900 text-center">Remove Document?</DialogTitle>
              <DialogDescription className="text-neutral-500 text-sm leading-relaxed text-center mt-2">
                Are you sure you want to remove your <span className="font-bold text-neutral-900">{confirmDelete?.label}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex flex-row gap-3 mt-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(null)}
              className="flex-1 rounded-xl border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentUploadCard({ 
  docType, 
  existingDoc, 
  isUploading, 
  onUpload, 
  onDelete,
  onView
}: { 
  docType: DocumentType; 
  existingDoc?: UserDocumentResponse; 
  isUploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onView: (url: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        onUpload(file);
      }
    },
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: isUploading
  });

  return (
    <BentoCard className={cn(
      "flex flex-col h-full transition-all duration-300",
      existingDoc ? "border-success/20 bg-success/[0.02]" : "border-slate-200 bg-white"
    )}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors",
            existingDoc 
              ? "bg-success/10 border-success/20 text-success" 
              : "bg-primary/5 border-primary/10 text-primary"
          )}>
            <FileText size={24} />
          </div>
          {existingDoc && (
            <div className="flex items-center gap-1 text-success">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Uploaded</span>
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-lg text-black mb-1">{docType.label}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          {docType.description}
        </p>

        <div className="mt-auto space-y-3">
          {existingDoc ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 truncate">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <ImageIcon size={18} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-black truncate max-w-[120px]">{existingDoc.fileName}</span>
                    <span className="text-[10px] text-muted-foreground">{(existingDoc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center justify-center border border-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(existingDoc.fileUrl);
                    }}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center border border-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button 
                  variant="outline" 
                  className="w-full text-xs font-extrabold py-5 border-slate-200 hover:bg-slate-50 hover:border-primary transition-all rounded-xl"
                  disabled={isUploading}
                >
                  <Upload size={14} className="mr-2" />
                  Replace File
                </Button>
              </div>
            </div>
          ) : (
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs font-bold text-primary">Uploading...</span>
                </div>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Upload size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-black mb-1">
                    {isDragActive ? "Drop it here" : "Click or drag file"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    PNG, JPG, HEIC (Max 5MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
