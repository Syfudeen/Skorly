export interface Student {
  id: string;
  name: string;
  regNo: string;
  dept: string;
  year: string;
  platformIds: {
    codechef?: string;
    leetcode?: string;
    codeforces?: string;
    atcoder?: string;
    codolio?: string;
    github?: string;
  };
  overallScore: number;
  previousScore?: number;
  platformScores: PlatformScore[];
  trend: 'up' | 'down' | 'stable';
  performanceLevel: 'high' | 'medium' | 'low';
  weeklyScores: number[];
}

export interface PlatformScore {
  platform: 'codechef' | 'leetcode' | 'codeforces' | 'atcoder' | 'codolio' | 'github';
  platformName: string;
  score: number;
  previousScore?: number;
  change?: number;
  rating?: number;
  previousRating?: number;
  problemsSolved?: number;
  previousProblemsSolved?: number;
  contests?: number;
  rank?: number;
}

export interface WeekData {
  weekNumber: number;
  weekLabel: string;
  uploadDate: string;
  students: Student[];
  averageScore: number;
  topPerformer: Student | null;
  lowestPerformer: Student | null;
}

export interface ComparisonData {
  currentWeek: WeekData | null;
  previousWeek: WeekData | null;
  growthPercentage: number;
  improvedStudents: number;
  declinedStudents: number;
}

export interface DashboardStats {
  overallScore: number;
  weeklyGrowth: number;
  totalStudents: number;
  topStudent: Student | null;
  lowestStudent: Student | null;
  averageScore: number;
  highPerformers: number;
  mediumPerformers: number;
  lowPerformers: number;
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName?: string;
  message?: string;
}
