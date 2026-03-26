export interface Patient {
  id?: string;
  age: number;
  gender: 'male' | 'female';
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  chvId: string;
  createdAt: any;
}

export interface Diagnosis {
  id?: string;
  patientId: string;
  symptoms: string[];
  symptomSeverity: Record<string, number>;
  diagnosis: {
    primaryDiagnosis: string;
    secondaryDiagnosis?: string;
    confidence: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    reasoning: string;
    keyFindings: string[];
    treatment: {
      immediate: string;
      medication: string;
      monitoring: string;
    };
    redFlags: string[];
    referralNeeded: boolean;
    followUp: string;
  };
  malnutritionStatus: 'normal' | 'MAM' | 'SAM' | 'at_risk' | 'not_assessed';
  malnutritionConfidence: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: any;
  chvId: string;
}

export interface Alert {
  id?: string;
  disease: string;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  caseCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: any;
  resolved: boolean;
  districtNotified?: boolean;
}
