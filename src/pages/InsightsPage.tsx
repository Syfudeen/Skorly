import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PerformanceLevels from "@/components/dashboard/PerformanceLevels";
import { mockStudents } from "@/data/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trophy, Target, GitBranch, Code, Award, Github, Star, Zap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const platforms = [
  { key: "all", name: "Overall Performance", icon: Trophy },
  { key: "codechef", name: "CodeChef", icon: Code },
  { key: "leetcode", name: "LeetCode", icon: Target },
  { key: "codeforces", name: "Codeforces", icon: Award },
  { key: "atcoder", name: "AtCoder", icon: Code },
  { key: "codolio", name: "Codolio", icon: GitBranch },
  { key: "github", name: "GitHub", icon: Github },
];

const InsightsPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const getStudentPlatformData = (student: any, platform: string) => {
    if (platform === "all") {
      return {
        score: student.overallScore,
        previousScore: student.previousScore,
        trend: student.trend,
        performanceLevel: student.performanceLevel
      };
    }
    
    const platformData = student.platformScores.find((p: any) => p.platform === platform);
    return {
      score: platformData?.score || 0,
      previousScore: platformData?.previousScore || 0,
      rating: platformData?.rating || 0,
      problemsSolved: platformData?.problemsSolved || 0,
      contests: platformData?.contests || 0,
      rank: platformData?.rank || 0,
      change: platformData?.change || 0,
      platformId: student.platformIds[platform as keyof typeof student.platformIds] || "N/A"
    };
  };

  const getSortedStudents = () => {
    if (selectedPlatform === "all") {
      return [...mockStudents].sort((a, b) => b.overallScore - a.overallScore);
    }
    
    return [...mockStudents].sort((a, b) => {
      const aScore = a.platformScores.find((p: any) => p.platform === selectedPlatform)?.score || 0;
      const bScore = b.platformScores.find((p: any) => p.platform === selectedPlatform)?.score || 0;
      return bScore - aScore;
    });
  };

  const sortedStudents = getSortedStudents();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Student Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into individual student performance across platforms
          </p>
        </motion.div>

        {/* Platform Selector */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Platform Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Choose platform for insights" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <SelectItem key={platform.key} value={platform.key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {platform.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        {selectedPlatform === "all" && (
          <PerformanceLevels students={mockStudents} />
        )}

        {/* Student Details Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {sortedStudents.map((student, index) => {
            const platformData = getStudentPlatformData(student, selectedPlatform);
            
            return (
              <motion.div
                key={`${student.id}-${selectedPlatform}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                      <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {/* Rank Badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{student.regNo} • {student.dept}</p>
                      <p>{student.year}</p>
                      {selectedPlatform !== "all" && platformData.platformId !== "N/A" && (
                        <p className="font-mono text-xs">ID: {platformData.platformId}</p>
                      )}
                    </div>
                    
                    {/* Performance Badge */}
                    <div className="flex items-center gap-2 mt-2">
                      {selectedPlatform === "all" ? (
                        <span className={cn(
                          student.performanceLevel === 'high' && 'badge-high',
                          student.performanceLevel === 'medium' && 'badge-medium',
                          student.performanceLevel === 'low' && 'badge-low'
                        )}>
                          {student.performanceLevel}
                        </span>
                      ) : (
                        <Badge className="bg-secondary text-secondary-foreground text-xs">
                          {platforms.find(p => p.key === selectedPlatform)?.name}
                        </Badge>
                      )}
                      
                      {/* Trend Indicator */}
                      {selectedPlatform === "all" && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          student.trend === 'up' ? "text-secondary" : student.trend === 'down' ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {student.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {platformData.previousScore && Math.abs(platformData.score - platformData.previousScore)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold font-display text-primary">{platformData.score}%</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlatform === "all" ? "Overall" : "Score"}
                    </p>
                  </div>
                </div>

                {/* Platform Specific Metrics */}
                {selectedPlatform !== "all" && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {platformData.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-secondary" />
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-medium text-foreground">{platformData.rating}</span>
                        </div>
                      )}
                      {platformData.problemsSolved > 0 && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-warning" />
                          <span className="text-muted-foreground">Problems:</span>
                          <span className="font-medium text-foreground">{platformData.problemsSolved}</span>
                        </div>
                      )}
                      {platformData.contests > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Contests:</span>
                          <span className="font-medium text-foreground">{platformData.contests}</span>
                        </div>
                      )}
                      {platformData.rank > 0 && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-secondary" />
                          <span className="text-muted-foreground">Rank:</span>
                          <span className="font-medium text-foreground">#{platformData.rank}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Previous Score Comparison */}
                    {platformData.previousScore > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Previous: {platformData.previousScore}% 
                        {platformData.change !== 0 && (
                          <span className={cn(
                            "ml-2 font-medium",
                            platformData.change > 0 ? "text-secondary" : "text-destructive"
                          )}>
                            ({platformData.change > 0 ? '+' : ''}{platformData.change}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Platform Summary Stats */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>
              {platforms.find(p => p.key === selectedPlatform)?.name} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{sortedStudents.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {Math.round(sortedStudents.reduce((sum, s) => {
                    const data = getStudentPlatformData(s, selectedPlatform);
                    return sum + data.score;
                  }, 0) / sortedStudents.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {getStudentPlatformData(sortedStudents[0], selectedPlatform).score}%
                </p>
                <p className="text-sm text-muted-foreground">Top Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">
                  {getStudentPlatformData(sortedStudents[sortedStudents.length - 1], selectedPlatform).score}%
                </p>
                <p className="text-sm text-muted-foreground">Lowest Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InsightsPage;
