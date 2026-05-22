"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import type { RewardCatalogItem } from "@/lib/api-client";

const rewardSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000),
  tokenCost: z.number().int().positive("Token cost must be greater than 0"),
  minTier: z.enum(["SAPHIRE", "EMERALD", "RUBY", "DIAMOND"]),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  stockEnabled: z.boolean(),
  stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
  isActive: z.boolean(),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (reward: RewardCatalogItem) => void;
  initialData?: RewardCatalogItem | null;
}

export function RewardFormModal({ isOpen, onClose, onSubmit, onDelete, initialData }: RewardFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: "",
      description: "",
      tokenCost: 1,
      minTier: "SAPHIRE",
      imageUrl: "",
      stockEnabled: false,
      stock: 0,
      isActive: true,
    },
  });

  const stockEnabled = watch("stockEnabled");
  const imageUrl = watch("imageUrl");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || "",
          tokenCost: initialData.tokenCost,
          minTier: initialData.minTier || "SAPHIRE",
          imageUrl: initialData.imageUrl || "",
          stockEnabled: initialData.stock !== null,
          stock: initialData.stock ?? 0,
          isActive: initialData.isActive,
        });
      } else {
        reset({
          name: "",
          description: "",
          tokenCost: 1,
          minTier: "SAPHIRE",
          imageUrl: "",
          stockEnabled: false,
          stock: 0,
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (values: RewardFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = {
        name: values.name,
        description: values.description,
        tokenCost: values.tokenCost,
        minTier: values.minTier,
        imageUrl: values.imageUrl || null,
        stock: values.stockEnabled ? values.stock : null,
        isActive: values.isActive,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save reward item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-neutral-900">
            {isEditing ? "Edit Reward" : "Add New Reward"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form id="reward-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            {/* Image Preview & URL */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Reward Image
              </label>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-neutral-400 text-[10px] font-bold text-center p-2 uppercase tracking-tighter">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    {...register("imageUrl")}
                    type="text"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm shadow-sm"
                    placeholder="Enter image URL (e.g. https://...)"
                  />
                  {errors.imageUrl && <p className="mt-1.5 text-sm text-red-500">{errors.imageUrl.message}</p>}
                  <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
                    Provide a direct link to the reward image. Recommended aspect ratio 4:3.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Reward Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-sm"
                placeholder="e.g., E-Voucher Tokopedia 100k"
              />
              {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none shadow-sm"
                placeholder="Details about this reward..."
              />
              {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            {/* Token Cost */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Token Cost <span className="text-red-500">*</span>
              </label>
              <input
                {...register("tokenCost", { valueAsNumber: true })}
                type="number"
                min={1}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-mono shadow-sm"
              />
              {errors.tokenCost && <p className="mt-1.5 text-sm text-red-500">{errors.tokenCost.message}</p>}
            </div>

            {/* Minimum Tier */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Minimum Membership Tier <span className="text-red-500">*</span>
              </label>
              <select
                {...register("minTier")}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-sm appearance-none"
              >
                <option value="SAPHIRE">Saphire</option>
                <option value="EMERALD">Emerald</option>
                <option value="RUBY">Ruby</option>
                <option value="DIAMOND">Diamond</option>
              </select>
              {errors.minTier && <p className="mt-1.5 text-sm text-red-500">{errors.minTier.message}</p>}
            </div>

            {/* Stock Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
              <div>
                <label className="text-sm font-medium text-neutral-900">Limit Stock Availability</label>
                <p className="text-xs text-neutral-500 mt-0.5">Toggle if this reward has limited stock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("stockEnabled")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {/* Stock Input (Conditionally rendered) */}
            {stockEnabled && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Available Stock <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("stock", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-mono shadow-sm"
                />
                {errors.stock && <p className="mt-1.5 text-sm text-red-500">{errors.stock.message}</p>}
              </div>
            )}
            
            {/* Status Toggle (Only for edit) */}
            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
                <div>
                  <label className="text-sm font-medium text-neutral-900">Active Status</label>
                  <p className="text-xs text-neutral-500 mt-0.5">Inactive rewards are hidden from Mitras</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-100 bg-neutral-50 flex-shrink-0">
          <div>
            {isEditing && onDelete && initialData && (
              <button
                type="button"
                onClick={() => onDelete(initialData)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="reward-form"
              disabled={isSubmitting}
              className="flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-semibold text-black bg-accent hover:bg-accent/90 rounded-xl transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Save Changes" : "Create Reward"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
