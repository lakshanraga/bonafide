import React from "react";

interface ProfileFieldProps {
  label: string;
  children: React.ReactNode;
}

const ProfileField = ({ label, children }: ProfileFieldProps) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    {/* Changed from <p> to <div> to allow block-level children like Badge */}
    <div className="text-base font-medium">{children}</div>
  </div>
);

export default ProfileField;