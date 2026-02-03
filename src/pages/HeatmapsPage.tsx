import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockStudents, heatmapData } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Users, Grid3X3, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const platforms = ["CodeChef", "LeetCode", "Codeforces", "AtCoder", "Codolio", "GitHub"];

// Mock date options for contests (week-wise)
const contestDateOptions = [
  { value: "week1", label: "Week 1 (Jan 1-7)" },
  { value: "week2", label: "Week 2 (Jan 8-14)" },
  { value: "week3", label: "Week 3 (Jan 15-21)" },
  { value: "week4", label: "Week 4 (Jan 22-28)" },
  { value: "week5", label: "Week 5 (Jan 29-Feb 4)" },
  { value: "week6", label: "Week 6 (Feb 5-11)" },
  { value: "week7", label: "Week 7 (Feb 12-18)" },
  { value: "week8", label: "Week 8 (Feb 19-25)" },
];

// Mock date options for daily questions (day-wise)
const dailyDateOptions = [
  { value: "day1", label: "Monday, Jan 22" },
  { value: "day2", label: "Tuesday, Jan 23" },
  { value: "day3", label: "Wednesday, Jan 24" },
  { value: "day4", label: "Thursday, Jan 25" },
  { value: "day5", label: "Friday, Jan 26" },
  { value: "day6", label: "Saturday, Jan 27" },
  { value: "day7", label: "Sunday, Jan 28" },
  { value: "day8", label: "Monday, Jan 29" },
  { value: "day9", label: "Tuesday, Jan 30" },
  { value: "day10", label: "Wednesday, Jan 31" },
  { value: "day11", label: "Thursday, Feb 1" },
  { value: "day12", label: "Friday, Feb 2" },
  { value: "day13", label: "Saturday, Feb 3" },
  { value: "day14", label: "Sunday, Feb 4" },
];

