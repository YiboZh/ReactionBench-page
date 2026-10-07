# ReactionBench project page

Built on [Roman Hauksson-Neill's academic project page template](https://github.com/RomanHauksson/academic-project-astro-template) (Astro + Tailwind + MDX, CC BY-SA 4.0).

- Content: `src/paper.mdx`. Leaderboard data: `src/data/leaderboard.json` (from the paper's main results table). SRM quiz items: `src/data/srm_quiz.json`.
- Task demo loops: `public/videos/task*.{mp4,webm,poster.png,gif}`, rendered with Remotion from `demo_src/` (see `demo_src/README.md`).
- Figures: `src/assets/fig/` (rendered from the paper's PDFs).

```bash
npm install
npm run dev      # http://localhost:4321
npx astro build  # static site in dist/
```

Before publishing: fill the author list, links, takedown contact, and BibTeX (marked TODO in `src/paper.mdx`), and set `site`/`base` in `astro.config.ts` for GitHub Pages.
