import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Chip, Clip, LoopShell, MediaCard, RecDot, TaskInfo, Check} from './components';
import {C, cardStyle, pop, ramp} from './theme';
import ip from './data/ip.json';

const TH = C.t1;
export const IP_TASK: TaskInfo = {
  num: 1, code: 'T1', name: 'Intensity Profiling', theme: TH,
  desc: 'Score how strongly one viewer reacts at each marked moment of a reaction video',
};

const T0 = 36; // video playback starts
const VID_FRAMES = Math.floor(ip.duration_s * 30) - 1;
const T_END = T0 + VID_FRAMES; // ~457
const T_MODEL = T_END + 4;
export const IP_DUR = 600;

const MODEL_COLORS = ['#5B6B8C', C.purple];
const fmtT = (t: number) => `0:${Math.floor(t).toString().padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
const nMom = ip.moments.length;
const humanMeans = ip.moments.map((m) => m.mean);
const momentDone = (i: number) => T0 + ip.moments[i].end * 30; // bar appears when window ends

const order = (v: number[]) => v.map((x, i) => [x, i] as [number, number]).sort((a, b) => b[0] - a[0]).map((p) => p[1]);

/* ---------------------------------------------------------------- chart */
const Chart: React.FC<{f: number}> = ({f}) => {
  const X = 716, Y = 180, Wd = 1132, Ht = 620;
  const plotL = 118, plotR = Wd - 48, top = 140, base = 362, ph = base - top;
  const gw = (plotR - plotL) / nMom;
  const yOf = (v: number) => base - (v / 3) * ph;
  const mIn = ramp(f, T_MODEL, T_MODEL + 22);
  const tNow = (f - T0) / 30;
  return (
    <div style={{position: 'absolute', left: X, top: Y, width: Wd, height: Ht, ...cardStyle}}>
      {/* title + legend */}
      <div style={{position: 'absolute', left: 40, top: 30, fontSize: 31, fontWeight: 750 as any, color: C.ink, letterSpacing: -0.3}}>Intensity by moment</div>
      <div style={{position: 'absolute', right: 40, top: 34, display: 'flex', gap: 22, fontSize: 24, fontWeight: 600, color: C.sub}}>
        <Legend color={TH.strong} label="Human (0–3)" o={1} />
        {ip.models.map((m, k) => (
          <Legend key={k} color={MODEL_COLORS[k]} label={`${m.name}`} o={ramp(f, T_MODEL + 8 * k, T_MODEL + 8 * k + 14)} />
        ))}
      </div>
      {/* grid */}
      {[0, 1, 2, 3].map((g) => (
        <React.Fragment key={g}>
          <div style={{position: 'absolute', left: plotL - 12, right: 48, top: yOf(g), height: g === 0 ? 2 : 1, background: g === 0 ? '#C5CED9' : '#EDF1F5'}} />
          <div style={{position: 'absolute', left: 52, width: 40, textAlign: 'right', top: yOf(g) - 13, fontSize: 21, color: C.faint, fontWeight: 600}}>{g}</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', right: 8, top: yOf(3) - 12, fontSize: 18, color: C.faint, opacity: mIn, width: 36, textAlign: 'center'}}>100</div>
      {/* groups */}
      {ip.moments.map((m, i) => {
        const cx = plotL + gw * (i + 0.5);
        const active = tNow >= m.start && tNow < m.end && f < T_END;
        const actA = active ? Math.min(1, (tNow - m.start) * 4, (m.end - tNow) * 4) : 0;
        const done = momentDone(i);
        const barP = pop(f, done + 10, 30, 18);
        const hW = 96, mW = 64, gap = 12;
        const groupW = hW + (mW + gap) * 2;
        const hx = cx - hW / 2 + mIn * (-(groupW / 2) + hW / 2);
        const counts: Record<number, number> = {};
        return (
          <React.Fragment key={i}>
            {/* active highlight */}
            <div style={{position: 'absolute', left: cx - gw / 2 + 10, width: gw - 20, top: top - 26, height: base - top + 92, borderRadius: 18, background: TH.bg, opacity: actA * 0.9, border: `2px dashed ${TH.main}`}} />
            {active && (
              <div style={{position: 'absolute', left: cx - 120, width: 240, top: top + 40, textAlign: 'center', fontSize: 26, fontWeight: 700, color: TH.dark, opacity: actA}}>
                watching…
              </div>
            )}
            {/* human bar */}
            <div style={{position: 'absolute', left: hx, width: hW, top: yOf(m.mean * barP), height: Math.max(0, base - yOf(m.mean * barP)), borderRadius: '12px 12px 0 0',
              background: `linear-gradient(180deg, ${TH.strong} 0%, ${TH.main} 100%)`, boxShadow: barP > 0.01 ? '0 6px 14px rgba(229,129,79,0.25)' : 'none'}} />
            {/* rater dots */}
            {m.scores.map((s, k) => {
              const n = m.scores.filter((x) => x === s).length;
              const kk = (counts[s] = (counts[s] ?? -1) + 1);
              const dx = (kk - (n - 1) / 2) * 24;
              const d = pop(f, done + k * 2, 30, 12);
              return (
                <div key={k} style={{position: 'absolute', left: hx + hW / 2 + dx - 9, top: yOf(s) - 9 - (1 - d) * 40, width: 18, height: 18, borderRadius: 18,
                  background: '#fff', border: `3px solid ${TH.dark}`, opacity: Math.min(1, d * 1.4) * (1 - 0.0 * mIn)}} />
              );
            })}
            <div style={{position: 'absolute', left: hx - 20, width: hW + 40, textAlign: 'center', top: yOf(Math.max(m.mean, ...m.scores)) - 56, fontSize: 34, fontWeight: 800, color: TH.dark,
              opacity: ramp(f, done + 18, done + 28), fontVariantNumeric: 'tabular-nums'}}>
              {m.mean.toFixed(2)}
            </div>
            {/* model bars */}
            {ip.models.map((md, k) => {
              const p = pop(f, T_MODEL + 8 * k + 6, 30, 18);
              const v = (md.scores[i] / 100) * 3 * p;
              const bx = hx + hW + gap + k * (mW + gap);
              return (
                <React.Fragment key={k}>
                  <div style={{position: 'absolute', left: bx, width: mW, top: yOf(v), height: Math.max(0, base - yOf(v)), borderRadius: '10px 10px 0 0', background: MODEL_COLORS[k], opacity: 0.92 * Math.min(1, p * 3)}} />
                  <div style={{position: 'absolute', left: bx - 12, width: mW + 24, textAlign: 'center', top: yOf((md.scores[i] / 100) * 3) - 38, fontSize: 27, fontWeight: 700, color: MODEL_COLORS[k],
                    opacity: ramp(f, T_MODEL + 8 * k + 18, T_MODEL + 8 * k + 28), fontVariantNumeric: 'tabular-nums'}}>
                    {md.scores[i]}
                  </div>
                </React.Fragment>
              );
            })}
            {/* group label */}
            <div style={{position: 'absolute', left: cx - 140, width: 280, top: base + 14, textAlign: 'center'}}>
              <span style={{fontSize: 30, fontWeight: 800, color: active ? TH.dark : C.ink}}>M{i + 1}</span>
              <span style={{fontSize: 24, color: C.faint, marginLeft: 10, fontWeight: 600}}>{m.start}–{m.end} s</span>
            </div>
          </React.Fragment>
        );
      })}
      {/* rank rows */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 456, height: 150, borderRadius: 14, border: `2px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 25, color: C.faint, fontWeight: 600, opacity: 1 - ramp(f, momentDone(nMom - 1) + 20, momentDone(nMom - 1) + 34)}}>
        Rankings appear once every moment has been rated
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 440, height: 1, background: C.line}} />
      <RankRow f={f} at={momentDone(nMom - 1) + 34} y={454} name="Human consensus" color={TH.strong} vals={humanMeans} ref_={humanMeans} />
      {ip.models.map((m, k) => (
        <RankRow key={k} f={f} at={T_MODEL + 26 + 16 * k} y={454 + 54 * (k + 1)} name={m.name} color={MODEL_COLORS[k]} vals={m.scores} ref_={humanMeans} rho={m.rho} />
      ))}
    </div>
  );
};

