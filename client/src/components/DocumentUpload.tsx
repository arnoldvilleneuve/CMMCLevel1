import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/lib/api";
import type { Document } from "@/types/assessment";

interface DocumentUploadProps {
  assessmentId: number;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ assessmentId, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadDocument(assessmentId, file);
      
      toast({
        title: "Success",
        description: `${file.name} uploaded successfully`
      });

      // Refresh documents list
      await queryClient.invalidateQueries({
        queryKey: ['documents', assessmentId]
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Upload Evidence Documents</h4>
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block flex-1 text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              disabled:opacity-50"
          />
          {isUploading && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Uploading...
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Upload evidence documents one at a time. All uploaded documents will be preserved.
        </p>
      </div>
    </div>
  );
}
