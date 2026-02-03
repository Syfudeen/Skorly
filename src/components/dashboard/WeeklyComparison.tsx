import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight } from "lucide-react";
import { mockStudents } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const WeeklyComparison = () => {
  const getChangeIndicator = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0) {
      return (
        <div className="trend-up">
          <TrendingUp className="h-4 w-4" />
          <span>+{change}%</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="trend-down">
          <TrendingDown className="h-4 w-4" />
          <span>{change}%</span>
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

  // Summary stats
  const improved = mockStudents.filter(s => s.previousScore && s.overallScore > s.previousScore).length;
  const declined = mockStudents.filter(s => s.previousScore && s.overallScore < s.previousScore).length;
  const unchanged = mockStudents.length - improved - declined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Weekly Comparison</h3>
          <p className="text-sm text-muted-foreground">Current week vs previous week performance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Week 11</span>
          <ArrowRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Week 12</span>
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* Comparison Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Student</th>
              <th className="p-3 text-center text-sm font-medium text-muted-foreground">Week 11</th>
              <th className="p-3 text-center text-sm font-medium text-muted-foreground">Week 12</th>
              <th className="p-3 text-center text-sm font-medium text-muted-foreground">Change</th>
              <th className="p-3 text-center text-sm font-medium text-muted-foreground">Level</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((student, index) => (
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
                    <span className="font-medium text-foreground">{student.name}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className="text-muted-foreground">{student.previousScore || '-'}%</span>
                </td>
                <td className="p-3 text-center">
                  <span className="font-semibold text-foreground">{student.overallScore}%</span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center">
                    {student.previousScore && getChangeIndicator(student.overallScore, student.previousScore)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-center">
                    {getPerformanceBadge(student.performanceLevel)}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WeeklyComparison;