const HeatmapsPage = () => {
  const [selectedStudents, setSelectedStudents] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<string>("contests"); // New mode selector
  const [selectedDateRange, setSelectedDateRange] = useState<string>("week4");

  // Get current date options based on mode
  const getCurrentDateOptions = () => {
    return selectedMode === "contests" ? contestDateOptions : dailyDateOptions;
  };

  // Reset date when mode changes
  const handleModeChange = (newMode: string) => {
    setSelectedMode(newMode);
    if (newMode === "contests") {
      setSelectedDateRange("week4");
    } else {
      setSelectedDateRange("day7");
    }
  };

  const getHeatColor = (value: number) => {
    if (value >= 80) return "bg-success"; // High performance - Green #a5d024
    if (value >= 60) return "bg-warning"; // Medium performance - Pink #f51c77
    return "bg-destructive"; // Low performance - Red #d62437
  };

  const getHeatOpacity = (value: number) => {
    const normalized = (value - 30) / 70; // Normalize between 30-100
    return Math.max(0.4, Math.min(1, normalized));
  };

  const getFilteredStudents = () => {
    if (selectedStudents === "all") {
      return mockStudents; // Return ALL students, no limit
    }
    if (selectedStudents === "high") {
      return mockStudents.filter(s => s.performanceLevel === 'high');
    }
    if (selectedStudents === "medium") {
      return mockStudents.filter(s => s.performanceLevel === 'medium');
    }
    if (selectedStudents === "low") {
      return mockStudents.filter(s => s.performanceLevel === 'low');
    }
    return mockStudents;
  };

  const generateHeatmapData = () => {
    const filteredStudents = getFilteredStudents();
    // Remove the slice limit - show ALL students
    return filteredStudents.map(student => {
      const data: any = { student: student.name.split(' ')[0] };
      platforms.forEach(platform => {
        // Generate different scores based on date range and mode
        const baseScore = student.platformScores.find(p => p.platformName === platform)?.score || 
                         Math.floor(Math.random() * 50) + 40;
        
        // Simulate date-based variation based on mode
        let dateMultiplier = 1;
        
        if (selectedMode === "contests") {
          // Week-wise variation for contests
          if (selectedDateRange.includes('week1')) dateMultiplier = 0.75;
          if (selectedDateRange.includes('week2')) dateMultiplier = 0.85;
          if (selectedDateRange.includes('week3')) dateMultiplier = 0.90;
          if (selectedDateRange.includes('week4')) dateMultiplier = 0.95;
          if (selectedDateRange.includes('week5')) dateMultiplier = 1.0;
          if (selectedDateRange.includes('week6')) dateMultiplier = 1.05;
          if (selectedDateRange.includes('week7')) dateMultiplier = 1.10;
          if (selectedDateRange.includes('week8')) dateMultiplier = 1.15;
        } else {
          // Day-wise variation for daily questions
          const dayNumber = parseInt(selectedDateRange.replace('day', ''));
          dateMultiplier = 0.8 + (dayNumber * 0.02); // Gradual improvement over days
        }
        
        data[platform] = Math.min(100, Math.floor(baseScore * dateMultiplier));
      });
      return data;
    });
  };

  const heatmapDisplayData = generateHeatmapData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Performance Heatmaps
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize student performance across platforms and time periods
          </p>
        </motion.div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Filter */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Student Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStudents} onValueChange={setSelectedStudents}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select students to display" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="high">High Performers</SelectItem>
                  <SelectItem value="medium">Medium Performers</SelectItem>
                  <SelectItem value="low">Low Performers</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Mode Filter */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Grid3X3 className="h-4 w-4 text-primary" />
                Performance Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select performance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contests">Contests (Week-wise)</SelectItem>
                  <SelectItem value="daily">Daily Questions (Day-wise)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Range Filter */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                {selectedMode === "contests" ? "Week Range" : "Day Range"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${selectedMode === "contests" ? "week" : "day"}`} />
                </SelectTrigger>
                <SelectContent>
                  {getCurrentDateOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Overall Summary Stats */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Overall Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{getFilteredStudents().length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {Math.round(heatmapDisplayData.reduce((sum, student) => {
                    const avgScore = platforms.reduce((pSum, platform) => pSum + (student[platform] as number), 0) / platforms.length;
                    return sum + avgScore;
                  }, 0) / heatmapDisplayData.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {Math.max(...heatmapDisplayData.map(student => 
                    Math.round(platforms.reduce((sum, platform) => sum + (student[platform] as number), 0) / platforms.length)
                  ))}%
                </p>
                <p className="text-sm text-muted-foreground">Top Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">
                  {Math.min(...heatmapDisplayData.map(student => 
                    Math.round(platforms.reduce((sum, platform) => sum + (student[platform] as number), 0) / platforms.length)
                  ))}%
                </p>
                <p className="text-sm text-muted-foreground">Lowest Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              Performance Heatmap
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedStudents === "all" ? "All students" : `${selectedStudents} performers`} • 
              {selectedMode === "contests" ? " Contest Performance • " : " Daily Questions • "}
              {getCurrentDateOptions().find(d => d.value === selectedDateRange)?.label}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Showing {heatmapDisplayData.length} students across {platforms.length} platforms
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Performance:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-destructive" />
                    <span className="text-xs text-muted-foreground">Low (&lt;60%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-warning" />
                    <span className="text-xs text-muted-foreground">Medium (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-success" />
                    <span className="text-xs text-muted-foreground">High (≥80%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-auto custom-scrollbar max-h-[600px] border border-border/30 rounded-lg">
            <table className="w-full min-w-[700px]">
              <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 z-20">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground sticky left-0 bg-card/95 backdrop-blur-sm border-r border-border/30 min-w-[120px] z-30">
                    Student
                  </th>
                  {platforms.map((platform) => (
                    <th key={platform} className="p-3 text-center text-sm font-medium text-muted-foreground min-w-[80px]">
                      {platform}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapDisplayData.map((row, rowIndex) => (
                  <motion.tr
                    key={`${row.student}-${selectedStudents}-${selectedDateRange}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(rowIndex * 0.01, 1) }} // Limit delay for large lists
                    className="border-b border-border/20 hover:bg-muted/20"
                  >
                    <td className="p-3 text-sm font-medium text-foreground sticky left-0 bg-card/95 backdrop-blur-sm border-r border-border/20 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-8">#{rowIndex + 1}</span>
                        <span className="truncate">{row.student}</span>
                      </div>
                    </td>
                    {platforms.map((platform, colIndex) => {
                      const value = row[platform] as number;
                      return (
                        <td key={platform} className="p-2">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01 + colIndex * 0.005, 1) }}
                                whileHover={{ scale: 1.1 }}
                                className={cn(
                                  "heatmap-cell h-10 w-16 flex items-center justify-center text-xs font-semibold text-white cursor-pointer rounded-md mx-auto",
                                  getHeatColor(value)
                                )}
                                style={{ opacity: getHeatOpacity(value) }}
                              >
                                {value}%
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{row.student}</p>
                              <p className="text-sm">{platform}: {value}%</p>
                              <p className="text-xs text-muted-foreground">
                                Rank: #{rowIndex + 1}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedMode === "contests" ? "Contest: " : "Daily: "}
                                {getCurrentDateOptions().find(d => d.value === selectedDateRange)?.label}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scroll Indicator */}
          {heatmapDisplayData.length > 10 && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Scroll to view all {heatmapDisplayData.length} students
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default HeatmapsPage;
