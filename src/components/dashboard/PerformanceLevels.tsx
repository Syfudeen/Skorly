import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Student } from "@/types/student";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceLevelsProps {
  students: Student[];
}

const PerformanceLevels = ({ students }: PerformanceLevelsProps) => {
  const highPerformers = students.filter(s => s.performanceLevel === 'high');
  const mediumPerformers = students.filter(s => s.performanceLevel === 'medium');
  const lowPerformers = students.filter(s => s.performanceLevel === 'low');

  const levels = [
    {
      title: "High Performers",
      subtitle: "Scoring 80% and above",
      students: highPerformers,
      badgeClass: "badge-high",
      borderColor: "border-l-success",
      bgAccent: "bg-success-light",
    },
    {
      title: "Medium Performers",
      subtitle: "Scoring 60% - 79%",
      students: mediumPerformers,
      badgeClass: "badge-medium",
      borderColor: "border-l-warning",
      bgAccent: "bg-warning-light",
    },
    {
      title: "Need Support",
      subtitle: "Scoring below 60%",
      students: lowPerformers,
      badgeClass: "badge-low",
      borderColor: "border-l-destructive",
      bgAccent: "bg-destructive-light",
    },
  ];

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {levels.map((level, levelIndex) => (
        <motion.div
          key={level.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: levelIndex * 0.15 }}
          className={cn(
            "rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden",
            "border-l-4",
            level.borderColor
          )}
        >
          {/* Header */}
          <div className={cn("px-5 py-4", level.bgAccent)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground">{level.title}</h3>
                <p className="text-sm text-muted-foreground">{level.subtitle}</p>
              </div>
              <Badge variant="secondary" className="font-semibold">
                {level.students.length}
              </Badge>
            </div>
          </div>

          {/* Student List */}
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {level.students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students in this category</p>
            ) : (
              level.students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ x: 4, backgroundColor: "hsl(var(--muted) / 0.5)" }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                >
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                    <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.previousScore && (
                        <span className={cn(
                          student.overallScore > student.previousScore ? "text-success" : "text-destructive"
                        )}>
                          {student.overallScore > student.previousScore ? "+" : ""}
                          {student.overallScore - student.previousScore}%
                        </span>
                      )}
                      {" "}from last week
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold text-lg tabular-nums",
                      level.title === "High Performers" && "text-success",
                      level.title === "Medium Performers" && "text-warning-foreground",
                      level.title === "Need Support" && "text-destructive"
                    )}>
                      {student.overallScore}%
                    </span>
                    <TrendIcon trend={student.trend} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PerformanceLevels;
