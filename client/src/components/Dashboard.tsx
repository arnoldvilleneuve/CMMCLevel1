import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPractices, getAssessments } from "@/lib/api";
import { Domain } from "@/types/assessment";

export default function Dashboard() {
  const { data: practices } = useQuery({
    queryKey: ['/api/practices'],
    queryFn: getPractices
  });

  const { data: assessments } = useQuery({
    queryKey: ['/api/assessments'],
    queryFn: getAssessments
  });

  if (!practices || !assessments) return null;

  const domains = practices.reduce<Record<string, Domain>>((acc, practice) => {
    if (!acc[practice.domain]) {
      acc[practice.domain] = {
        name: practice.domain,
        practices: []
      };
    }
    acc[practice.domain].practices.push(practice);
    return acc;
  }, {});

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.values(domains).map((domain) => {
        const domainPractices = domain.practices.length;
        const completedPractices = assessments.filter(
          a => domain.practices.some(p => p.practiceId === a.practiceId && a.status === 'Complete')
        ).length;
        const progress = (completedPractices / domainPractices) * 100;

        return (
          <Card key={domain.name}>
            <CardHeader>
              <CardTitle className="text-lg">{domain.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {completedPractices} of {domainPractices} practices complete
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
