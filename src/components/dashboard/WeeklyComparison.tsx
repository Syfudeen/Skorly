import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Student } from "@/types/student";

interface WeeklyComparisonData {
  currentWeek: {
    weekNumber: number;
    weekLabel: string;
    students: Student[];
    uploadJobId?: string;
  } | null;
  previousWeek: {
    weekNumber: number;
    weekLabel: string;
  } | null;
  improved: number;
  declined: number;
  unchanged: number;
}

interface AvailableWeek {
  uploadJobId: string;
  weekNumber: number;
  weekLabel: string;
  uploadDate: string;
  studentCount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WeeklyComparison = () => {
  const [data, setData] = useState<WeeklyComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<AvailableWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("latest");

  const fetchAvailableWeeks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/available-weeks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available weeks');
      }

      const result = await response.json();
      setAvailableWeeks(result.data.weeks);
    } catch (err) {
      console.error('Error fetching available weeks:', err);
    }
  };

  const fetchWeeklyComparison = async (weekId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with optional weekId parameter
      const url = weekId && weekId !== "latest"
        ? `${API_BASE_URL}/api/analytics/weekly-comparison?limit=100&weekId=${weekId}`
        : `${API_BASE_URL}/api/analytics/weekly-comparison?limit=100`;

      // Fetch weekly comparison data from dedicated endpoint
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly comparison data');
      }

      const result = await response.json();

      if (!result.data.hasData) {
        setData({
          currentWeek: null,
          previousWeek: null,
          improved: 0,
          declined: 0,
          unchanged: 0
        });
        setLoading(false);
        return;
      }

      const { currentWeek, previousWeek, students, summary } = result.data;

      // Debug logging
      console.log('Weekly Comparison Data:', {
        currentWeek,
        previousWeek,
        sampleStudent: students[0],
        samplePlatformStats: students[0]?.performance?.platformStats
      });

      // Transform backend data to frontend format
      const transformedStudents: Student[] = students.map((student: any) => {
        const performance = student.performance;
        
        return {
          id: student._id,
          name: student.name,
          regNo: student.regNo,
          dept: student.department,
          year: student.year,
          platformIds: student.platformIds,
          overallScore: performance.overallScore,
          previousScore: performance.previousScore,
          platformScores: performance.platformStats.map((ps: any) => ({
            platform: ps.platform,
            platformName: ps.platform.charAt(0).toUpperCase() + ps.platform.slice(1),
            score: ps.rating || 0,
            problemsSolved: ps.problemsSolved || 0,
            contests: ps.contestsParticipated || 0,
            rank: ps.rank,
            rating: ps.rating || 0,
            previousRating: ps.previousRating,
            previousProblemsSolved: ps.previousProblemsSolved
          })),
          trend: performance.previousScore !== undefined
            ? (performance.overallScore > performance.previousScore ? 'up' : 
               performance.overallScore < performance.previousScore ? 'down' : 'stable')
            : 'stable',
          performanceLevel: performance.performanceLevel,
          weeklyScores: [performance.overallScore]
        };
      });

      setData({
        currentWeek: {
          weekNumber: currentWeek.weekNumber,
          weekLabel: currentWeek.weekLabel,
          students: transformedStudents,
          uploadJobId: currentWeek.uploadJobId
        },
        previousWeek: previousWeek ? {
          weekNumber: previousWeek.weekNumber,
          weekLabel: previousWeek.weekLabel
        } : null,
        improved: summary.improved,
        declined: summary.declined,
        unchanged: summary.unchanged
      });

      // Extract unique platforms from student data
      const platformsSet = new Set<string>();
      transformedStudents.forEach(student => {
        student.platformScores.forEach(ps => {
          platformsSet.add(ps.platform);
        });
      });
      setAvailablePlatforms(Array.from(platformsSet).sort());

    } catch (err) {
      console.error('Error fetching weekly comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableWeeks();
    fetchWeeklyComparison();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetchWeeklyComparison(selectedWeek === "latest" ? undefined : selectedWeek);
    }
  }, [selectedWeek]);

  // Get platform-specific data for a student
  const getPlatformData = (student: Student, platform: string) => {
    const platformScore = student.platformScores.find(ps => ps.platform === platform);
    return platformScore;
  };

  // Check if student has the selected platform
  const hasPlatform = (student: Student, platform: string) => {
    const platformId = student.platformIds[platform as keyof typeof student.platformIds];
    return !!platformId;
  };

  // Get platform-specific change indicator
  const getPlatformChangeIndicator = (student: Student, platform: string) => {
    if (!hasPlatform(student, platform)) {
      return <span className="text-xs text-muted-foreground">No data available</span>;
    }

    const platformData = getPlatformData(student, platform);
    if (!platformData) {
      return <span className="text-xs text-muted-foreground">No data available</span>;
    }

    const currentRating = platformData.rating || 0;
    const previousRating = platformData.previousRating || 0;

    if (previousRating === 0) {
      return <span className="text-xs text-muted-foreground">New</span>;
    }

    const change = currentRating - previousRating;
    if (change > 0) {
      return (
        <div className="trend-up">
          <TrendingUp className="h-4 w-4" />
          <span>+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="trend-down">
          <TrendingDown className="h-4 w-4" />
          <span>{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span>0</span>
      </div>
    );
  };

  // Get platform-specific problems change
  const getPlatformProblemsChange = (student: Student, platform: string) => {
    const platformData = getPlatformData(student, platform);
    if (!platformData || !hasPlatform(student, platform)) {
      return null;
    }

    const currentProblems = platformData.problemsSolved || 0;
    const previousProblems = platformData.previousProblemsSolved || 0;

    if (previousProblems === 0) {
      return null;
    }

    return currentProblems - previousProblems;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0) {
      return (
        <div className="trend-up">
          <TrendingUp className="h-4 w-4" />
          <span>+{change.toFixed(1)}%</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="trend-down">
          <TrendingDown className="h-4 w-4" />
          <span>{change.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span>0%</span>
      </div>
    );
  };

  const getPerformanceBadge = (level: 'high' | 'medium' | 'low') => {
    return (
      <span className={cn(
        level === 'high' && 'badge-high',
        level === 'medium' && 'badge-medium',
        level === 'low' && 'badge-low'
      )}>
        {level === 'high' && 'High'}
        {level === 'medium' && 'Medium'}
        {level === 'low' && 'Low'}
      </span>
    );
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
      >
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading comparison data...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">Failed to load comparison data</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchWeeklyComparison} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!data?.currentWeek || data.currentWeek.students.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No comparison data available</p>
          <p className="text-sm text-muted-foreground mt-2">Upload student data to see weekly comparisons</p>
        </div>
      </motion.div>
    );
  }

  const { currentWeek, previousWeek, improved, declined, unchanged } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Weekly Comparison</h3>
            <p className="text-sm text-muted-foreground">Compare performance between selected week and its previous week</p>
          </div>
          <Button onClick={() => fetchWeeklyComparison(selectedWeek === "latest" ? undefined : selectedWeek)} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {availableWeeks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Week:</span>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Week</SelectItem>
                  {availableWeeks.map(week => (
                    <SelectItem key={week.uploadJobId} value={week.uploadJobId}>
                      {week.weekLabel} ({week.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {availablePlatforms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Platform:</span>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {availablePlatforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {previousWeek && (
              <>
                <span className="text-sm text-muted-foreground">{previousWeek.weekLabel}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <span className="text-sm font-medium text-foreground">{currentWeek.weekLabel}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {previousWeek ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-success-light border border-success/20 text-center"
          >
            <p className="text-3xl font-bold font-display text-success">{improved}</p>
            <p className="text-sm text-success/80">Improved</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-muted border border-border text-center"
          >
            <p className="text-3xl font-bold font-display text-muted-foreground">{unchanged}</p>
            <p className="text-sm text-muted-foreground">Unchanged</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-destructive-light border border-destructive/20 text-center"
          >
            <p className="text-3xl font-bold font-display text-destructive">{declined}</p>
            <p className="text-sm text-destructive/80">Declined</p>
          </motion.div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ No previous week data available for comparison
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is the first week of data, or the previous week was not uploaded. Upload earlier weeks to enable comparison.
          </p>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Student</th>
              <th className="p-3 text-center text-sm font-medium text-muted-foreground">Reg No</th>
              {selectedPlatform === "all" ? (
                <>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">
                    {previousWeek ? 'Previous Week' : 'Score'}
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Current Week</th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Change</th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Level</th>
                </>
              ) : (
                <>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Previous Rating</th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Current Rating</th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Rating Change</th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {currentWeek.students.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                      <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.dept}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className="text-sm text-muted-foreground">{student.regNo}</span>
                </td>
                {selectedPlatform === "all" ? (
                  <>
                    <td className="p-3 text-center">
                      <span className="text-muted-foreground">
                        {student.previousScore !== undefined ? `${student.previousScore.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-foreground">{student.overallScore.toFixed(1)}%</span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {student.previousScore !== undefined 
                          ? getChangeIndicator(student.overallScore, student.previousScore)
                          : <span className="text-xs text-muted-foreground">New</span>
                        }
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {getPerformanceBadge(student.performanceLevel)}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 text-center">
                      {hasPlatform(student, selectedPlatform) ? (
                        (() => {
                          const prevRating = getPlatformData(student, selectedPlatform)?.previousRating;
                          if (prevRating === undefined || prevRating === null) {
                            return (
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">-</span>
                                <span className="text-[10px] text-muted-foreground/70">No prev week</span>
                              </div>
                            );
                          }
                          return <span className="text-muted-foreground">{prevRating}</span>;
                        })()
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {hasPlatform(student, selectedPlatform) ? (
                        <span className="font-semibold text-foreground">
                          {getPlatformData(student, selectedPlatform)?.rating || 0}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {getPlatformChangeIndicator(student, selectedPlatform)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {hasPlatform(student, selectedPlatform) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-success-light text-success">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          No data
                        </span>
                      )}
                    </td>
                  </>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WeeklyComparison;
