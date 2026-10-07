import { useMemo, useState } from "react";
import data from "../data/leaderboard.json";

type Row = { model: string; access: string } & Record<string, number | string>;
type Column = { key: string; group: string; label: string; higher: boolean };

const columns = data.columns as Column[];
const rows = data.rows as Row[];

// Best value per column, overall and among open-weight models (bold / underline, as in the paper).
function bestOf(key: string, filter: (r: Row) => boolean) {
  return Math.max(...rows.filter(filter).map((r) => r[key] as number));
}

const fmt = (v: number) => (v < 1 ? v.toFixed(3).replace(/^0/, "") : v.toFixed(3));

export function Leaderboard() {
  const [sortKey, setSortKey] = useState("srm_acc");
  const [access, setAccess] = useState<"all" | "proprietary" | "open">("all");

  const best = useMemo(
    () =>
      Object.fromEntries(
        columns.map((c) => [c.key, { all: bestOf(c.key, () => true), open: bestOf(c.key, (r) => r.access === "open") }]),
      ),
    [],
  );

  const sorted = useMemo(
    () =>
      rows
        .filter((r) => access === "all" || r.access === access)
        .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)),
    [sortKey, access],
  );

  const groups = columns.reduce<{ name: string; span: number }[]>((acc, c) => {
    const last = acc[acc.length - 1];
    if (last && last.name === c.group) last.span += 1;
    else acc.push({ name: c.group, span: 1 });
    return acc;
  }, []);

  return (
    <div className="not-prose">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {(["all", "proprietary", "open"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAccess(a)}
            className={`rounded-full border px-3 py-1 transition ${
              access === a
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {a === "all" ? "All models" : a === "open" ? "Open-weight" : "Proprietary"}
          </button>
        ))}
        <span className="ml-auto text-zinc-500">Click a column to sort · bold = best, underline = best open-weight</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[46rem] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="text-xs tracking-wider text-zinc-500 uppercase">
              <th rowSpan={2} className="border-b border-zinc-200 px-3 py-2 text-left dark:border-zinc-800">
                #
              </th>
              <th rowSpan={2} className="border-b border-zinc-200 px-3 py-2 text-left dark:border-zinc-800">
                Model
              </th>
              {groups.map((g) => (
                <th key={g.name} colSpan={g.span} className="border-l border-zinc-200 px-3 pt-2 text-center dark:border-zinc-800">
                  {g.name}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  onClick={() => setSortKey(c.key)}
                  className={`cursor-pointer border-b border-zinc-200 px-3 py-2 text-center font-medium whitespace-nowrap select-none dark:border-zinc-800 ${
                    i === 0 || columns[i - 1].group !== c.group ? "border-l" : ""
                  } ${sortKey === c.key ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                >
                  {c.label} {sortKey === c.key ? "▼" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.model} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40">
                <td className="px-3 py-2 text-zinc-400">{idx + 1}</td>
                <td className="px-3 py-2 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                  {r.model}
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[0.7rem] ${
                      r.access === "open"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {r.access === "open" ? "open" : "API"}
                  </span>
                </td>
                {columns.map((c, i) => {
                  const v = r[c.key] as number;
                  const isBest = v === best[c.key].all;
                  const isBestOpen = r.access === "open" && v === best[c.key].open;
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2 text-center ${i === 0 || columns[i - 1].group !== c.group ? "border-l border-zinc-100 dark:border-zinc-800" : ""} ${
                        sortKey === c.key ? "bg-zinc-50 dark:bg-zinc-800/50" : ""
                      } ${isBest ? "font-bold text-zinc-950 dark:text-white" : "text-zinc-700 dark:text-zinc-300"} ${isBestOpen ? "underline underline-offset-4" : ""}`}
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="text-zinc-400 italic">
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2">Chance</td>
              {columns.map((c, i) => (
                <td key={c.key} className={`px-3 py-2 text-center ${i === 0 || columns[i - 1].group !== c.group ? "border-l border-zinc-100 dark:border-zinc-800" : ""}`}>
                  {c.key === "srm_acc" ? ".250" : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
