import { Assessment, Practice, Report } from "@/types/assessment";

export async function getPractices(): Promise<Practice[]> {
  const res = await fetch('/api/practices', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch practices');
  return res.json();
}

export async function getAssessments(): Promise<Assessment[]> {
  const res = await fetch('/api/assessments', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch assessments');
  return res.json();
}

export async function updateAssessment(assessment: Partial<Assessment>): Promise<Assessment> {
  const res = await fetch('/api/assessments', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assessment)
  });
  if (!res.ok) throw new Error('Failed to update assessment');
  return res.json();
}

export async function generateReport(title: string): Promise<Report> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}
