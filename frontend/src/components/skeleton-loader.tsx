import { cn } from "@/lib/utils";

export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export function CardSkel({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      <Skel className="h-4 w-1/3" />
      <Skel className="h-8 w-1/2" />
      <Skel className="h-3 w-2/3" />
    </div>
  );
}
