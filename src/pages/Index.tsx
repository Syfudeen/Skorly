import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadSection from "@/components/upload/UploadSection";
import { Student } from "@/types/student";
import { mockStudents } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Trophy, Target, GitBranch, Code, Award, Github } from "lucide-react";

const platforms = [
  { key: "all", name: "Overall Performance", icon: Trophy },
  { key: "codechef", name: "CodeChef", icon: Code },
  { key: "leetcode", name: "LeetCode", icon: Target },
  { key: "codeforces", name: "Codeforces", icon: Award },
  { key: "atcoder", name: "AtCoder", icon: Code },
  { key: "codolio", name: "Codolio", icon: GitBranch },
  { key: "github", name: "GitHub", icon: Github },
];

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataUploaded, setIsDataUploaded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const handleUploadComplete = () => {
    // Simulate loading student data after upload
    setTimeout(() => {
      const sortedStudents = [...mockStudents].sort((a, b) => b.overallScore - a.overallScore);
      setStudents(sortedStudents);
      setIsDataUploaded(true);
    }, 500);
  };

  const getPerformanceBadge = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return <Badge className="bg-secondary text-secondary-foreground">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case 'low':
        return <Badge className="bg-destructive text-destructive-foreground">Low</Badge>;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-secondary" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSortedStudents = () => {
    if (selectedPlatform === "all") {
      return [...students].sort((a, b) => b.overallScore - a.overallScore);
    }
    
    return [...students].sort((a, b) => {
      const aScore = a.platformScores.find(p => p.platform === selectedPlatform)?.score || 0;
      const bScore = b.platformScores.find(p => p.platform === selectedPlatform)?.score || 0;
      return bScore - aScore;
    });
  };

  const getStudentScore = (student: Student) => {
    if (selectedPlatform === "all") {
      return student.overallScore;
    }
    return student.platformScores.find(p => p.platform === selectedPlatform)?.score || 0;
  };

  const getStudentPlatformData = (student: Student) => {
    if (selectedPlatform === "all") {
      return null;
    }
    return student.platformScores.find(p => p.platform === selectedPlatform);
  };

  const sortedStudents = getSortedStudents();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Performance Dashboard
          </h1>
        </motion.div>

        {/* Upload Section */}
        <UploadSection onUploadComplete={handleUploadComplete} />

        {/* Platform Selection and Student Data */}
        <AnimatePresence>
          {isDataUploaded && students.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Platform Selector */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Select Platform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Choose platform to view" />
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

              {/* Student Performance List */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>
                    {platforms.find(p => p.key === selectedPlatform)?.name} Rankings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Students ordered by {selectedPlatform === "all" ? "overall" : platforms.find(p => p.key === selectedPlatform)?.name} performance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedStudents.map((student, index) => {
                      const platformData = getStudentPlatformData(student);
                      const score = getStudentScore(student);
                      
                      return (
                        <motion.div
                          key={`${student.id}-${selectedPlatform}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </div>
                            
                            {/* Student Info */}
                            <div>
                              <h4 className="font-medium text-foreground">{student.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{student.regNo}</span>
                                <span>•</span>
                                <span>{student.dept}</span>
                                <span>•</span>
                                <span>{student.year}</span>
                              </div>
                              {selectedPlatform !== "all" && student.platformIds[selectedPlatform as keyof typeof student.platformIds] && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ID: {student.platformIds[selectedPlatform as keyof typeof student.platformIds]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Performance Level */}
                            {selectedPlatform === "all" && getPerformanceBadge(student.performanceLevel)}
                            
                            {/* Platform Specific Data */}
                            {selectedPlatform !== "all" && platformData && (
                              <div className="text-right text-sm">
                                {platformData.rating && (
                                  <p className="text-muted-foreground">Rating: {platformData.rating}</p>
                                )}
                                {platformData.problemsSolved && (
                                  <p className="text-muted-foreground">Problems: {platformData.problemsSolved}</p>
                                )}
                                {platformData.contests && (
                                  <p className="text-muted-foreground">Contests: {platformData.contests}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Score */}
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-foreground">
                                  {score}%
                                </span>
                                {selectedPlatform === "all" && getTrendIcon(student.trend)}
                              </div>
                              {selectedPlatform === "all" && student.previousScore && (
                                <p className="text-xs text-muted-foreground">
                                  Previous: {student.previousScore}%
                                </p>
                              )}
                              {selectedPlatform !== "all" && platformData?.previousScore && (
                                <p className="text-xs text-muted-foreground">
                                  Previous: {platformData.previousScore}%
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Summary Stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 pt-6 border-t border-border/50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{students.length}</p>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">
                          {Math.round(sortedStudents.reduce((sum, s) => sum + getStudentScore(s), 0) / sortedStudents.length)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">
                          {getStudentScore(sortedStudents[0]) || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Highest Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">
                          {getStudentScore(sortedStudents[sortedStudents.length - 1]) || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Lowest Score</p>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Index;
