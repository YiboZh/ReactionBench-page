import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, TaskTheme, cardStyle, easeInOut, ramp} from './theme';

/* ------------------------------------------------------------------ icons */
export const Check: React.FC<{size?: number; color?: string; stroke?: number}> = ({size = 28, color = '#fff', stroke = 3.2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M5 12.5l4.3 4.3L19 7.2" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Cross: React.FC<{size?: number; color?: string; stroke?: number}> = ({size = 28, color = '#fff', stroke = 3.2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);
export const Badge: React.FC<{ok: boolean; size?: number}> = ({ok, size = 34}) => (
  <div style={{width: size, height: size, borderRadius: size, background: ok ? C.good : C.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
    {ok ? <Check size={size * 0.7} /> : <Cross size={size * 0.62} />}
  </div>
);

/* ------------------------------------------------------------- video clip */
/** A video frame at an explicit local frame index (lets us loop/freeze precisely). */
export const Clip: React.FC<{src: string; frame: number; style?: React.CSSProperties}> = ({src, frame, style}) => (
  <Freeze frame={Math.max(0, Math.floor(frame))}>
    <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style}} />
  </Freeze>
);

/* ------------------------------------------------------------------ chips */
export const Chip: React.FC<{children: React.ReactNode; bg?: string; color?: string; style?: React.CSSProperties}> = ({children, bg = 'rgba(15,34,54,0.72)', color = '#fff', style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: bg, color, fontSize: 25, fontWeight: 600, letterSpacing: 0.2, ...style}}>
    {children}
  </div>
);

export const RecDot: React.FC<{color?: string}> = ({color = '#FF5A5A'}) => {
  const f = useCurrentFrame();
  const o = 0.55 + 0.45 * Math.cos((f / 30) * Math.PI * 2);
  return <div style={{width: 12, height: 12, borderRadius: 12, background: color, opacity: o}} />;
};

/* ----------------------------------------------------------------- header */
export type TaskInfo = {num: number; code: string; name: string; desc: string; theme: TaskTheme};

export const Header: React.FC<{task: TaskInfo}> = ({task}) => (
  <div style={{position: 'absolute', left: 72, right: 72, top: 44, height: 96, display: 'flex', alignItems: 'center', fontFamily: FONT}}>
    <div style={{width: 84, height: 84, borderRadius: 20, background: task.theme.main, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, border: `2px solid ${task.theme.dark}22`, boxShadow: '0 6px 16px rgba(15,34,54,0.10)'}}>
      {task.code}
    </div>
    <div style={{marginLeft: 26, display: 'flex', flexDirection: 'column', gap: 4}}>
      <div style={{fontSize: 46, fontWeight: 750 as any, color: C.ink, letterSpacing: -0.6, lineHeight: 1.05}}>
        <span style={{color: task.theme.dark}}>Task {task.num}</span>
        <span style={{color: C.faint, margin: '0 14px', fontWeight: 400}}>·</span>
        {task.name}
      </div>
      <div style={{fontSize: 29, color: C.sub, fontWeight: 500}}>{task.desc}</div>
    </div>
    <div style={{flex: 1}} />
    <Wordmark />
  </div>
);

export const Wordmark: React.FC<{size?: number}> = ({size = 36}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT}}>
    <svg width={size * 1.25} height={size * 1.25} viewBox="0 0 40 40">
      <rect x="2" y="6" width="22" height="16" rx="4" fill={C.navy} />
      <path d="M11 10.5v7.5l6-3.75z" fill="#fff" />
      <circle cx="28" cy="27" r="10" fill={C.purple} />
      <circle cx="24.6" cy="25.2" r="1.4" fill="#fff" />
      <circle cx="31.4" cy="25.2" r="1.4" fill="#fff" />
      <path d="M23.8 29c1.2 2.2 7.2 2.2 8.4 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
    <div style={{fontSize: size, fontWeight: 800, letterSpacing: -0.6, color: C.navy}}>
      Reaction<span style={{color: C.purple}}>Bench</span>
    </div>
  </div>
);

