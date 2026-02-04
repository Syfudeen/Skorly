import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadSection from "@/components/upload/UploadSection";
import { Student } from "@/types/student";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Trophy, Target, GitBranch, Code, Award, Github } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [students, setStudents] = useState<any[]>([]);
  const [isDataUploaded, setIsDataUploaded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Fetch students from backend
  const fetchStudents = async (platform: string = 'all') => {
    setLoading(true);
    try {
      const url = platform === 'all' 
        ? `${API_URL}/api/students?sort=performance&order=desc&limit=500`
        : `${API_URL}/api/students?sort=performance&order=desc&limit=500&platform=${platform}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status === 'success' && result.data.students.length > 0) {
        setStudents(result.data.students);
        setIsDataUploaded(true);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if there's existing data on mount
  useEffect(() => {
    fetchStudents(selectedPlatform);
  }, [selectedPlatform]);

  const handleUploadComplete = () => {
    // Fetch fresh data after upload completes
    setTimeout(() => {
      fetchStudents(selectedPlatform);
    }, 1000);
  };

  const getPerformanceBadge = (totalProblems: number) => {
    if (totalProblems >= 200) {
      return <Badge className="bg-secondary text-secondary-foreground">High</Badge>;
    } else if (totalProblems >= 100) {
      return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
    } else {
      return <Badge className="bg-destructive text-destructive-foreground">Low</Badge>;
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-secondary" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSortedStudents = () => {
    if (selectedPlatform === "all") {
      return [...students].sort((a, b) => 
        (b.totalStats?.totalProblems || 0) - (a.totalStats?.totalProblems || 0)
      );
    }
    
    // For platform-specific sorting, we'd need platform stats
    // For now, just return all students
    return students;
  };

  const getStudentScore = (student: any) => {
    if (selectedPlatform === "all") {
      return student.totalStats?.totalProblems || 0;
    }
    // Platform-specific score from platformStats
    return student.platformStats?.problemsSolved || 0;
  };

  const getStudentRating = (student: any) => {
    if (selectedPlatform === "all") {
      return Math.round(student.totalStats?.averageRating || 0);
    }
    return student.platformStats?.rating || 0;
  };

  const getStudentContests = (student: any) => {
    if (selectedPlatform === "all") {
      return student.totalStats?.totalContests || 0;
    }
    return student.platformStats?.contestsParticipated || 0;
  };

  const getStudentRank = (student: any) => {
    if (selectedPlatform === "all") {
      return null;
    }
    return student.platformStats?.rank || null;
  };

  const getStudentChanges = (student: any) => {
    if (selectedPlatform === "all") {
      return null;
    }
    return student.platformStats?.changes || null;
  };

  const sortedStudents = useMemo(() => getSortedStudents(), [students, selectedPlatform]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Performance Dashboard
          </h1>
        </div>

        {/* Upload Section */}
        <UploadSection onUploadComplete={handleUploadComplete} />

        {/* Platform Selection and Student Data */}
        {isDataUploaded && students.length > 0 && (
          <div className="space-y-6">
            {/* Platform Selector */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Select Platform
              </h3>
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
            </div>

            {/* Student Performance List */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {platforms.find(p => p.key === selectedPlatform)?.name} Rankings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Students ordered by {selectedPlatform === "all" ? "overall" : platforms.find(p => p.key === selectedPlatform)?.name} performance
                </p>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading students...
                  </div>
                ) : sortedStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found. Upload an Excel file to get started.
                  </div>
                ) : (
                  sortedStudents.map((student, index) => {
                    const score = getStudentScore(student);
                    const rating = getStudentRating(student);
                    const contests = getStudentContests(student);
                    const rank = getStudentRank(student);
                    const changes = getStudentChanges(student);
                    
                    return (
                      <div
                        key={student.regNo}
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
                              {student.year && (
                                <>
                                  <span>•</span>
                                  <span>{student.year}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Performance Level */}
                          {selectedPlatform === "all" && getPerformanceBadge(score)}
                          
                          {/* Stats */}
                          <div className="text-right text-sm">
                            <p className="text-foreground font-semibold">
                              {score} problems
                            </p>
                            {rating > 0 && (
                              <p className="text-muted-foreground flex items-center gap-1 justify-end">
                                Rating: {rating}
                                {changes?.rating !== undefined && changes.rating !== 0 && (
                                  <span className={changes.rating > 0 ? "text-secondary" : "text-destructive"}>
                                    ({changes.rating > 0 ? '+' : ''}{changes.rating})
                                  </span>
                                )}
                              </p>
                            )}
                            {contests > 0 && (
                              <p className="text-muted-foreground">
                                Contests: {contests}
                              </p>
                            )}
                            {rank && (
                              <p className="text-muted-foreground">
                                Rank: #{rank}
                              </p>
                            )}
                          </div>
                          
                          {/* Platform indicator or active platforms count */}
                          <div className="text-right">
                            {selectedPlatform === "all" ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-foreground">
                                  {student.totalStats?.activePlatforms || 0}
                                </span>
                                <span className="text-xs text-muted-foreground">platforms</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {changes?.problemsSolved !== undefined && changes.problemsSolved !== 0 && (
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(changes.problemsSolved)}
                                    <span className={`text-sm font-medium ${
                                      changes.problemsSolved > 0 ? 'text-secondary' : 'text-destructive'
                                    }`}>
                                      {changes.problemsSolved > 0 ? '+' : ''}{changes.problemsSolved}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{sortedStudents.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlatform === "all" ? "Total Students" : "Students on Platform"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {sortedStudents.length > 0 
                        ? Math.round(sortedStudents.reduce((sum, s) => sum + getStudentScore(s), 0) / sortedStudents.length)
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Problems Solved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {sortedStudents.length > 0 ? getStudentScore(sortedStudents[0]) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Highest Problems</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {sortedStudents.length > 0 
                        ? Math.round(sortedStudents.reduce((sum, s) => sum + getStudentRating(s), 0) / sortedStudents.length)
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
