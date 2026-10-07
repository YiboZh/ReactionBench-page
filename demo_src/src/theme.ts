import {Easing, interpolate, spring} from 'remotion';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

// Palette sampled from figures/figure1.pdf (paper overview figure).
export const C = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  line: '#E3E8EF',
  ink: '#0F2236',
  sub: '#55667A',
  faint: '#8B98A8',
  navy: '#0B5B8A',
  purple: '#7B4AA8',
  good: '#1F9D55',
  goodBg: '#E3F5EA',
  bad: '#D64545',
  badBg: '#FCE8E8',
  t1: {main: '#F2AA84', bg: '#FFEBD3', dark: '#9C4821', strong: '#E5814F'},
  t2: {main: '#4E95D9', bg: '#DCEEF8', dark: '#156082', strong: '#2F7FC9'},
  t3: {main: '#8ED973', bg: '#E2F4DA', dark: '#2E6C1E', strong: '#4DAF3A'},
};

export type TaskTheme = typeof C.t1;

export const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 ramp between frames a and b with ease-out. */
export const ramp = (f: number, a: number, b: number, ease = easeOut) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const pop = (f: number, at: number, fps = FPS, damping = 14) =>
  spring({frame: f - at, fps, config: {damping, stiffness: 140, mass: 0.8}});

export const cardStyle: React.CSSProperties = {
  background: C.card,
  borderRadius: 24,
  border: `1px solid ${C.line}`,
  boxShadow: '0 12px 32px rgba(15,34,54,0.08), 0 2px 6px rgba(15,34,54,0.05)',
};
