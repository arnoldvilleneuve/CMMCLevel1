import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/lib/api";
import { Download, Trash2, Upload } from "lucide-react";
import type { Document } from "@/types/assessment";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadProps {
  assessmentId: number;
  documents?: Document[];
  isLoading?: boolean;
  onUploadComplete?: () => void;
}

export function DocumentUpload({
  assessmentId,
  documents = [],
  isLoading = false,
  onUploadComplete
}: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isUploading = Object.keys(uploadingFiles).length > 0;

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  const uploadFileInChunks = async (file: File, documentId: number) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      try {
        const response = await fetch(
          `/api/assessments/${assessmentId}/documents/${documentId}/chunks/${chunkIndex}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream'
            },
            body: chunk
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex}`);
        }
        
        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadingFiles(prev => ({
          ...prev,
          [file.name]: progress
        }));
        
      } catch (error) {
        throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setError(null);

    try {
      const fileArray = Array.from(files);
      const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB limit
      
      // Validate file sizes
      const oversizedFiles = fileArray.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(
          `The following files exceed the 2GB limit: ${oversizedFiles
            .map(f => f.name)
            .join(", ")}`
        );
      }

      // Upload files sequentially
      for (const file of fileArray) {
        try {
          setUploadingFiles(prev => ({
            ...prev,
            [file.name]: 0
          }));

          // Initialize upload
          const response = await fetch(`/api/assessments/${assessmentId}/documents/init`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: file.name,
              totalSize: file.size,
              totalChunks: Math.ceil(file.size / CHUNK_SIZE)
            })
          });

          if (!response.ok) {
            throw new Error('Failed to initialize upload');
          }

          const document = await response.json();
          
          // Upload chunks
          await uploadFileInChunks(file, document.id);

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
          setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
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
      setError(error instanceof Error ? error.message : "Failed to upload documents");
    } finally {
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Extract the base64 data
      const [header, base64Data] = doc.data.split(',');
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
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
        description: error instanceof Error ? error.message : "Failed to delete document",
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
            className={cn("relative", isUploading && "cursor-not-allowed opacity-50")}
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
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
