import { useState } from "react";
import quiz from "../data/srm_quiz.json";

type Item = {
  id: string;
  reaction: string;
  options: string[];
  answer: number;
  models: Record<string, number | null>;
};

const items = quiz.items as Item[];
const LETTERS = ["A", "B", "C", "D"];

export function SRMQuiz({ base = "/" }: { base?: string }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  if (items.length === 0) {
    return (
      <div className="not-prose rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        Interactive SRM quiz — items are added once the demo clips are rendered.
      </div>
    );
  }

  const item = items[idx];
  const reveal = picked !== null;

  function choose(i: number) {
    if (reveal) return;
    setPicked(i);
    setScore((s) => ({ right: s.right + (i === item.answer ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setPicked(null);
    setIdx((idx + 1) % items.length);
  }

  return (
    <div className="not-prose rounded-2xl border border-[var(--rb-t2)] bg-[var(--rb-t2-soft)] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <span className="rounded-lg bg-[var(--rb-t2)] px-3 py-1 font-bold text-white">Your turn</span>
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Which stimulus was on screen during this reaction?</span>
        <span className="ml-auto text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
          You: {score.right}/{score.total} · item {idx + 1}/{items.length}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <figure className="m-0">
          <video className="aspect-video w-full rounded-xl bg-black object-cover" src={base + item.reaction} autoPlay muted loop playsInline />
          <figcaption className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Reaction window</figcaption>
        </figure>
        <div className="grid grid-cols-2 gap-3">
          {item.options.map((src, i) => {
            const isAnswer = i === item.answer;
            const ring = reveal
              ? isAnswer
                ? "ring-4 ring-emerald-500"
                : i === picked
                  ? "ring-4 ring-rose-500 opacity-70"
                  : "opacity-50"
              : "hover:ring-4 hover:ring-[var(--rb-t2)]";
            const pickers = Object.entries(item.models).filter(([, v]) => v === i).map(([k]) => k);
            return (
              <button key={src} onClick={() => choose(i)} className={`relative overflow-hidden rounded-xl text-left transition ${ring}`}>
                <video className="aspect-video w-full bg-black object-cover" src={base + src} autoPlay muted loop playsInline />
                <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-sm font-bold text-white">{LETTERS[i]}</span>
                {reveal && pickers.length > 0 && (
                  <span className="absolute right-2 bottom-2 left-2 flex flex-wrap gap-1">
                    {pickers.map((m) => (
                      <span key={m} className="rounded bg-white/90 px-1.5 py-0.5 text-[0.7rem] font-medium text-zinc-900">
                        {m}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex min-h-10 flex-wrap items-center gap-3">
        {reveal ? (
          <>
            <span className={`text-lg font-semibold ${picked === item.answer ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
              {picked === item.answer ? "Correct!" : `Not quite — it was ${LETTERS[item.answer]}.`}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">Labels on each clip show which models picked it.</span>
            <button onClick={next} className="ml-auto rounded-full bg-zinc-900 px-5 py-2 font-medium text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900">
              Next item →
            </button>
          </>
        ) : (
          <span className="text-zinc-600 dark:text-zinc-400">Pick A–D. The best model reaches 50.9% on this task (chance 25%).</span>
        )}
      </div>
    </div>
  );
}
