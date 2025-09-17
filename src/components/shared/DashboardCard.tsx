import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor?: string;
  cardTheme?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'purple' | 'emerald' | 'cyan' | 'rose';
  role?: 'admin' | 'student' | 'tutor' | 'hod' | 'principal';
}

const DashboardCard = ({ title, value, icon, iconColor, cardTheme = 'default', role }: DashboardCardProps) => {
  // Define theme-based card styles
  const getCardThemeClass = () => {
    const baseClass = "glass-card transition-all duration-300 hover:scale-105 hover:shadow-xl";
    
    switch (cardTheme) {
      case 'primary':
        return `${baseClass} dashboard-card-primary`;
      case 'success':
        return `${baseClass} dashboard-card-success`;
      case 'warning':
        return `${baseClass} dashboard-card-warning`;
      case 'info':
        return `${baseClass} dashboard-card-info`;
      case 'danger':
        return `${baseClass} dashboard-card-danger`;
      case 'purple':
        return `${baseClass} dashboard-card-purple`;
      case 'emerald':
        return `${baseClass} dashboard-card-emerald`;
      case 'cyan':
        return `${baseClass} dashboard-card-cyan`;
      case 'rose':
        return `${baseClass} dashboard-card-rose`;
      default:
        return baseClass;
    }
  };

  // Get role-based styling
  const getRoleSpecificClass = () => {
    if (role) {
      return `dashboard-card-${role}`;
    }
    return '';
  };

  return (
    <Card className={cn(getCardThemeClass(), getRoleSpecificClass())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        {React.cloneElement(icon as React.ReactElement, {
          className: cn("h-4 w-4", iconColor || "text-muted-foreground"),
        })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;