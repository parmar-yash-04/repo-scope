import type { LanguagesData } from "@/lib/api";

export function LanguageBar({ data, animated = true }: { data: LanguagesData["languages"]; animated?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {data.map((lang) => (
          <div
            key={lang.name}
            style={{
              width: `${lang.percent}%`,
              backgroundColor: lang.color,
              transition: animated ? "width 0.8s ease-out" : undefined,
            }}
            title={`${lang.name} ${lang.percent}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono">
        {data.map((lang) => (
          <div key={lang.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
            <span className="text-foreground">{lang.name}</span>
            <span className="text-muted-foreground">{lang.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
