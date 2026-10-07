import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Check, Chip, Clip, Cross, LoopShell, MediaCard, RecDot, TaskInfo} from './components';
import {C, cardStyle, pop, ramp} from './theme';
import grg from './data/grg.json';

const TH = C.t3;
export const GRG_TASK: TaskInfo = {
  num: 3, code: 'T3', name: 'Grounded Rationale Generation', theme: TH,
  desc: 'Explain which stimulus cue caused the reaction, scored against human references',
};

const T0 = 36;
const T_REF = 104;
const T_G1 = 196;
const T_S1 = 276;
const T_G2 = 322;
const T_S2 = 412;
const T_STAT = 474;
export const GRG_DUR = 600;
const CPF = 1.6; // typed characters per frame
const CLIP_FRAMES = 188; // the source cuts to the next compilation clip at ~6.3 s

type Seg = {t: string; hl?: 'good' | 'bad'};
const curly = (s: string) => s.replace(/'/g, '’');

/** Split `text` so that `phrase` is highlighted. */
const segs = (text: string, phrase: string, hl: 'good' | 'bad'): Seg[] => {
  const t = curly(text), p = curly(phrase);
  const i = t.indexOf(p);
  if (i < 0) return [{t}];
  return [{t: t.slice(0, i)}, {t: p, hl}, {t: t.slice(i + p.length)}];
};

const REFS: Seg[][] = [
  segs(grg.refs[0], 'head butts the girl', 'good'),
  segs(grg.refs[2], 'hit the woman unexpectedly', 'good'),
];
const [M1, M2] = grg.models;
const M1_SEGS = segs(M1.rationale, 'the giraffe suddenly lunges its head toward her', 'good');
const M2_SEGS = segs(M2.rationale, "lick the woman's face", 'bad');
const len = (s: Seg[]) => s.reduce((a, b) => a + b.t.length, 0);

const Typed: React.FC<{segs: Seg[]; f: number; start: number; hlAt: number; size?: number; cursor?: boolean}> = ({segs, f, start, hlAt, size = 30, cursor = true}) => {
  const n = Math.max(0, Math.floor((f - start) * CPF));
  const total = len(segs);
  let used = 0;
  const p = ramp(f, hlAt, hlAt + 18);
  const typing = f >= start && n < total;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <span style={{fontSize: size, lineHeight: 1.38, color: C.ink, fontWeight: 500}}>
      {segs.map((s, k) => {
        const vis = s.t.slice(0, Math.max(0, Math.min(s.t.length, n - used)));
        used += s.t.length;
        if (!vis) return null;
        if (!s.hl) return <span key={k}>{vis}</span>;
        const col = s.hl === 'good' ? 'rgba(77,175,58,0.30)' : 'rgba(214,69,69,0.22)';
        const line = s.hl === 'good' ? C.good : C.bad;
        return (
          <span key={k} style={{background: `linear-gradient(to right, ${col} ${p * 100}%, transparent ${p * 100}%)`, borderRadius: 6, padding: '0 2px',
            boxShadow: p > 0 ? `inset 0 -3px 0 ${line}${Math.round(p * 255).toString(16).padStart(2, '0')}` : 'none',
            color: p > 0.5 ? (s.hl === 'good' ? '#1C5E2C' : '#9A2424') : C.ink, fontWeight: p > 0.5 ? 650 : 500}}>
            {vis}
          </span>
        );
      })}
      {cursor && (typing || (f >= start - 10 && f < start)) && (
        <span style={{display: 'inline-block', width: 3, height: size * 1.05, background: TH.strong, marginLeft: 3, verticalAlign: 'text-bottom', opacity: typing || blink ? 1 : 0}} />
      )}
    </span>
  );
};

