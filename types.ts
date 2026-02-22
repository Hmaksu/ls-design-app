export enum BloomLevel {
  REMEMBERING = 'Remembering',
  UNDERSTANDING = 'Understanding',
  APPLYING = 'Applying',
  ANALYZING = 'Analyzing',
  EVALUATING = 'Evaluating',
  CREATING = 'Creating'
}

export enum DeliveryModeType {
  PRESANTATION = 'PRESENTATION',
  READING = 'READING',
  AI = 'AI',
  ANIMATION = 'ANIMATION',
  APPLICATION = 'APPLICATION',
  ASSESSMENT = 'ASSESSMENT',
  CASE_STUDY = 'CASE_STUDY',
  CATALOG = 'CATALOG',
  CHECKLIST = 'CHECKLIST',
  DATA_POINTS = 'DATA_POINTS',
  DATA_SET = 'DATA_SET',
  DISCUSSION = 'DISCUSSION',
  FACILITATION = 'FACILITATION',
  FILM_VIDEO = 'FILM_VIDEO',
  FLOWCHART = 'FLOWCHART',
  GAMIFICATION = 'GAMIFICATION',
  GUEST_SPEAKER = 'GUEST_SPEAKER',
  HANDS_ON = 'HANDS_ON',
  INFOGRAPHIC = 'INFOGRAPHIC',
  INTERVIEW = 'INTERVIEW',
  KINESTHETIC = 'KINESTHETIC',
  LAB_WORK = 'LAB_WORK',
  MENTORING = 'MENTORING',
  MUSIC = 'MUSIC',
  ONLINE_REMOTE = 'ONLINE_REMOTE',
  PMP_EXAM = 'PMP_EXAM',
  PMI_CONTENT = 'PMI_CONTENT',
  PODCAST = 'PODCAST',
  REALITY = 'REALITY',
  REFLECTION = 'REFLECTION',
  ROLE_PLAYING = 'ROLE_PLAYING',
  SAMPLE = 'SAMPLE',
  SCENT = 'SCENT',
  SITE_VISIT = 'SITE_VISIT',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  SOFTWARE = 'SOFTWARE',
  STORYTELLING = 'STORYTELLING',
  SURVEY = 'SURVEY',
  TEAMWORK = 'TEAMWORK',
  TEMPLATE = 'TEMPLATE',
  VR = 'VR',
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
