import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReportsPage = () => {
  const reports = [
    { id: 1, name: "Weekly Performance Report", date: "Jan 22, 2024", type: "PDF", size: "2.4 MB" },
    { id: 2, name: "Student Comparison Analysis", date: "Jan 22, 2024", type: "PDF", size: "1.8 MB" },
    { id: 3, name: "Platform Analytics Summary", date: "Jan 22, 2024", type: "Excel", size: "3.2 MB" },
    { id: 4, name: "Growth Trend Report", date: "Jan 15, 2024", type: "PDF", size: "2.1 MB" },
    { id: 5, name: "Low Performers Action Plan", date: "Jan 15, 2024", type: "PDF", size: "1.5 MB" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Download and manage performance reports
            </p>
          </div>
          <Button className="bg-gradient-primary text-primary-foreground">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Reports", value: "24", icon: FileText, color: "bg-primary" },
            { label: "This Month", value: "8", icon: Calendar, color: "bg-secondary" },
            { label: "Trending Up", value: "67%", icon: TrendingUp, color: "bg-success" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 flex items-center gap-4"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Available Reports
          </h2>
          <div className="space-y-3">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.date} • {report.type} • {report.size}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
