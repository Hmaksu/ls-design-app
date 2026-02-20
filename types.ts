export enum BloomLevel {
  REMEMBERING = 'Remembering',
  UNDERSTANDING = 'Understanding',
  APPLYING = 'Applying',
  ANALYZING = 'Analyzing',
  EVALUATING = 'Evaluating',
  CREATING = 'Creating'
}

export enum DeliveryModeType {
  READING = 'Reading',
  VIDEO = 'Video',
  SURVEY = 'Survey',
  CASE_STUDY = 'Case Study',
  INTERVIEW = 'Interview',
  DISCUSSION = 'Discussion',
  PRESENTATION = 'Presentation',
  TEAMWORK = 'Teamwork',
  ROLE_PLAYING = 'Role Playing',
  STORYTELLING = 'Storytelling',
  GUEST_SPEAKER = 'Guest Speaker',
  PODCAST = 'Podcast',
  HANDS_ON = 'Hands-on Exercise',
  SITE_VISIT = 'Site Visit',
  LAB_WORK = 'Lab Work',
  SOFTWARE = 'Software',
  GAME = 'Game/Gamification',
  VR = 'Virtual Reality',
  AI = 'Artificial Intelligence',
  OTHER = 'Other'
}

export interface LearningObjective {
  id: string;
  text: string;
  isSmart: boolean;
}

export interface LSContent {
  id: string;
  title: string;
  duration: number; // minutes
  deliveryModes: DeliveryModeType[];
  deliveryLinks: Record<string, string>; // Key: DeliveryModeType, Value: URL
  customDeliveryMode?: string; // For OTHER type
  subContents?: LSContent[];
}

export interface LSModule {
  id: string;
  title: string;
  contents: LSContent[]; 
  associatedObjectiveIds: string[]; // IDs of Global LearningObjectives
  learningOutcome: string; // Module specific outcome
  bloomLevel: BloomLevel;
  assessmentMethods: string[];
  description: string;
}

export interface LearningStation {
  id: string;
  // --- Identity ---
  code: string;
  initialDesignDate: string;
  finalRevisionDate: string;
  ects: string;
  title: string;
  
  // --- Content ---
  subject: string;
  keywords: string;
  level: 'Basic' | 'Intermediate' | 'Advanced';
  targetAudience: string;
  description: string; // Short description
  
  // --- Objectives & Outcomes ---
  objectives: LearningObjective[]; // LObjs
  globalLearningOutcomes: string; // LOs (Global textual description)
  relatedSDGs: string; // Text field for SDGs
  
  // --- Assessment & Logistics ---
  globalAssessmentMethods: string; // Description of assessment methods
  calendar: string; // Implementation calendar
  durationInPerson: string; // hours
  durationDigital: string; // hours
  
  // --- Requirements ---
  prerequisites: string;
  specialNeeds: string;
  materialsAndResources: string;
  quota: string;
  language: string;
  notes: string;

  modules: LSModule[];
  createdAt: string;
  updatedAt: string;
}

export type LSContextType = {
  currentLS: LearningStation;
  updateLS: (data: Partial<LearningStation>) => void;
  addModule: () => void;
  updateModule: (id: string, data: Partial<LSModule>) => void;
  removeModule: (id: string) => void;
  addObjective: () => void;
  updateObjective: (id: string, text: string) => void;
  removeObjective: (id: string) => void;
  saveLS: () => void;
};