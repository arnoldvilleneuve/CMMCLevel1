export interface Practice {
  id: number;
  domain: string;
  practiceId: string;
  name: string;
  description: string;
  assessment: string;
}

export interface Assessment {
  id: number;
  practiceId: string;
  evidence: string;
  status: 'Not Started' | 'In Progress' | 'Complete';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  title: string;
  data: any;
  createdAt: string;
}

export interface Domain {
  name: string;
  practices: Practice[];
}
