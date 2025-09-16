import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor?: string;
}

const DashboardCard = ({ title, value, icon, iconColor }: DashboardCardProps) => {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.cloneElement(icon as React.ReactElement, {
          className: cn("h-4 w-4", iconColor || "text-muted-foreground"), // Prioritize iconColor, default to text-muted-foreground
        })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;