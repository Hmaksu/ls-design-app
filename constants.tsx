import React from 'react';
import { 
  BookOpen, Video, ClipboardList, Search, Mic2, MessageCircle, 
  MonitorPlay, Users, Smile, Book, Mic, Settings, MapPin, 
  FlaskConical, Cpu, Gamepad2, Glasses, Bot, PenTool, PlusCircle
} from 'lucide-react';
import { DeliveryModeType } from './types';

export const DELIVERY_MODE_ICONS: Record<DeliveryModeType, React.ReactNode> = {
  [DeliveryModeType.READING]: <BookOpen className="w-5 h-5" />,
  [DeliveryModeType.VIDEO]: <Video className="w-5 h-5" />,
  [DeliveryModeType.SURVEY]: <ClipboardList className="w-5 h-5" />,
  [DeliveryModeType.CASE_STUDY]: <Search className="w-5 h-5" />,
  [DeliveryModeType.INTERVIEW]: <Mic2 className="w-5 h-5" />,
  [DeliveryModeType.DISCUSSION]: <MessageCircle className="w-5 h-5" />,
  [DeliveryModeType.PRESENTATION]: <MonitorPlay className="w-5 h-5" />,
  [DeliveryModeType.TEAMWORK]: <Users className="w-5 h-5" />,
  [DeliveryModeType.ROLE_PLAYING]: <Smile className="w-5 h-5" />,
  [DeliveryModeType.STORYTELLING]: <Book className="w-5 h-5" />,
  [DeliveryModeType.GUEST_SPEAKER]: <Mic className="w-5 h-5" />,
  [DeliveryModeType.PODCAST]: <Mic2 className="w-5 h-5" />, // Reusing Mic2 for now
  [DeliveryModeType.HANDS_ON]: <PenTool className="w-5 h-5" />,
  [DeliveryModeType.SITE_VISIT]: <MapPin className="w-5 h-5" />,
  [DeliveryModeType.LAB_WORK]: <FlaskConical className="w-5 h-5" />,
  [DeliveryModeType.SOFTWARE]: <Settings className="w-5 h-5" />,
  [DeliveryModeType.GAME]: <Gamepad2 className="w-5 h-5" />,
  [DeliveryModeType.VR]: <Glasses className="w-5 h-5" />,
  [DeliveryModeType.AI]: <Bot className="w-5 h-5" />,
  [DeliveryModeType.OTHER]: <PlusCircle className="w-5 h-5" />,
};

export const DELIVERY_MODE_LABELS: Record<DeliveryModeType, string> = {
  [DeliveryModeType.READING]: 'Reading',
  [DeliveryModeType.VIDEO]: 'Video',
  [DeliveryModeType.SURVEY]: 'Survey',
  [DeliveryModeType.CASE_STUDY]: 'Case Study',
  [DeliveryModeType.INTERVIEW]: 'Interview',
  [DeliveryModeType.DISCUSSION]: 'Discussion',
  [DeliveryModeType.PRESENTATION]: 'Presentation',
  [DeliveryModeType.TEAMWORK]: 'Teamwork',
  [DeliveryModeType.ROLE_PLAYING]: 'Role Playing',
  [DeliveryModeType.STORYTELLING]: 'Storytelling',
  [DeliveryModeType.GUEST_SPEAKER]: 'Guest Speaker',
  [DeliveryModeType.PODCAST]: 'Podcast',
  [DeliveryModeType.HANDS_ON]: 'Hands-on Exercise',
  [DeliveryModeType.SITE_VISIT]: 'Site Visit',
  [DeliveryModeType.LAB_WORK]: 'Lab Work',
  [DeliveryModeType.SOFTWARE]: 'Software',
  [DeliveryModeType.GAME]: 'Gamification',
  [DeliveryModeType.VR]: 'Virtual Reality',
  [DeliveryModeType.AI]: 'Artificial Intelligence',
  [DeliveryModeType.OTHER]: 'Other',
};

export const SDGS_LIST = [
  "1. No Poverty",
  "2. Zero Hunger",
  "3. Good Health and Well-being",
  "4. Quality Education",
  "5. Gender Equality",
  "6. Clean Water and Sanitation",
  "7. Affordable and Clean Energy",
  "8. Decent Work and Economic Growth",
  "9. Industry, Innovation and Infrastructure",
  "10. Reduced Inequalities",
  "11. Sustainable Cities and Communities",
  "12. Responsible Consumption and Production",
  "13. Climate Action",
  "14. Life Below Water",
  "15. Life on Land",
  "16. Peace, Justice and Strong Institutions",
  "17. Partnerships for the Goals"
];