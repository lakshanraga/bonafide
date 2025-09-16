"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { useSession } from "@/components/auth/SessionContextProvider";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  isCollapsed: boolean;
  textColorClass?: string; // Prop to pass text color class
}

const SidebarProfile = ({ isCollapsed, textColorClass }: SidebarProfileProps) => {
  const { profile } = useSession();

  if (!profile) {
    return null; // Or a loading/placeholder state
  }

  return (
    <div className={cn("flex items-center p-4 border-t", textColorClass === "text-white" ? "border-white/20" : "border-primary-foreground/20")}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={profile.avatar_url} alt={profile.username} />
        <AvatarFallback>
          <UserIcon className={cn("h-5 w-5", textColorClass || "text-foreground")} />
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="ml-3 overflow-hidden">
          <p className={cn("text-sm font-medium truncate", textColorClass || "text-foreground")}>
            {profile.first_name} {profile.last_name}
          </p>
          <p className={cn("text-xs truncate", textColorClass ? `${textColorClass}/70` : "text-foreground/70")}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SidebarProfile;