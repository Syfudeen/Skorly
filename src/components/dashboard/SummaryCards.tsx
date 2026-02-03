import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Trophy, AlertTriangle, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/types/student";

interface SummaryCardsProps {
  stats: DashboardStats;
}

const SummaryCards = ({ stats }: SummaryCardsProps) => {
  const cards = [
    {
      title: "Overall Performance",
      value: `${stats.overallScore}%`,
      change: "+5.2%",
      trend: "up" as const,
      icon: BarChart,
      gradient: "bg-gradient-primary",
      glowClass: "shadow-glow-primary",
    },
    {
      title: "Weekly Growth",
      value: `${stats.weeklyGrowth > 0 ? '+' : ''}${stats.weeklyGrowth}%`,
      change: "vs last week",
      trend: stats.weeklyGrowth > 0 ? "up" as const : "down" as const,
      icon: stats.weeklyGrowth > 0 ? TrendingUp : TrendingDown,
      gradient: stats.weeklyGrowth > 0 ? "bg-gradient-success" : "bg-gradient-destructive",
      glowClass: stats.weeklyGrowth > 0 ? "shadow-glow-success" : "",
    },
    {
      title: "Top Student",
      value: stats.topStudent?.name.split(' ')[0] || "N/A",
      change: `${stats.topStudent?.overallScore || 0}% score`,
      trend: "up" as const,
      icon: Trophy,
      gradient: "bg-gradient-warning",
      glowClass: "shadow-glow-warning",
    },
    {
      title: "Needs Attention",
      value: `${stats.lowPerformers}`,
      change: "students below 60%",
      trend: "down" as const,
      icon: AlertTriangle,
      gradient: "bg-gradient-destructive",
      glowClass: "",
    },
    {
      title: "Total Students",
      value: stats.totalStudents.toString(),
      change: "active this week",
      trend: "up" as const,
      icon: Users,
      gradient: "bg-gradient-secondary",
      glowClass: "",
    },
    {
      title: "Class Average",
      value: `${stats.averageScore}%`,
      change: "+3.1% improvement",
      trend: "up" as const,
      icon: BarChart,
      gradient: "bg-gradient-primary",
      glowClass: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 transition-all",
            card.glowClass
          )}
        >
          {/* Background Decoration */}
          <div className={cn(
            "absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 blur-2xl",
            card.gradient
          )} />

          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold font-display text-foreground">{card.value}</p>
              <div className="flex items-center gap-1">
                {card.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  card.trend === "up" ? "text-success" : "text-destructive"
                )}>
                  {card.change}
                </span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                card.gradient
              )}
            >
              <card.icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryCards;
