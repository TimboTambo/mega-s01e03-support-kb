<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByProblem, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  let { ticket }: { ticket: number } = $props();

  const groups = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(new Set(groups.flatMap((g) => g.reports.map((r) => r.id))).size);

  const SHOWS: Record<Problem, string> = {
    parser: 'day and month swapped: the shared parser reads day-first dates month first',
    hint: 'day and month swapped on booking-v3 forms: the hint says MM/DD, the form reads DD/MM',
    oneDayMove: 'date moved by one day, not swapped: a time zone or DST shift',
    unplaced: 'no day-first tenant on file',
  };
</script>

<p class="sum">
  <strong>{total}</strong> reports in #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>what the reports show</th><th>tenants</th><th>via</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{SHOWS[g.problem]}{#if g.alsoIn}<span class="also"> · also counted under <code>{g.alsoIn}</code>, where the desk files them</span>{/if}</td>
        <td>{g.tenants}</td>
        <td class="via">{g.channels.join(' · ')}</td>
        <td class="via">{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .via, .also { color: var(--muted); font-size: 0.85em; }
</style>
