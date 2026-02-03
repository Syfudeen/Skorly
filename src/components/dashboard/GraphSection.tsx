import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { weeklyProgressData, platformPerformanceData } from "@/data/mockData";

const GraphSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Progress Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
      >
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Weekly Progress</h3>
          <p className="text-sm text-muted-foreground">Class performance over time</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                domain={[30, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="high"
                stroke="hsl(155, 60%, 42%)"
                strokeWidth={3}
                dot={{ fill: "hsl(155, 60%, 42%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Top Performers"
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(195, 80%, 35%)"
                strokeWidth={3}
                dot={{ fill: "hsl(195, 80%, 35%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Class Average"
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="hsl(0, 65%, 55%)"
                strokeWidth={3}
                dot={{ fill: "hsl(0, 65%, 55%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Need Support"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Growth Trend Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
      >
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Growth Trend</h3>
          <p className="text-sm text-muted-foreground">Performance improvement visualization</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyProgressData}>
              <defs>
                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(195, 80%, 35%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(195, 80%, 35%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155, 60%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(155, 60%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                domain={[30, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="high"
                stroke="hsl(155, 60%, 42%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHigh)"
                name="Top Range"
              />
              <Area
                type="monotone"
                dataKey="average"
                stroke="hsl(195, 80%, 35%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAverage)"
                name="Average Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Platform Performance Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 lg:col-span-2"
      >
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Platform Comparison</h3>
          <p className="text-sm text-muted-foreground">Average scores across learning platforms</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <YAxis 
                type="category" 
                dataKey="platform" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Bar
                dataKey="average"
                fill="hsl(195, 80%, 35%)"
                radius={[0, 8, 8, 0]}
                name="Average Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default GraphSection;
