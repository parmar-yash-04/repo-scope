import { Package, CheckCircle2, XCircle, Container, TestTube2, ShieldCheck, Box } from "lucide-react";
import type { Dependencies, LanguagesData } from "@/lib/api";
import { LanguageBar } from "@/components/language-bar";

export function TechStackTab({
  deps,
  langs,
}: {
  deps: Dependencies;
  langs: LanguagesData;
}) {
  const features: { label: string; on: boolean; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Tests", on: deps.has_tests, icon: TestTube2 },
    { label: "Linting", on: deps.has_linting, icon: ShieldCheck },
    { label: "Docker", on: deps.has_docker, icon: Container },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Language usage</h3>
        <div className="space-y-3">
          {langs.languages.map((l) => (
            <div key={l.name} className="space-y-1">
              <div className="flex items-baseline justify-between text-xs font-mono">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                </span>
                <span className="text-muted-foreground">{l.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${l.percent}%`,
                    backgroundColor: l.color,
                    transition: "width 1s ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <LanguageBar data={langs.languages} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Tooling</h3>
          <div className="space-y-3">
            <Row icon={Package} label="Package manager" value={deps.package_manager} />
            <Row icon={Box} label="CI/CD" value={deps.ci_cd.join(", ") || "—"} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {features.map((f) => (
              <div
                key={f.label}
                className={
                  "flex flex-col items-center gap-1 rounded-lg border p-3 " +
                  (f.on
                    ? "border-[color-mix(in_oklab,var(--success)_40%,var(--border))] bg-[color-mix(in_oklab,var(--success)_8%,transparent)]"
                    : "border-border bg-muted/40")
                }
              >
                <f.icon className={"h-4 w-4 " + (f.on ? "text-[var(--success)]" : "text-muted-foreground")} />
                <span className="font-mono text-[11px]">{f.label}</span>
                {f.on ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Key dependencies</h3>
          <ul className="divide-y divide-border">
            {deps.dependencies.map((d) => (
              <li key={d.name} className="py-2 flex items-center justify-between font-mono text-sm">
                <span className="text-foreground">{d.name}</span>
                <span className="text-muted-foreground text-xs">{d.version}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-[color:var(--elevated)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono text-sm capitalize">{value}</span>
    </div>
  );
}
