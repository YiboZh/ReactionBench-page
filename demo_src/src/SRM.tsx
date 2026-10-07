import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Badge, Check, Chip, Clip, Cross, LoopShell, MediaCard, RecDot, TaskInfo} from './components';
import {C, cardStyle, pop, ramp} from './theme';
import srm from './data/srm.json';

const TH = C.t2;
export const SRM_TASK: TaskInfo = {
  num: 2, code: 'T2', name: 'Stimulus–Reaction Matching', theme: TH,
  desc: 'Find the stimulus window that was on screen while the viewer reacted',
};

const T0 = 36;
const T_Q = 196; // "which one?" beat
const T_REVEAL = 290;
const T_PICKS = 330;
const T_STAT = 440;
export const SRM_DUR = 540;

const REACT_FRAMES = 194; // 6.5 s @30
const OPT_FRAMES = [137, 126, 180, 180];
const L = 'ABCD';
const CORRECT = srm.correct;

const tilePos = (i: number) => ({x: 672 + (i % 2) * 600, y: 180 + Math.floor(i / 2) * 348, w: 576, h: 324});

const Tile: React.FC<{i: number; f: number}> = ({i, f}) => {
  const {x, y, w, h} = tilePos(i);
  const lf = f < T0 ? 0 : (f - T0) % OPT_FRAMES[i];
  const isC = i === CORRECT;
  const rv = ramp(f, T_REVEAL, T_REVEAL + 16);
  // scanning highlight during the "considering" phase
  const scanStart = 104, per = 24;
  const scanIdx = f >= scanStart && f < T_REVEAL - 8 ? Math.floor((f - scanStart) / per) % 4 : -1;
  const scanA = scanIdx === i ? Math.sin(((f - scanStart) % per) / per * Math.PI) : 0;
  const pickers = srm.picks.filter((p) => p.pick === i);
  const wrongPick = !isC && pickers.length > 0;
  const tagA = ramp(f, T_PICKS + 70, T_PICKS + 86);
  const borderCol = isC ? C.good : wrongPick ? C.bad : TH.strong;
  const borderW = isC ? 8 * rv : wrongPick ? 5 * tagA : 5 * scanA;
  const qA = ramp(f, T_Q, T_Q + 14) * (1 - rv);
  return (
    <MediaCard x={x} y={y} w={w} h={h} border={borderCol} borderW={borderW}
      style={{filter: !isC ? `grayscale(${0.75 * rv}) brightness(${1 - 0.06 * rv})` : undefined, transform: `scale(${1 + (isC ? 0.02 * rv : -0.015 * rv)})`}}
      dim={!isC ? 0.42 * rv : 0}
      overlay={<>
      {/* model tags */}
      {pickers.length > 0 && (
        <div style={{position: 'absolute', left: 86, top: 23, opacity: tagA, transform: `translateY(${(1 - tagA) * 14}px)`}}>
          <Chip bg={isC ? C.good : C.bad}>
            {isC ? <Check size={22} /> : <Cross size={20} />}
            {isC ? `${pickers.length} of ${srm.picks.length} models` : pickers.map((p) => p.name).join(', ')}
          </Chip>
        </div>
      )}
      </>}>
      <Clip src={srm.options[i].media} frame={lf} />
      <div style={{position: 'absolute', left: 16, top: 16, width: 56, height: 56, borderRadius: 56, background: isC && rv > 0.5 ? C.good : '#fff', color: isC && rv > 0.5 ? '#fff' : C.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.25)'}}>
        {L[i]}
      </div>
      {/* "?" beat */}
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qA}}>
        <div style={{width: 92, height: 92, borderRadius: 92, background: 'rgba(15,34,54,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 58, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin((f - T_Q) / 5 + i)})`}}>?</div>
      </div>
      {isC && (
        <div style={{position: 'absolute', right: 16, top: 16, opacity: rv, transform: `translateY(${(1 - rv) * -12}px)`}}>
          <Chip bg={C.good}><Check size={24} /> Ground truth</Chip>
        </div>
      )}
    </MediaCard>
  );
};

const QuestionBox: React.FC<{f: number}> = ({f}) => {
  const q = 1 - ramp(f, T_REVEAL - 6, T_REVEAL + 6);
  const g = ramp(f, T_REVEAL + 4, T_REVEAL + 18) * (1 - ramp(f, T_STAT, T_STAT + 12));
  const s = ramp(f, T_STAT + 8, T_STAT + 22);
  const pulse = f >= T_Q && f < T_REVEAL ? 0.5 + 0.5 * Math.sin((f - T_Q) / 4) : 0;
  return (
    <div style={{position: 'absolute', left: 72, top: 760, width: 560, height: 92, ...cardStyle, borderRadius: 20,
      border: `2px solid ${f >= T_Q && f < T_REVEAL ? TH.main : C.line}`, boxShadow: `0 0 0 ${pulse * 6}px ${TH.bg}, 0 12px 32px rgba(15,34,54,0.08)`}}>
      <div style={{position: 'absolute', inset: 0, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 18, opacity: q}}>
        <div style={{width: 50, height: 50, borderRadius: 50, background: TH.strong, color: '#fff', fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>?</div>
        <div style={{fontSize: 27, fontWeight: 700, color: C.ink, lineHeight: 1.2}}>Which candidate was on screen during this reaction?</div>
      </div>
      <div style={{position: 'absolute', inset: 0, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 18, opacity: g}}>
        <Badge ok size={50} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
          <div style={{fontSize: 28, fontWeight: 800, color: C.good}}>Answer: {L[CORRECT]} (time-synced)</div>
          <div style={{fontSize: 23, color: C.sub, fontStyle: 'italic'}}>On D: “…Sometimes it makes me cry.”</div>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 18, opacity: s}}>
        <div style={{fontSize: 40, fontWeight: 800, color: TH.dark, fontVariantNumeric: 'tabular-nums', flex: 'none'}}>50.9%</div>
        <div style={{fontSize: 23, color: C.sub, lineHeight: 1.25, fontWeight: 600}}>best model accuracy on all 112 items <span style={{color: C.faint}}>(chance 25%)</span></div>
      </div>
    </div>
  );
};

const PickRow: React.FC<{f: number}> = ({f}) => {
  const o = ramp(f, T_PICKS - 6, T_PICKS + 8);
  return (
    <div style={{position: 'absolute', left: 72, top: 872, width: 1776, height: 72, ...cardStyle, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', gap: 10, opacity: o}}>
            {srm.picks.map((p, k) => {
        const ok = p.pick === CORRECT;
        const a = pop(f, T_PICKS + 6 + k * 7, 30, 13);
        return (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 5px', borderRadius: 999, background: ok ? C.goodBg : C.badBg,
            border: `2px solid ${ok ? '#9AD8B1' : '#F0A8A8'}`, transform: `scale(${0.5 + 0.5 * a})`, opacity: Math.min(1, a * 2)}}>
            <div style={{width: 38, height: 38, borderRadius: 38, background: ok ? C.good : C.bad, color: '#fff', fontWeight: 800, fontSize: 23, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {p.pick === null ? '–' : L[p.pick]}
            </div>
            <div style={{fontSize: 24, fontWeight: 700, color: ok ? '#17663A' : '#A12F2F', whiteSpace: 'nowrap', letterSpacing: -0.2}}>{p.name}</div>
          </div>
        );
      })}
    </div>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const rf = f < T0 ? 0 : (f - T0) % REACT_FRAMES;
  const rv = ramp(f, T_REVEAL, T_REVEAL + 16);
  const placeholder = 1 - ramp(f, T_PICKS - 6, T_PICKS + 8);
  return (
    <>
      <MediaCard x={72} y={180} w={560} h={560} border={rv > 0 ? C.good : TH.strong} borderW={rv > 0 ? 8 * rv : 0}
        label={<Chip><RecDot /> Reaction clip · 6.5 s</Chip>}>
        <Clip src={srm.reaction} frame={rf} />
        <div style={{position: 'absolute', left: 16, bottom: 16, opacity: rv}}>
          <Chip bg={C.good}><Check size={22} /> Aligned with {L[CORRECT]}</Chip>
        </div>
      </MediaCard>
      <div style={{position: 'absolute', left: 672, top: 146, fontSize: 21, fontWeight: 700, color: C.sub, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0}}>
        4 candidates
      </div>
      {[0, 1, 2, 3].map((i) => <Tile key={i} i={i} f={f} />)}
      <QuestionBox f={f} />
      <div style={{position: 'absolute', left: 72, top: 872, width: 1776, height: 72, borderRadius: 20, border: `2px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 25, color: C.faint, fontWeight: 600, opacity: placeholder}}>
        All four candidates come from the same source video; only one overlaps the reaction in time
      </div>
      <PickRow f={f} />
    </>
  );
};

export const SRMVideo: React.FC = () => (
  <LoopShell
    duration={SRM_DUR}
    task={SRM_TASK}
    tagline="A model sees one reaction clip and four candidate stimulus windows from the same video, and must pick the one that was on screen during the reaction."
    steps={['Reaction + 4 candidates', 'Which one?', 'Ground truth & model picks']}
    stepStarts={[T0, T_Q, T_REVEAL]}
    Scene={Scene}
  />
);
