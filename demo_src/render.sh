#!/usr/bin/env bash
# Render the three ReactionBench demo loops and encode web deliverables.
#   bash render.sh            # all three
#   bash render.sh IP         # one composition (IP | SRM | GRG)
set -euo pipefail
cd "$(dirname "$0")"
OUT=../public/videos
TMP=${TMP_DIR:-/tmp/reactionbench-demo-render}
mkdir -p "$OUT" "$TMP"
declare -A NAME=([IP]=task1_intensity_profiling [SRM]=task2_stimulus_reaction_matching [GRG]=task3_grounded_rationale)
# GIF settings per composition (fps colors bayer_scale); SRM has 5 moving clips, so it gets fewer frames/colors to stay < 8 MB
declare -A GIFCFG=([IP]="12 192 4" [SRM]="10 160 5" [GRG]="12 192 4")
for C in ${@:-IP SRM GRG}; do
  N=${NAME[$C]}
  read -r GFPS GCOL GBAY <<< "${GIFCFG[$C]}"
  echo "== $C -> $N"
  # 1) lossless-ish master from Remotion
  npx remotion render src/index.ts "$C" "$TMP/$N.master.mp4" --codec=h264 --crf=8 --log=error
  # 2) H.264 for the web: yuv420p, faststart, no audio
  ffmpeg -v error -y -i "$TMP/$N.master.mp4" -an -c:v libx264 -preset veryslow -tune animation -crf ${CRF_H264:-26} \
    -pix_fmt yuv420p -movflags +faststart -x264-params keyint=60:min-keyint=30 "$OUT/$N.mp4"
  # 3) VP9 WebM (two-pass constrained quality)
  ffmpeg -v error -y -i "$TMP/$N.master.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf ${CRF_VP9:-38} -row-mt 1 -deadline good -cpu-used 1 \
    -pass 1 -passlogfile "$TMP/$N.vp9" -f webm /dev/null
  ffmpeg -v error -y -i "$TMP/$N.master.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf ${CRF_VP9:-38} -row-mt 1 -deadline good -cpu-used 1 \
    -pass 2 -passlogfile "$TMP/$N.vp9" -pix_fmt yuv420p "$OUT/$N.webm"
  # 4) poster = first frame
  ffmpeg -v error -y -i "$TMP/$N.master.mp4" -frames:v 1 "$OUT/$N.poster.png"
  # 5) GIF fallback (palettegen)
  ffmpeg -v error -y -i "$TMP/$N.master.mp4" -vf "fps=${GIF_FPS:-$GFPS},scale=${GIF_W:-800}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${GIF_COLORS:-$GCOL}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=$GBAY:diff_mode=rectangle" \
    -loop 0 "$OUT/$N.gif"
  ls -la "$OUT/$N".*
done
