export interface CompanyInfo {
  name: string;
  rut: string;
  address: string;
  activity: string;
  contact: string;
}

export interface JobInfo {
  position: string;
  tasks: string;
  environment: string;
  equipment: string;
  materials: string;
  specialConditions: string;
  additionalInfo: string;
}

export interface Risk {
  name: string;
  consequences: string;
  measures: string[];
}

export interface RiskCategory {
  category: string;
  risks: Risk[];
}

export interface Protocol {
  name: string;
  description: string;
  applicable: boolean;
  url?: string; // Añadir propiedad opcional para la URL
}