const TextCard: React.FC<{x: number; title: string; sub: string; icon: React.ReactNode; f: number; at: number; accent: string;
  badge?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode; active: boolean}> = ({x, title, sub, icon, f, at, accent, badge, footer, children, active}) => {
  const a = ramp(f, at - 14, at + 4);
  return (
    <div style={{position: 'absolute', left: x, top: 608, width: 576, height: 350, ...cardStyle, borderRadius: 22, overflow: 'hidden',
      opacity: 0.35 + 0.65 * a, transform: `translateY(${(1 - a) * 14}px)`,
      boxShadow: active ? `0 0 0 3px ${accent}, 0 16px 36px rgba(15,34,54,0.12)` : cardStyle.boxShadow}}>
      <div style={{height: 70, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${C.line}`, background: '#FAFBFC'}}>
        {icon}
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{fontSize: 28, fontWeight: 800, color: C.ink, lineHeight: 1.1}}>{title}</div>
          <div style={{fontSize: 21, color: C.faint, fontWeight: 600}}>{sub}</div>
        </div>
        <div style={{flex: 1}} />
        {badge}
      </div>
      <div style={{padding: '18px 26px 0'}}>{children}</div>
      {footer && <div style={{position: 'absolute', left: 24, bottom: 18}}>{footer}</div>}
    </div>
  );
};

const Avatar: React.FC<{label: string; bg: string; color?: string}> = ({label, bg, color = '#fff'}) => (
  <div style={{width: 44, height: 44, borderRadius: 12, background: bg, color, fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{label}</div>
);

const ScoreBadge: React.FC<{v: number; f: number; at: number}> = ({v, f, at}) => {
  const a = pop(f, at, 30, 11);
  const ok = v >= 4;
  return (
    <div style={{transform: `scale(${a})`, opacity: Math.min(1, a * 2), padding: '6px 16px', borderRadius: 14, background: ok ? C.good : C.bad, color: '#fff',
      fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline', gap: 2}}>
      {v}<span style={{fontSize: 20, opacity: 0.85}}>/5</span>
    </div>
  );
};

const Verdict: React.FC<{ok: boolean; text: string; f: number; at: number}> = ({ok, text, f, at}) => {
  const a = ramp(f, at, at + 14);
  return (
    <div style={{opacity: a, transform: `translateY(${(1 - a) * 10}px)`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 23, fontWeight: 700, color: ok ? '#17663A' : '#A12F2F',
      background: ok ? C.goodBg : C.badBg, padding: '7px 14px 7px 8px', borderRadius: 999}}>
      <div style={{width: 28, height: 28, borderRadius: 28, background: ok ? C.good : C.bad, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {ok ? <Check size={20} /> : <Cross size={18} />}
      </div>
      {text}
    </div>
  );
};

/* -------------------------------------------------------------- rubric */
const ROWS: {k: 'cue' | 'link' | 'faithful'; label: string; max: number}[] = [
  {k: 'cue', label: 'Cue coverage', max: 2},
  {k: 'link', label: 'Linkage', max: 2},
  {k: 'faithful', label: 'Ref. consistency', max: 1},
];
const Rubric: React.FC<{f: number}> = ({f}) => {
  const X = 1244, Y = 180, Wd = 604, Ht = 405;
  const cols = [{m: M1, at: T_S1}, {m: M2, at: T_S2}];
  const cx = [386, 530];
  const stat = ramp(f, T_STAT, T_STAT + 16);
  return (
    <div style={{position: 'absolute', left: X, top: Y, width: Wd, height: Ht, ...cardStyle}}>
      <div style={{position: 'absolute', left: 28, top: 22, display: 'flex', alignItems: 'center', gap: 12}}>
        <Avatar label="J" bg={C.navy} />
        <div>
          <div style={{fontSize: 28, fontWeight: 800, color: C.ink, lineHeight: 1.1}}>Judge rubric</div>
          <div style={{fontSize: 21, color: C.faint, fontWeight: 600}}>text-only · {grg.judge} · vs. human refs</div>
        </div>
      </div>
      {cols.map((c, j) => (
        <div key={j} style={{position: 'absolute', left: cx[j] - 90, width: 180, whiteSpace: 'nowrap', top: 90, textAlign: 'center', fontSize: 22, fontWeight: 800, color: C.sub,
          opacity: 0.35 + 0.65 * ramp(f, c.at - 70, c.at - 50)}}>{c.m.name}</div>
      ))}
      {ROWS.map((r, i) => (
        <React.Fragment key={r.k}>
          <div style={{position: 'absolute', left: 28, right: 28, top: 124 + i * 58, height: 50, borderRadius: 12, background: i % 2 === 0 ? '#F6F8FA' : 'transparent'}} />
          <div style={{position: 'absolute', left: 44, top: 134 + i * 58, fontSize: 26, fontWeight: 650, color: C.ink}}>
            {r.label} <span style={{color: C.faint, fontWeight: 550, fontSize: 21}}>0–{r.max}</span>
          </div>
          {cols.map((c, j) => {
            const v = c.m.scores[r.k];
            const at = c.at + i * 10;
            const a = pop(f, at, 30, 12);
            const full = v === r.max;
            return (
              <div key={j} style={{position: 'absolute', left: cx[j] - 26, top: 129 + i * 58, width: 52, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: f >= at ? (full ? C.goodBg : v === 0 ? C.badBg : '#FFF3DC') : '#EEF2F6', color: f < at ? C.faint : full ? C.good : v === 0 ? C.bad : '#B7791F',
                fontSize: 24, fontWeight: 800, transform: `scale(${f >= at ? 0.6 + 0.4 * a : 1})`}}>
                {f >= at ? v : '·'}
              </div>
            );
          })}
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 28, right: 28, top: 302, height: 2, background: C.line}} />
      <div style={{position: 'absolute', left: 44, top: 316, fontSize: 28, fontWeight: 800, color: C.ink}}>Total <span style={{color: C.faint, fontWeight: 550, fontSize: 21}}>0–5</span></div>
      {cols.map((c, j) => {
        const at = c.at + 34;
        const a = pop(f, at, 30, 11);
        const ok = c.m.total >= 4;
        return (
          <div key={j} style={{position: 'absolute', left: cx[j] - 40, top: 312, width: 80, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: f >= at ? (ok ? C.good : C.bad) : '#EEF2F6', color: f >= at ? '#fff' : C.faint, fontSize: 28, fontWeight: 800, transform: `scale(${f >= at ? 0.6 + 0.4 * a : 1})`}}>
            {f >= at ? c.m.total : '·'}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 366, textAlign: 'center', fontSize: 22, color: C.sub, fontWeight: 600, opacity: stat}}>
        Best mean composite, all 200 items: <b style={{color: TH.dark}}>2.91 / 5</b>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- scene */
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const lf = f < T0 ? 0 : (f - T0) % CLIP_FRAMES;
  const t = (lf / 30).toFixed(1);
  const refLen0 = len(REFS[0]);
  const ref2At = T_REF + refLen0 / CPF + 6;
  return (
    <>
      <MediaCard x={72} y={180} w={720} h={405} label={<Chip>Stimulus</Chip>}>
        <Clip src={grg.stim} frame={lf} />
        <div style={{position: 'absolute', right: 16, bottom: 16}}><Chip style={{fontVariantNumeric: 'tabular-nums'}}>t = {t} s</Chip></div>
      </MediaCard>
      <MediaCard x={816} y={180} w={405} h={405} label={<Chip><RecDot /> Reaction</Chip>}>
        <Clip src={grg.face} frame={lf} />
        <div style={{position: 'absolute', right: 16, bottom: 16}}><Chip style={{fontVariantNumeric: 'tabular-nums'}}>t = {t} s</Chip></div>
      </MediaCard>
      {/* sync link between the two streams */}
      <div style={{position: 'absolute', left: 776, top: 360, width: 56, height: 44, borderRadius: 22, background: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(123,74,168,0.35)'}}>
        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </div>
      <Rubric f={f} />

      <TextCard x={72} title="Human references" sub={`blind-written · ${2} of ${grg.refs.length} shown`} f={f} at={T_REF} accent={TH.main}
        active={f >= T_REF && f < T_G1} icon={<Avatar label="H" bg={TH.main} color={C.ink} />}>
        {REFS.map((r, k) => (
          <div key={k} style={{display: 'flex', gap: 14, marginBottom: 14}}>
            <div style={{width: 4, borderRadius: 4, background: TH.main, flex: 'none', opacity: f >= (k === 0 ? T_REF : ref2At) ? 1 : 0}} />
            <div><Typed segs={r} f={f} start={k === 0 ? T_REF : ref2At} hlAt={T_S1} size={30} /></div>
          </div>
        ))}
      </TextCard>
      <TextCard x={672} title={M1.name} sub="model rationale" f={f} at={T_G1} accent={C.navy} active={f >= T_G1 && f < T_G2}
        icon={<Avatar label="M" bg={C.navy} />} badge={<ScoreBadge v={M1.total} f={f} at={T_S1 + 34} />}
        footer={<Verdict ok text="Names the cue in the references" f={f} at={T_S1 + 40} />}>
        <Typed segs={M1_SEGS} f={f} start={T_G1} hlAt={T_S1} size={30} />
      </TextCard>
      <TextCard x={1272} title={M2.name} sub="model rationale" f={f} at={T_G2} accent={C.navy} active={f >= T_G2 && f < T_STAT}
        icon={<Avatar label="M" bg="#5B6B8C" />} badge={<ScoreBadge v={M2.total} f={f} at={T_S2 + 34} />}
        footer={<Verdict ok={false} text="Wrong cue, contradicts references" f={f} at={T_S2 + 40} />}>
        <Typed segs={M2_SEGS} f={f} start={T_G2} hlAt={T_S2} size={30} />
      </TextCard>
    </>
  );
};

export const GRGVideo: React.FC = () => (
  <LoopShell
    duration={GRG_DUR}
    task={GRG_TASK}
    tagline="A model watches the synchronized stimulus and reaction, then writes which concrete cue caused the reaction. A judge scores it against blind-written human references."
    steps={['Synced stimulus + reaction', 'Human references', 'Model rationale → judge score']}
    stepStarts={[T0, T_REF, T_G1]}
    Scene={Scene}
  />
);
