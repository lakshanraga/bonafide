"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  onHeaderBg?: boolean;
  iconTextColorClass?: string; // New prop for custom icon text color
}

export function ThemeToggle({ onHeaderBg, iconTextColorClass }: ThemeToggleProps) {
  const { setTheme } = useTheme()

  const buttonHoverClasses = "hover:scale-110 hover:shadow-lg transition-all duration-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            onHeaderBg && "bg-transparent border-current hover:bg-foreground/10",
            iconTextColorClass || "text-foreground", // Apply here
            buttonHoverClasses
          )}
        >
          <Sun className={cn("h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", iconTextColorClass || "text-foreground")} />
          <Moon className={cn("absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", iconTextColorClass || "text-foreground")} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        {/* Removed System option */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}