"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const LOCAL_STORAGE_KEY = "theme-preference-set";

const ThemePreferenceDialog = () => {
  const { setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && !localStorage.getItem(LOCAL_STORAGE_KEY)) {
      setIsOpen(true);
    }
  }, []);

  const handleThemeSelect = (theme: "light" | "dark") => {
    setTheme(theme);
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!mounted) {
    return null; // Don't render anything until mounted to prevent hydration errors
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose Your Theme</AlertDialogTitle>
          <AlertDialogDescription>
            Welcome! Please select your preferred visual theme for the application. You can change this later in the settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleThemeSelect("light")}>
            ☀️ Light Theme
          </Button>
          <Button onClick={() => handleThemeSelect("dark")}>
            🌙 Dark Theme
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ThemePreferenceDialog;