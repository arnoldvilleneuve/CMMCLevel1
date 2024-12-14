import { DocumentUpload } from "@/components/DocumentUpload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { updateAssessment, uploadDocument, getDocuments } from "@/lib/api";
import type { Practice, Assessment, Document } from "@/types/assessment";
import { useState } from "react";

const assessmentSchema = z.object({
  evidence: z.string().min(1, "Evidence is required"),
  status: z.enum(["Not Started", "In Progress", "Complete"])
});

interface AssessmentFormProps {
  practice: Practice;
  currentAssessment?: Assessment;
  onSave: () => void;
}

export default function AssessmentForm({ practice, currentAssessment, onSave }: AssessmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents', currentAssessment?.id],
    queryFn: () => currentAssessment?.id ? getDocuments(currentAssessment.id) : Promise.resolve([]),
    enabled: !!currentAssessment?.id
  });

  const form = useForm<z.infer<typeof assessmentSchema>>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      evidence: currentAssessment?.evidence || "",
      status: currentAssessment?.status || "Not Started"
    }
  });

  async function onSubmit(values: z.infer<typeof assessmentSchema>) {
    try {
      await updateAssessment({
        practiceId: practice.practiceId,
        ...values
      });
      toast({
        title: "Assessment saved",
        description: "Your assessment has been successfully updated."
      });
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assessment.",
        variant: "destructive"
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle>{practice.practiceId} - {practice.name}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Provide detailed evidence of how your organization implements this practice. Include specific examples, configurations, and documentation references.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="mt-2">{practice.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document your evidence here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <div className="space-y-4 text-sm">
                      <div className="space-y-2">
                        <span className="font-medium block">Assessment Guidance:</span>
                        <span className="block">{practice.assessment}</span>
                      </div>
                      <div className="space-y-2">
                        <span className="font-medium block">Assessment Methods:</span>
                        <div className="pl-5 space-y-1">
                          • EXAMINE organizational policies and procedures
                          • INTERVIEW personnel responsible for implementing controls
                          • TEST implemented controls and mechanisms
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="font-medium block">Evidence Examples:</span>
                        <div className="pl-5 space-y-1">
                          • Screenshots of implemented controls
                          • System configuration documentation
                          • Relevant policies and procedures
                          • Access control lists or logs
                        </div>
                      </div>
                    </div>
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {currentAssessment?.id && (
                <div className="border-t pt-4">
                  <DocumentUpload
                    assessmentId={currentAssessment.id}
                    documents={documents}
                    isLoading={isLoadingDocuments}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({
                        queryKey: ['documents', currentAssessment.id]
                      });
                    }}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit">Save Assessment</Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}