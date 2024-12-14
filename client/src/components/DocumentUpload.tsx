import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/lib/api";
import { Download, Trash2, Upload } from "lucide-react";
import type { Document } from "@/types/assessment";
import { Progress } from "@/components/ui/progress";

interface DocumentUploadProps {
  assessmentId: number;
  documents: Document[];
  isLoading: boolean;
  onUploadComplete?: () => void;
}

export function DocumentUpload({
  assessmentId,
  documents,
  isLoading,
  onUploadComplete
}: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isUploading = Object.keys(uploadingFiles).length > 0;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileArray = Array.from(files);
      
      // Validate file sizes
      const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        throw new Error(
          `The following files exceed the 10MB limit: ${oversizedFiles
            .map(f => f.name)
            .join(", ")}`
        );
      }

      // Upload files sequentially
      for (const file of fileArray) {
        try {
          // Initialize progress for current file
          setUploadingFiles(prev => ({
            ...prev,
            [file.name]: 0
          }));

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadingFiles(prev => ({
              ...prev,
              [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
            }));
          }, 200);

          await uploadDocument(assessmentId, file);

          clearInterval(progressInterval);

          // Mark file as complete
          setUploadingFiles(prev => ({
            ...prev,
            [file.name]: 100
          }));

          toast({
            title: "Success",
            description: `${file.name} uploaded successfully`
          });

          // Remove file from progress after a delay
          setTimeout(() => {
            setUploadingFiles(prev => {
              const newState = { ...prev };
              delete newState[file.name];
              return newState;
            });
          }, 1000);

        } catch (error) {
          console.error('Upload error for file:', file.name, error);
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          
          // Remove failed file from progress
          setUploadingFiles(prev => {
            const newState = { ...prev };
            delete newState[file.name];
            return newState;
          });
        }
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
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive"
      });
    } finally {
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Extract the base64 data and file type
      const [header, base64Data] = doc.data.split(',');
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      // Create blob and download
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

      // Refresh documents list
      await queryClient.invalidateQueries({
        queryKey: ['documents', assessmentId]
      });

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });

    } catch (error) {
      console.error('Delete error:', error);
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
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Evidence Documents</h4>
          <Button
            variant="outline"
            className="relative"
            disabled={isUploading}
          >
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Documents"}
          </Button>
        </div>
        
        {/* Upload Progress */}
        {Object.entries(uploadingFiles).map(([filename, progress]) => (
          <div key={filename} className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground truncate">{filename}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        ))}

        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: Images, PDF, Word, Excel, Text files (Max 10MB per file)
        </p>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate flex-1">
                    {doc.filename}
                  </span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading documents..." : "No documents uploaded yet."}
          </p>
        )}
      </div>
    </div>
  );
}
