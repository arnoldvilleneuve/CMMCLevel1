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
export async function uploadDocument(assessmentId: number, file: File): Promise<Document> {
  const reader = new FileReader();
  const data = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(`/api/assessments/${assessmentId}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      data: data
    })
  });
  
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function getDocuments(assessmentId: number): Promise<Document[]> {
  const res = await fetch(`/api/assessments/${assessmentId}/documents`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

