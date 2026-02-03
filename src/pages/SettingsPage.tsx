import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bell, Moon, Globe, Shield, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your dashboard preferences
          </p>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Configure alert preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Email notifications", description: "Receive weekly summary emails" },
              { label: "Performance alerts", description: "Get notified when students decline" },
              { label: "Upload confirmations", description: "Confirmation when data is processed" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Moon className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Appearance</h3>
              <p className="text-sm text-muted-foreground">Customize the dashboard look</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Dark mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
            <Switch />
          </div>
        </motion.div>

        {/* Data Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Data Preferences</h3>
              <p className="text-sm text-muted-foreground">Configure data handling</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="threshold-high">High performer threshold (%)</Label>
              <Input id="threshold-high" type="number" defaultValue="80" className="max-w-[200px]" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="threshold-low">Low performer threshold (%)</Label>
              <Input id="threshold-low" type="number" defaultValue="60" className="max-w-[200px]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button className="bg-gradient-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
