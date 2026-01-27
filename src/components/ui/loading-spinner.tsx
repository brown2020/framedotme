import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function LoadingSpinner({
  size = "md",
  label,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      )}
    </div>
  );
}
