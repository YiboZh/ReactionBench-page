#!/usr/bin/env python3
"""Extract demo items from the ReactionBench release (read-only) and stage media.

Writes src/data/{ip,srm,grg}.json and public/media/*.mp4. Pure stdlib + ffmpeg.
Usage:  python3 scripts/prepare.py
"""
import json, os, subprocess, collections
from pathlib import Path

REL = Path('/home/xuan/yibo/code/reaction-video-release/gold_eval')
CLIPS = Path('/home/xuan/yibo/code/reaction-video/gold_eval/data/clips')
OUT = Path(__file__).resolve().parent.parent
DATA, MEDIA = OUT / 'src/data', OUT / 'public/media'

IP_VIDEO = '46727'
SRM_ITEM = '66953_c00'
GRG_ITEM = '10369_c00'
IP_MODELS = ['gpt-5', 'tinker_Qwen_Qwen3.5-397B-A17B']
GRG_MODELS = ['gpt-5', 'tinker_Qwen_Qwen3.6-27B']
JUDGE = 'tinker_deepseek-ai_DeepSeek-V3.1'
ALL_MODELS = ['gpt-5', 'gemini-3.7-flash', 'tinker_Qwen_Qwen3.5-9B', 'tinker_Qwen_Qwen3.6-27B',
              'tinker_Qwen_Qwen3.6-35B-A3B', 'tinker_Qwen_Qwen3.5-397B-A17B', 'tinker_moonshotai_Kimi-K2.6']
NAME = {'gpt-5': 'GPT-5', 'gemini-3.7-flash': 'Gemini 3.7 Flash', 'tinker_Qwen_Qwen3.5-9B': 'Qwen3.5-9B',
        'tinker_Qwen_Qwen3.6-27B': 'Qwen3.6-27B', 'tinker_Qwen_Qwen3.6-35B-A3B': 'Qwen3.6-35B-A3B',
        'tinker_Qwen_Qwen3.5-397B-A17B': 'Qwen3.5-397B-A17B', 'tinker_moonshotai_Kimi-K2.6': 'Kimi-K2.6'}


def jsonl(p, key):  # last line wins (same as gold_eval scorers)
    return {json.loads(l)[key]: json.loads(l) for l in open(p) if l.strip()}


def rank(v):
    s = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0] * len(v); i = 0
    while i < len(s):
        j = i
        while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]: j += 1
        for k in range(i, j + 1): r[s[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def rho0(a, b):
    if len(set(a)) == 1: return 0.0
    ra, rb = rank(a), rank(b); n = len(a); ma, mb = sum(ra) / n, sum(rb) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    return num / ((sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** .5)


def ff(src, dst, vf, extra=()):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-an', '-vf', vf + ',fps=30,format=yuv420p',
                    '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-g', '15', *extra, str(MEDIA / dst)], check=True)


def main():
    DATA.mkdir(parents=True, exist_ok=True); MEDIA.mkdir(parents=True, exist_ok=True)
    # ---------- IP ----------
    it = next(r for r in json.load(open(REL / 'tasks/ranking_set.json')) if r['video_id'] == IP_VIDEO)
    human = [m['mean'] for m in it['moments']]
    models = []
    for m in IP_MODELS:
        p = jsonl(REL / f'results/ranking/{m}.jsonl', 'video_id')[IP_VIDEO]['scores']
        v = [p[f'm{i}'] for i in range(len(human))]
        models.append({'id': m, 'name': NAME[m], 'scores': v, 'rho': round(rho0(v, human), 2)})
    ip = {'video_id': IP_VIDEO, 'domain': it['domain'], 'duration_s': it['duration_s'],
          'moments': [{'start': m['start_s'], 'end': m['end_s'], 'mean': m['mean'], 'scores': m['scores']}
                      for m in it['moments']], 'models': models, 'media': 'media/ip_face.mp4'}
    ff(CLIPS / it['face_r2_key'], 'ip_face.mp4', 'scale=640:640:flags=lanczos,unsharp=5:5:0.6')
    json.dump(ip, open(DATA / 'ip.json', 'w'), indent=1)
    # ---------- SRM ----------
    t = next(x for x in json.load(open(REL / 'tasks/match_set.json'))['tasks'] if x['candidate_id'] == SRM_ITEM)
    picks = []
    for m in ALL_MODELS:
        p = jsonl(REL / f'results/match/{m}.jsonl', 'candidate_id').get(SRM_ITEM, {}).get('pred_index')
        picks.append({'id': m, 'name': NAME[m], 'pick': p})
    ff(CLIPS / t['reaction_r2_key'], 'srm_reaction.mp4', 'scale=600:600:flags=lanczos,unsharp=5:5:0.4')
    opts = []
    for i, o in enumerate(t['options']):
        ff(CLIPS / o['key'], f'srm_opt{i}.mp4', 'scale=768:432:flags=lanczos')
        opts.append({'start': o['start_s'], 'end': o['end_s'], 'desc': o['desc'], 'media': f'media/srm_opt{i}.mp4'})
    srm = {'candidate_id': SRM_ITEM, 'correct': t['correct_index'], 'options': opts, 'picks': picks,
           'reaction': 'media/srm_reaction.mp4'}
    json.dump(srm, open(DATA / 'srm.json', 'w'), indent=1)
    # ---------- GRG ----------
    g = next(x for x in json.load(open(REL / 'tasks/rationale_set.json'))['tasks'] if x['candidate_id'] == GRG_ITEM)
    refs = [r['rationale'] for r in json.load(open(REL / 'tasks/rationale_refs.json'))
            if r['candidate_id'] == GRG_ITEM and r['status'] == 'ok']
    gm = []
    for m in GRG_MODELS:
        rat = jsonl(REL / f'results/rationale/{m}.jsonl', 'candidate_id')[GRG_ITEM]['rationale']
        sc = jsonl(REL / f'results/rationale_judge/{m}__by__{JUDGE}.jsonl', 'candidate_id')[GRG_ITEM]['scores']
        gm.append({'id': m, 'name': NAME[m], 'rationale': rat, 'scores': sc, 'total': sum(sc.values())})
    ff(CLIPS / g['stimuli_r2_key'], 'grg_stim.mp4', 'scale=960:-2:flags=lanczos')
    ff(CLIPS / g['face_r2_key'], 'grg_face.mp4', 'scale=640:640:flags=lanczos,unsharp=5:5:0.4')
    grg = {'candidate_id': GRG_ITEM, 'window': [g['start_s'], g['end_s']], 'refs': refs, 'models': gm,
           'judge': 'DeepSeek-V3.1', 'stim': 'media/grg_stim.mp4', 'face': 'media/grg_face.mp4'}
    json.dump(grg, open(DATA / 'grg.json', 'w'), indent=1)
    print(json.dumps({'ip': ip['models'], 'srm': picks, 'grg': [(m['name'], m['total']) for m in gm]}, indent=1))


if __name__ == '__main__':
    main()
