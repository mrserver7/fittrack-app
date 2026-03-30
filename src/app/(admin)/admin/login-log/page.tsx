import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Activity, CheckCircle, XCircle } from "lucide-react";

const PAGE_SIZE = 50;

const reasonLabels: Record<string, string> = {
  wrong_password: "Wrong password",
  not_found: "Account not found",
  blocked: "Account blocked",
  invalid_input: "Invalid input",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  trainer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default async function LoginLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!(session?.user as Record<string, unknown> | undefined)?.isAdmin) redirect("/admin");

  const { page: pageStr, filter } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = filter === "failed" ? { success: false } : filter === "success" ? { success: true } : {};

  const [attempts, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (filter) params.set("filter", filter);
    return `/admin/login-log?${params}`;
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sign-in Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total attempts
          </p>
        </div>
        {/* Filter tabs */}
        <div className="ml-auto flex items-center gap-2">
          {[
            { label: "All", value: undefined },
            { label: "Success", value: "success" },
            { label: "Failed", value: "failed" },
          ].map((f) => (
            <a
              key={f.label}
              href={f.value ? `/admin/login-log?filter=${f.value}` : "/admin/login-log"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value || (!filter && !f.value)
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-20 section-card border-dashed">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No login attempts yet.</p>
        </div>
      ) : (
        <>
          <div className="section-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Result</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Reason</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">IP</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-3">
                      {a.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{a.email}</td>
                    <td className="px-4 py-3">
                      {a.role ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[a.role] ?? "bg-muted text-muted-foreground"}`}>
                          {a.role}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {a.reason ? reasonLabels[a.reason] ?? a.reason : "--"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {a.ipAddress ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {a.createdAt.toLocaleString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <a href={pageUrl(page - 1)}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted/60 transition-colors">
                  Prev
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a href={pageUrl(page + 1)}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted/60 transition-colors">
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
