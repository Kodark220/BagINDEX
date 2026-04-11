import { Badge } from "./ui/badge";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const variant = score >= 70 ? "success" : score >= 40 ? "warning" : "danger";

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge variant={variant} className={sizeClasses[size]}>
      {score}
    </Badge>
  );
}
