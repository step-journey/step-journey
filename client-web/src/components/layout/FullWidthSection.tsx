import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

interface FullWidthSectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  withContainer?: boolean;
}

export function FullWidthSection({
  children,
  className,
  containerClassName,
  withContainer = true,
}: FullWidthSectionProps) {
  return (
    <section className={cn("w-full", className)}>
      {withContainer ? (
        <Container className={containerClassName}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