const Legend: React.FC<{color: string; label: string; o: number}> = ({color, label, o}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 9, opacity: o}}>
    <div style={{width: 18, height: 18, borderRadius: 5, background: color}} />
    {label}
  </div>
);

const RankRow: React.FC<{f: number; at: number; y: number; name: string; color: string; vals: number[]; ref_: number[]; rho?: number}> = ({f, at, y, name, color, vals, ref_, rho}) => {
  const o = ramp(f, at, at + 14);
  const ord = order(vals);
  const refOrd = order(ref_);
  const isModel = rho !== undefined;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: y, height: 50, display: 'flex', alignItems: 'center', opacity: o, transform: `translateX(${(1 - o) * -24}px)`}}>
      <div style={{width: 18, height: 18, borderRadius: 5, background: color, marginRight: 14}} />
      <div style={{width: 330, fontSize: 28, fontWeight: 700, color: C.ink}}>{name}</div>
      {ord.map((m, j) => {
        const ok = !isModel || refOrd[j] === m;
        const po = pop(f, at + 4 + j * 4, 30, 13);
        return (
          <React.Fragment key={j}>
            {j > 0 && <div style={{fontSize: 30, color: C.faint, margin: '0 14px', fontWeight: 700}}>&gt;</div>}
            <div style={{transform: `scale(${0.6 + 0.4 * po})`, padding: '3px 18px', borderRadius: 11, fontSize: 28, fontWeight: 800,
              background: isModel ? (ok ? C.goodBg : C.badBg) : TH.bg, color: isModel ? (ok ? C.good : C.bad) : TH.dark,
              border: `2px solid ${isModel ? (ok ? '#9AD8B1' : '#F0A8A8') : TH.main}`}}>
              M{m + 1}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{flex: 1}} />
      {isModel && (
        <div style={{display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${0.7 + 0.3 * pop(f, at + 14, 30, 12)})`, opacity: ramp(f, at + 12, at + 20)}}>
                    <div style={{padding: '4px 18px', borderRadius: 12, fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            background: rho! >= 0.99 ? C.good : rho! > 0 ? '#E9A23B' : C.bad, color: '#fff', display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 22, fontWeight: 650, opacity: 0.9}}>Spearman</span> ρ = {rho!.toFixed(2)}
            {rho! >= 0.99 && <Check size={28} />}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------- timeline */
const Timeline: React.FC<{f: number}> = ({f}) => {
  const X = 72, Y = 824, Wd = 1776, Ht = 120;
  const l = 170, r = Wd - 48, ty = 64;
  const dur = ip.duration_s;
  const xOf = (t: number) => l + (t / dur) * (r - l);
  const t = Math.max(0, Math.min(dur, (f - T0) / 30));
  const px = xOf(t);
  return (
    <div style={{position: 'absolute', left: X, top: Y, width: Wd, height: Ht, ...cardStyle, borderRadius: 20}}>
      <div style={{position: 'absolute', left: 30, top: 24, fontSize: 23, fontWeight: 700, color: C.sub, letterSpacing: 1.5, textTransform: 'uppercase'}}>Timeline</div>
      <div style={{position: 'absolute', left: 30, top: 56, fontSize: 22, color: C.faint, fontWeight: 600}}>{nMom} marked</div>
      <div style={{position: 'absolute', left: 30, top: 82, fontSize: 22, color: C.faint, fontWeight: 600}}>moments</div>
      {/* track */}
      <div style={{position: 'absolute', left: l, width: r - l, top: ty - 5, height: 10, borderRadius: 10, background: '#E7ECF2'}} />
      <div style={{position: 'absolute', left: l, width: px - l, top: ty - 5, height: 10, borderRadius: 10, background: '#B8C4D2'}} />
      {Array.from({length: Math.floor(dur) + 1}).map((_, s) => (
        <React.Fragment key={s}>
          <div style={{position: 'absolute', left: xOf(s) - 1, top: ty + 22, width: 2, height: s % 2 === 0 ? 10 : 6, background: '#C5CED9'}} />
          {s % 2 === 0 && <div style={{position: 'absolute', left: xOf(s) - 30, width: 60, textAlign: 'center', top: ty + 32, fontSize: 21, color: C.faint, fontWeight: 600}}>{s}s</div>}
        </React.Fragment>
      ))}
      {ip.moments.map((m, i) => {
        const active = t >= m.start && t < m.end && f < T_END;
        const done = f >= momentDone(i);
        const a = pop(f, 14 + i * 4, 30, 14);
        return (
          <div key={i} style={{position: 'absolute', left: xOf(m.start), width: xOf(m.end) - xOf(m.start), top: ty - 24, height: 48, borderRadius: 12,
            background: active ? TH.strong : TH.bg, border: `2.5px solid ${active ? TH.dark : TH.main}`, transform: `scaleY(${a}) scale(${active ? 1.04 : 1})`,
            boxShadow: active ? '0 8px 22px rgba(229,129,79,0.45)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 28, fontWeight: 800, color: active ? '#fff' : TH.dark}}>
            M{i + 1}
            {done && !active && <div style={{width: 24, height: 24, borderRadius: 24, background: TH.strong, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check size={18} /></div>}
          </div>
        );
      })}
      {/* playhead */}
      <div style={{position: 'absolute', left: px - 1.5, top: ty - 36, width: 3, height: 72, background: C.navy, borderRadius: 3}} />
      <div style={{position: 'absolute', left: px - 7, top: ty - 42, width: 14, height: 14, borderRadius: 14, background: C.navy}} />
    </div>
  );
};

/* ----------------------------------------------------------------- scene */
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const vf = Math.max(0, Math.min(VID_FRAMES, f - T0));
  const t = vf / 30;
  const act = ip.moments.findIndex((m) => t >= m.start && t < m.end);
  const inMom = act >= 0 && f < T_END && f >= T0;
  const bw = inMom ? 7 * Math.min(1, (t - ip.moments[act].start) * 5, (ip.moments[act].end - t) * 5) : 0;
  const endDim = interpolate(f, [T_END, T_END + 20], [0, 0.18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <MediaCard x={72} y={180} w={620} h={620} border={TH.strong} borderW={bw} dim={endDim}
        label={<Chip><RecDot /> Reaction video</Chip>}>
        <Clip src={ip.media} frame={vf} />
        <div style={{position: 'absolute', right: 16, bottom: 16}}>
          <Chip style={{fontVariantNumeric: 'tabular-nums'}}>{fmtT(t)} / 0:{Math.round(ip.duration_s)}</Chip>
        </div>
        {inMom && (
          <div style={{position: 'absolute', right: 16, top: 16, opacity: Math.min(1, bw / 3)}}>
            <Chip bg={TH.strong}>Marked moment M{act + 1}</Chip>
          </div>
        )}
      </MediaCard>
      <Chart f={f} />
      <Timeline f={f} />
    </>
  );
};

export const IPVideo: React.FC = () => (
  <LoopShell
    duration={IP_DUR}
    task={IP_TASK}
    tagline="Given a reaction video and its marked moments, a model scores each moment’s intensity (0–100). Its ranking is compared with the consensus of human raters."
    steps={['Watch the marked moments', 'Human ratings (mean of 6)', 'Model scores vs. humans']}
    stepStarts={[T0, momentDone(0), T_MODEL]}
    Scene={Scene}
  />
);
