import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/lib/api";
import { Download, Trash2, Upload } from "lucide-react";
import type { Document } from "@/types/assessment";

interface DocumentUploadProps {
  assessmentId: number;
  documents: Document[];
  isLoading: boolean;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ 
  assessmentId, 
  documents = [], 
  isLoading,
  onUploadComplete 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Convert FileList to array for easier handling
      const fileArray = Array.from(files);
      
      // Upload each file sequentially
      for (const file of fileArray) {
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 100MB.`);
        }
        
        await uploadDocument(assessmentId, file);
        
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`
        });
      }

      // Refresh documents list
      await queryClient.invalidateQueries({
        queryKey: ['documents', assessmentId]
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      const [fileType, base64Data] = doc.data.split(',');
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });

      // Refresh documents list
      await queryClient.invalidateQueries({
        queryKey: ['documents', assessmentId]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Evidence Documents</h4>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="relative"
            disabled={isUploading}
          >
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
            />
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Documents"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Upload evidence documents. You can select multiple files at once.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Uploaded Documents</h4>
          {isLoading && (
            <span className="text-sm text-muted-foreground animate-pulse">
              Loading...
            </span>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {doc.filename}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        )}
      </div>
    </div>
  );
}
