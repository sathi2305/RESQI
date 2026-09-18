export type PriorityLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MODERATE' | 'P4_LOW';

export type IncidentCategory = 
  | 'MEDICAL' 
  | 'FLOOD_RESCUE' 
  | 'TRAPPED' 
  | 'FIRE_HAZARD' 
  | 'FOOD_WATER' 
  | 'EVACUATION' 
  | 'SPECIAL_CARE';

export type IncidentStatus = 
  | 'PENDING' 
  | 'DISPATCHED' 
  | 'EN_ROUTE' 
  | 'ON_SCENE' 
  | 'RESOLVED' 
  | 'CANCELLED';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  landmark?: string;
  accuracy?: number; // in meters
}

export interface Incident {
  id: string;
  createdAt: string;
  reporterName: string;
  contactNumber: string;
  category: IncidentCategory;
  priority: PriorityLevel;
  status: IncidentStatus;
  location: LocationData;
  description: string;
  peopleCount: {
    adults: number;
    children: number;
    injured: number;
    pets: number;
  };
  immediateHazards: string[];
  medicalConditions: string[];
  equipmentNeeded: string[];
  recommendedSkills: string[];
  firstAidInstructions: string[];
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerPhone?: string;
  assignedAt?: string;
  etaMinutes?: number;
  aiTriageSummary: string;
  notes?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  callsign: string;
  phone: string;
  email: string;
  status: 'AVAILABLE' | 'RESPONDING' | 'ON_SCENE' | 'OFFLINE';
  skills: string[];
  equipment: string[];
  vehicleType: string;
  location: LocationData;
  activeIncidentId?: string;
  completedMissions: number;
  rating: number;
  certifiedBadges: string[];
}

export interface Shelter {
  id: string;
  name: string;
  type: 'EVAC_CENTER' | 'MEDICAL_STATION' | 'SUPPLY_DEPOT' | 'ANIMAL_SHELTER';
  location: LocationData;
  capacity: number;
  occupied: number;
  supplies: {
    waterBottles: number;
    mrePacks: number;
    firstAidKits: number;
    blankets: number;
    powerGenerators: number;
  };
  medicalStaffPresent: boolean;
  contactPhone: string;
  status: 'OPEN' | 'AT_CAPACITY' | 'RESTRICTED';
}

export interface IncidentMessage {
  id: string;
  incidentId: string;
  senderId: string;
  senderName: string;
  senderRole: 'VICTIM' | 'VOLUNTEER' | 'DISPATCHER' | 'SYSTEM' | 'AI_ASSISTANT';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

export interface SituationReport {
  timestamp: string;
  overallThreatLevel: 'CRITICAL' | 'ELEVATED' | 'STABLE';
  summary: string;
  criticalSectors: {
    name: string;
    incidentCount: number;
    riskFactor: string;
  }[];
  keyBottlenecks: string[];
  recommendations: string[];
  volunteerDeploymentStatus: string;
}

export type ChatActionType = 
  | 'NAVIGATE_TAB' 
  | 'VIEW_INCIDENT' 
  | 'VIEW_SHELTER' 
  | 'PREFILL_SOS' 
  | 'TOGGLE_SIREN' 
  | 'CLAIM_INCIDENT';

export interface ChatAction {
  label: string;
  actionType: ChatActionType;
  payload?: any;
}

export interface ProjectChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actions?: ChatAction[];
  suggestedPrompts?: string[];
  roleScope?: 'CIVILIAN' | 'VOLUNTEER' | 'DISPATCHER';
}
