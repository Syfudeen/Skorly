import { Student, WeekData, DashboardStats, PlatformScore } from "@/types/student";

const platforms: Array<{key: 'codechef' | 'leetcode' | 'codeforces' | 'atcoder' | 'codolio' | 'github', name: string}> = [
  { key: "codechef", name: "CodeChef" },
  { key: "leetcode", name: "LeetCode" },
  { key: "codeforces", name: "Codeforces" },
  { key: "atcoder", name: "AtCoder" },
  { key: "codolio", name: "Codolio" },
  { key: "github", name: "GitHub" },
];

const generatePlatformScores = (): PlatformScore[] => {
  return platforms.map(platform => ({
    platform: platform.key,
    platformName: platform.name,
    score: Math.floor(Math.random() * 40) + 60,
    previousScore: Math.floor(Math.random() * 40) + 55,
    change: Math.floor(Math.random() * 20) - 10,
    rating: Math.floor(Math.random() * 1000) + 1200,
    problemsSolved: Math.floor(Math.random() * 200) + 50,
    contests: Math.floor(Math.random() * 20) + 5,
    rank: Math.floor(Math.random() * 5000) + 100,
  }));
};

const generateWeeklyScores = (): number[] => {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 30) + 65);
};

const getPerformanceLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  const diff = current - previous;
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
};

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    regNo: "21CS001",
    dept: "Computer Science",
    year: "3rd Year",
    platformIds: {
      codechef: "aarav_cs",
      leetcode: "aarav_sharma",
      codeforces: "aarav21",
      atcoder: "aarav_at",
      codolio: "aarav_codolio",
      github: "aarav-sharma"
    },
    overallScore: 94,
    previousScore: 89,
    platformScores: generatePlatformScores(),
    trend: 'up',
    performanceLevel: 'high',
    weeklyScores: generateWeeklyScores(),
  },
  {
    id: "2",
    name: "Priya Patel",
    regNo: "21CS002",
    dept: "Computer Science",
    year: "3rd Year",
    platformIds: {
      codechef: "priya_codes",
      leetcode: "priya_patel",
      codeforces: "priya_cf",
      atcoder: "priya_at",
      codolio: "priya_codolio",
      github: "priya-patel"
    },
    overallScore: 91,
    previousScore: 88,
    platformScores: generatePlatformScores(),
    trend: 'up',
    performanceLevel: 'high',
    weeklyScores: generateWeeklyScores(),
  },
  {
    id: "3",
    name: "Rohan Kumar",
    regNo: "21IT003",
    dept: "Information Technology",
    year: "3rd Year",
    platformIds: {
      codechef: "rohan_kumar",
      leetcode: "rohan_k",
      codeforces: "rohan_cf",
      atcoder: "rohan_at",
      codolio: "rohan_codolio",
      github: "rohan-kumar"
    },
    overallScore: 88,
    previousScore: 85,
    platformScores: generatePlatformScores(),
    trend: 'up',
    performanceLevel: 'high',
    weeklyScores: generateWeeklyScores(),
  },
  {
    id: "4",
    name: "Ananya Singh",
    regNo: "21CS004",
    dept: "Computer Science",
    year: "2nd Year",
    platformIds: {
      codechef: "ananya_singh",
      leetcode: "ananya_s",
      codeforces: "ananya_cf",
      atcoder: "ananya_at",
      codolio: "ananya_codolio",
      github: "ananya-singh"
    },
    overallScore: 85,
    previousScore: 82,
    platformScores: generatePlatformScores(),
    trend: 'up',
    performanceLevel: 'high',
    weeklyScores: generateWeeklyScores(),
  },
  {
    id: "5",
    name: "Vikram Reddy",
    regNo: "21ECE005",
    dept: "Electronics",
    year: "3rd Year",
    platformIds: {
      codechef: "vikram_reddy",
      leetcode: "vikram_r",
      codeforces: "vikram_cf",
      atcoder: "vikram_at",
      codolio: "vikram_codolio",
      github: "vikram-reddy"
    },
    overallScore: 76,
    previousScore: 78,
    platformScores: generatePlatformScores(),
    trend: 'down',
    performanceLevel: 'medium',
    weeklyScores: generateWeeklyScores(),
  },
  {
    id: "6",
    name: "Kavya Nair",
    regNo: "21CS006",
    dept: "Computer Science",
    year: "2nd Year",
    platformIds: {
      codechef: "kavya_nair",
      leetcode: "kavya_n",
      codeforces: "kavya_cf",
      atcoder: "kavya_at",
      codolio: "kavya_codolio",
      github: "kavya-nair"
    },
    overallScore: 72,
    previousScore: 70,
    platformScores: generatePlatformScores(),
    trend: 'up',
    performanceLevel: 'medium',
    weeklyScores: generateWeeklyScores(),
  },
  // Generate additional students to demonstrate 100+ capability
  ...Array.from({ length: 94 }, (_, index) => {
    const studentNumber = index + 7;
    const names = [
      "Arjun Menon", "Meera Joshi", "Sanjay Gupta", "Neha Verma", "Rahul Das", "Divya Iyer",
      "Karthik Raj", "Sneha Pillai", "Aditya Bhat", "Riya Agarwal", "Varun Shetty", "Pooja Rao",
      "Nikhil Jain", "Shreya Kulkarni", "Manish Tiwari", "Deepika Sinha", "Rajesh Yadav", "Swati Mishra",
      "Abhishek Pandey", "Nisha Chandra", "Suresh Babu", "Lakshmi Devi", "Ganesh Murthy", "Radha Krishna",
      "Venkat Raman", "Sita Lakshmi", "Mohan Das", "Geetha Rani", "Sunil Kumar", "Madhavi Reddy"
    ];
    const depts = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    
    const name = names[index % names.length];
    const dept = depts[index % depts.length];
    const year = years[index % years.length];
    const score = Math.floor(Math.random() * 60) + 30; // Random score between 30-90
    const performanceLevel = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    
    return {
      id: studentNumber.toString(),
      name: `${name} ${studentNumber}`,
      regNo: `21${dept.substring(0, 2).toUpperCase()}${studentNumber.toString().padStart(3, '0')}`,
      dept,
      year,
      platformIds: {
        codechef: `student${studentNumber}_cc`,
        leetcode: `student${studentNumber}_lc`,
        codeforces: `student${studentNumber}_cf`,
        atcoder: `student${studentNumber}_at`,
        codolio: `student${studentNumber}_cd`,
        github: `student${studentNumber}-gh`
      },
      overallScore: score,
      previousScore: Math.max(20, score - Math.floor(Math.random() * 10)),
      platformScores: generatePlatformScores(),
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      performanceLevel,
      weeklyScores: generateWeeklyScores(),
    };
  })
];

