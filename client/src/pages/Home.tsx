import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { getAssessments } from "@/lib/api";

export default function Home() {
  const { data: assessments } = useQuery({
    queryKey: ['/api/assessments'],
    queryFn: getAssessments
  });

  const totalPractices = 17;
  const completedPractices = assessments?.filter(a => a.status === 'Complete').length || 0;
  const progress = (completedPractices / totalPractices) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CMMC Level 1 Self-Assessment</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Track your assessment completion</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="mt-2 text-sm text-muted-foreground">
              {completedPractices} of {totalPractices} practices completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Begin your compliance journey</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Complete the assessment for each practice</li>
              <li>• Upload supporting evidence</li>
              <li>• Generate compliance reports</li>
              <li>• Track progress across domains</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
          alt="Professional office"
          className="rounded-lg object-cover h-48 w-full"
        />
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
          alt="Cybersecurity"
          className="rounded-lg object-cover h-48 w-full"
        />
        <img 
          src="https://images.unsplash.com/photo-1563452619267-bc16ef6cecec"
          alt="Security monitoring"
          className="rounded-lg object-cover h-48 w-full"
        />
      </div>
    </div>
  );
}
