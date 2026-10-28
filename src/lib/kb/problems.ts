// What a report shows, as opposed to where it was filed. causes.ts places a report by its tenant;
// a report whose date moved by one day can't come from either cause, so it is its own problem.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'oneDayMove' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // Reports this group shares with another: the desk counts a report where it is filed.
  alsoIn: Problem | null;
  tenants: number;
  channels: string[];
  firstSeen: string;
  lastSeen: string;
};

function group(problem: Problem, rs: Report[], alsoIn: Problem | null): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    alsoIn,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: [...new Set(rs.map((r) => r.channel))].sort(),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// Day and month swapped (parser, hint) are counted by cause, where the desk files them. One day off
// (oneDayMove) is read by hand (desk-notes.json): a month-first parser only ever swaps day and month,
// so those reports are a problem of their own, still counted under the cause they're filed by.
export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(p, [...(byCause.get(p) ?? []), r]);
  }
  const groups = [...byCause.entries()].map(([p, rs]) => group(p, rs, null));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const filed = causeOf(moved[0], tenantOf(moved[0])) ?? 'unplaced';
    groups.push(group('oneDayMove', moved, filed));
  }
  return groups.sort((a, b) => b.reports.length - a.reports.length);
}
