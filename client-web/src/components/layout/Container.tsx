import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children?: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("max-w-[1200px] mx-auto px-4", className)}>
      {children}
    </div>
  );
}