/* --------------------------------------------------------------- step bar */
export const StepBar: React.FC<{steps: string[]; starts: number[]; theme: TaskTheme}> = ({steps, starts, theme}) => {
  const f = useCurrentFrame();
  let active = -1;
  starts.forEach((s, i) => {
    if (f >= s) active = i;
  });
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 972, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, fontFamily: FONT}}>
      {steps.map((s, i) => {
        const on = ramp(f, starts[i], starts[i] + 12);
        const done = i < active;
        const isActive = i === active;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div style={{width: 70, height: 3, borderRadius: 3, background: C.line, margin: '0 14px', position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', inset: 0, width: `${on * 100}%`, background: theme.strong}} />
              </div>
            )}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px 10px 12px', borderRadius: 999,
                background: isActive ? theme.bg : done ? '#fff' : 'transparent',
                border: `2px solid ${isActive ? theme.main : done ? C.line : 'transparent'}`,
                transform: `scale(${1 + 0.04 * (isActive ? ramp(f, starts[i], starts[i] + 10) : 0)})`,
              }}
            >
              <div style={{width: 40, height: 40, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800,
                background: isActive ? theme.strong : done ? theme.main : '#E7ECF2', color: isActive || done ? '#fff' : C.faint}}>
                {done ? <Check size={26} /> : i + 1}
              </div>
              <div style={{fontSize: 28, fontWeight: isActive ? 700 : 550, color: isActive ? theme.dark : done ? C.sub : C.faint}}>{s}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------- title card */
export const TitleCard: React.FC<{task: TaskInfo; tagline: string}> = ({task, tagline}) => (
  <AbsoluteFill style={{background: 'rgba(245,247,250,0.80)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
    <div style={{...cardStyle, width: 1320, padding: '58px 72px 54px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 36, boxShadow: '0 30px 80px rgba(15,34,54,0.16)'}}>
      <Wordmark size={34} />
      <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 34}}>
        <div style={{width: 112, height: 112, borderRadius: 26, background: task.theme.main, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 800}}>{task.code}</div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{fontSize: 30, fontWeight: 700, color: task.theme.dark, letterSpacing: 2, textTransform: 'uppercase'}}>Task {task.num}</div>
          <div style={{fontSize: task.name.length > 22 ? 62 : 74, fontWeight: 800, color: C.ink, letterSpacing: -1.4, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{task.name}</div>
        </div>
      </div>
      <div style={{width: 120, height: 5, borderRadius: 5, background: task.theme.main, margin: '34px 0 26px'}} />
      <div style={{fontSize: 33, color: C.sub, textAlign: 'center', lineHeight: 1.4, maxWidth: 1040}}>{tagline}</div>
    </div>
  </AbsoluteFill>
);

/* ------------------------------------------------------------- loop shell */
/**
 * Seamless loop: frame 0 shows the frozen opening state + title card; the title
 * card dissolves into the live scene, and during the last FADE frames the same
 * frozen opening state dissolves back in, so frame DUR wraps to frame 0.
 */
export const LoopShell: React.FC<{
  duration: number; task: TaskInfo; tagline: string; steps: string[]; stepStarts: number[];
  Scene: React.FC; titleOut?: [number, number]; fade?: number;
}> = ({duration, task, tagline, steps, stepStarts, Scene, titleOut = [26, 44], fade = 20}) => {
  const f = useCurrentFrame();
  const body = (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      <Backdrop theme={task.theme} />
      <Header task={task} />
      <Scene />
      <StepBar steps={steps} starts={stepStarts} theme={task.theme} />
    </AbsoluteFill>
  );
  const a = f < titleOut[1]
    ? interpolate(f, titleOut, [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut})
    : interpolate(f, [duration - fade, duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
  return (
    <AbsoluteFill>
      {body}
      {a > 0.001 && (
        <AbsoluteFill style={{opacity: a}}>
          <Freeze frame={0}>{body}</Freeze>
          <AbsoluteFill style={{transform: `translateY(${(1 - a) * (f < titleOut[1] ? -24 : 24)}px) scale(${0.985 + 0.015 * a})`}}>
            <TitleCard task={task} tagline={tagline} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Backdrop: React.FC<{theme: TaskTheme}> = ({theme}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', width: 1300, height: 1300, borderRadius: 1300, left: -520, top: -760, background: `radial-gradient(circle, ${theme.bg} 0%, rgba(255,255,255,0) 65%)`, opacity: 0.9}} />
    <div style={{position: 'absolute', width: 1200, height: 1200, borderRadius: 1200, right: -560, bottom: -720, background: `radial-gradient(circle, ${C.t2.bg} 0%, rgba(255,255,255,0) 65%)`, opacity: 0.55}} />
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.35}}>
      <defs>
        <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="#C9D2DD" />
        </pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#dots)" />
    </svg>
  </AbsoluteFill>
);

/* --------------------------------------------------------- media card */
export const MediaCard: React.FC<{
  x: number; y: number; w: number; h: number; label?: React.ReactNode; border?: string; borderW?: number;
  children: React.ReactNode; style?: React.CSSProperties; dim?: number; radius?: number; overlay?: React.ReactNode;
}> = ({x, y, w, h, label, border, borderW = 0, children, style, dim = 0, radius = 22, overlay}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden', background: '#0d1520',
    boxShadow: border && borderW > 0 ? `0 0 0 ${borderW}px ${border}, 0 18px 40px rgba(15,34,54,0.18)` : '0 14px 34px rgba(15,34,54,0.16)', ...style}}>
    {children}
    {dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(245,247,250,${dim})`}} />}
    {label && <div style={{position: 'absolute', left: 16, top: 16}}>{label}</div>}
    {overlay}
  </div>
);