export const mockCurrentWeek: WeekData = {
  weekNumber: 12,
  weekLabel: "Week 12",
  uploadDate: "2024-01-22",
  students: mockStudents,
  averageScore: Math.round(mockStudents.reduce((sum, s) => sum + s.overallScore, 0) / mockStudents.length),
  topPerformer: mockStudents[0],
  lowestPerformer: mockStudents[mockStudents.length - 1],
};

export const mockPreviousWeek: WeekData = {
  weekNumber: 11,
  weekLabel: "Week 11",
  uploadDate: "2024-01-15",
  students: mockStudents.map(s => ({ ...s, overallScore: s.previousScore || s.overallScore - 5 })),
  averageScore: 68,
  topPerformer: mockStudents[0],
  lowestPerformer: mockStudents[mockStudents.length - 1],
};

export const mockDashboardStats: DashboardStats = {
  overallScore: 72,
  weeklyGrowth: 8.5,
  totalStudents: mockStudents.length,
  topStudent: mockStudents[0],
  lowestStudent: mockStudents[mockStudents.length - 1],
  averageScore: 68,
  highPerformers: mockStudents.filter(s => s.performanceLevel === 'high').length,
  mediumPerformers: mockStudents.filter(s => s.performanceLevel === 'medium').length,
  lowPerformers: mockStudents.filter(s => s.performanceLevel === 'low').length,
};

export const weeklyProgressData = [
  { week: "Week 5", average: 62, high: 85, low: 35 },
  { week: "Week 6", average: 64, high: 87, low: 38 },
  { week: "Week 7", average: 65, high: 88, low: 36 },
  { week: "Week 8", average: 67, high: 90, low: 40 },
  { week: "Week 9", average: 66, high: 89, low: 42 },
  { week: "Week 10", average: 68, high: 91, low: 38 },
  { week: "Week 11", average: 70, high: 92, low: 40 },
  { week: "Week 12", average: 72, high: 94, low: 42 },
];

export const platformPerformanceData = platforms.map(platform => ({
  platform: platform.name,
  average: Math.floor(Math.random() * 25) + 65,
  students: Math.floor(Math.random() * 8) + 4,
}));

export const heatmapData = mockStudents.slice(0, 8).map(student => ({
  student: student.name.split(' ')[0],
  ...platforms.reduce((acc, platform) => {
    acc[platform.name] = Math.floor(Math.random() * 50) + 50;
    return acc;
  }, {} as Record<string, number>),
}));
