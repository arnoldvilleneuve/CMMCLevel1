import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getPractices, getAssessments } from "@/lib/api";
import AssessmentForm from "@/components/AssessmentForm";
import { queryClient } from "@/lib/queryClient";
import { Domain } from "@/types/assessment";

export default function Assessment() {
  const [currentDomain, setCurrentDomain] = useState<string>("");

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

  const domainList = Object.values(domains);
  if (!currentDomain && domainList.length > 0) {
    setCurrentDomain(domainList[0].name);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security Practice Assessment</h1>

      <Tabs value={currentDomain} onValueChange={setCurrentDomain}>
        <TabsList className="mb-4">
          {domainList.map((domain) => (
            <TabsTrigger key={domain.name} value={domain.name}>
              {domain.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {domainList.map((domain) => (
          <TabsContent key={domain.name} value={domain.name} className="space-y-6">
            {domain.practices.map((practice) => (
              <AssessmentForm
                key={practice.id}
                practice={practice}
                currentAssessment={assessments.find(
                  a => a.practiceId === practice.practiceId
                )}
                onSave={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
                }}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
