# ReactionBench demo loops

Source for the three looping teaser videos on the project page (one per task).
They are built with [Remotion](https://www.remotion.dev) (React → video) at
1920×1080, 30 fps, and loop seamlessly: frame 0 is the title card over the frozen
opening frame, and the last 20 frames dissolve back into that same state.

| Composition | Output basename (`../public/videos/`) | Length | Item |
|---|---|---|---|
| `IP`  | `task1_intensity_profiling`        | 20.0 s | ranking video `46727` |
| `SRM` | `task2_stimulus_reaction_matching` | 18.0 s | match item `56761_c00` |
| `GRG` | `task3_grounded_rationale`         | 20.0 s | rationale item `10369_c00` |

Each basename has `.mp4` (H.264, yuv420p, faststart, no audio), `.webm` (VP9),
`.poster.png` (first frame) and `.gif` (800 px wide, 12 fps; SRM 10 fps).

## Re-render

```bash
npm install                 # remotion 4.0.532, react 18, @fontsource/inter
export REACTIONBENCH_DIR=../../ReactionBench          # checkout of MIT-MI/ReactionBench (default)
export REACTIONBENCH_MEDIA_DIR=/path/to/clips          # evaluation clips laid out by key
python3 scripts/prepare.py  # extracts item data -> src/data/*.json, stages clips -> public/media/
bash render.sh              # all three; or: bash render.sh IP
npm run studio              # interactive preview / timeline scrubbing
```

`public/media/` and `node_modules/` are git-ignored (regenerate with the two commands above).
`render.sh` renders a near-lossless master per composition (to `$TMP_DIR`,
default `/tmp/reactionbench-demo-render`) and then encodes the web deliverables
with ffmpeg. Size knobs: `CRF_H264` (default 26), `CRF_VP9` (38), `GIF_FPS` (12; 10 for SRM),
`GIF_W` (800), `GIF_COLORS` (192; 160 for SRM).

## Data sources (read-only)

* Tasks: `ReactionBench/reactionbench/tasks/{ranking_set,match_set,rationale_set,rationale_refs}.json`
* Predictions: `reactionbench/results/ranking/*.jsonl` (IP, joint setting),
  `results/match/*.jsonl` (SRM), `results/rationale/*.jsonl` +
  `results/rationale_judge/*__by__tinker_deepseek-ai_DeepSeek-V3.1.jsonl` (GRG; the paper's shared judge).
  As in the reactionbench scorers, the last line per item wins.
* Clips: `$REACTIONBENCH_MEDIA_DIR/{face,match,stagec}/`.
* Benchmark-level numbers shown in the videos come from the paper's main table:
  SRM best accuracy 50.9 % (GPT-5, chance 25 %), GRG best mean composite 2.91/5 (Kimi-K2.6).

To swap an example, change `IP_VIDEO` / `SRM_ITEM` / `GRG_ITEM` (and the model
lists) at the top of `scripts/prepare.py`, re-run it, and adjust the few
item-specific strings: the highlighted phrases in `src/GRG.tsx` (`segs(...)`)
and, for SRM, the caption in `SRM_CAPTIONS` (`scripts/prepare.py`).

## Why these items

* **IP `46727`** (Comedy / internet culture, 14 s, 3 moments). Highest
  between-moment spread in the 250-video set (human means 2.50 / 2.83 / 1.17 from
  6 raters each), short enough to play in full in real time, and the reactions are
  large, unmistakable laughs. Outcome: GPT-5 swaps the top two moments (ρ = 0.50),
  Qwen3.5-397B-A17B recovers the human order exactly (ρ = 1.00).
* **SRM `56761_c00`** (*The Theory of Everything*; the viewer gasps and smiles). The
  aligned window (A) carries the subtitle "Will you dance with me?", so the match is legible
  without sound. GPT-5 and three other models pick C, a later romantic scene from the same
  film; Gemini 3.7 Flash, Qwen3.5-9B and Qwen3.6-27B pick A. It shows the typical failure:
  the model recognizes the film and the mood but not the moment. Chosen from eight rendered
  candidates (`SRM_ITEM=<id> ONLY=srm python3 scripts/prepare.py` swaps the item; add its
  caption to `SRM_CAPTIONS`).
* **GRG `10369_c00`** (animal clip: a giraffe head-butts a woman taking a selfie;
  the viewer's jaw drops). The cue is obvious on screen. GPT-5 names it (judge
  5/5: cue 2, link 2, ref. consistency 1); Qwen3.6-27B describes the giraffe
  "licking the woman's face" (2/5: cue 0, link 2, ref. consistency 0).

The green/red phrase highlights in the GRG video are illustrative annotations
added for the demo; the judge outputs only the per-criterion scores shown.

## Layout

* `src/theme.ts` — palette (sampled from the paper's `figures/figure1.pdf`), easing helpers.
* `src/components.tsx` — header, step bar, title card, `LoopShell` (seamless-loop logic), media cards.
* `src/IP.tsx`, `src/SRM.tsx`, `src/GRG.tsx` — one composition per task; all timing constants at the top.
