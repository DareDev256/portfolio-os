#!/bin/bash
# record-agent-feed.sh — film a REAL Claude Code session for the homepage monitor's
# "Passion Agent" feed (source 4), nightly.
#
# What it does: renders a VHS tape (headless terminal via ttyd + chromium, so it never
# touches the screen) that runs the interactive Claude Code TUI on a short READ-ONLY task,
# then publishes
#   public/assets/system/monitor/feed-agent.mp4   960x540 h264 yuv420p faststart, no audio
#   public/assets/system/monitor/feed-agent.jpg   poster
#   public/data/agent-feed.json                   { recordedAt, task, model, durationSec, playbackSec, exitCode }
#
# The task (public data only, on camera): fact-check the three numbers the homepage prints
# (stars, forks, PyPI version) against the live GitHub API and PyPI.
#
# Everything is written to a temp run dir first; nothing is moved into the repo until EVERY gate
# passes, so a failed night leaves the last good clip untouched.
#
# EXIT CODES
#   0   published a fresh clip
#   1   missing dependency / setup failure
#   2   recording failed or the session did not finish (no clip published)
#   3   PUBLIC-SAFETY GATE refused (capture matched a secret/PII pattern; old clip kept)
#   4   clip/capture failed a quality gate (not enough tool calls, API error, bad encode)
#   75  claude CLI logged out (stood down)
#   76  usage reserve refused (stood down; same lib as every unattended claude job)
#
# Test hooks: AGENT_FEED_PLANT=1 types a FAKE token on camera to prove the gate refuses;
#             AGENT_FEED_REPO=<dir> publishes somewhere other than this repo.
set -uo pipefail

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="${AGENT_FEED_REPO:-$(cd "$SELF_DIR/.." && pwd)}"
LOG_DIR="$HOME/Library/Logs/passion-cron"
LOG="$LOG_DIR/jamesdare-agent-feed.log"
PASSION_CRON="$HOME/Projects/passion/utilities/passion-cron"
WORK="/tmp/jd-feed/work"            # neutral cwd shown on screen; no home path
RUN_ROOT="/tmp/jd-feed"
MODEL="haiku"
TARGET_PLAYBACK=16                  # seconds the clip should read in
MAX_BYTES=1000000
SESSION_CAP=80                      # seconds the tape films after Enter; the tail is trimmed by freezedetect
TASK="Fact-check the three numbers on the jamesdare.com homepage (GitHub stars, forks, PyPI version) against the live GitHub API and PyPI."

mkdir -p "$LOG_DIR" "$RUN_ROOT" "$WORK"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

log() { printf '%s [agent-feed] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >> "$LOG"; }
die() { local rc="$1"; shift; log "FAIL rc=$rc: $*"; echo "record-agent-feed: FAIL rc=$rc: $*" >&2; echo "record-agent-feed: run dir kept: ${RUN:-none}" >&2; exit "$rc"; }

log "start repo=$REPO plant=${AGENT_FEED_PLANT:-0}"

# ---------- 1. dependencies ----------
for c in vhs ffmpeg ffprobe jq gh python3 perl script; do
  command -v "$c" >/dev/null 2>&1 || die 1 "missing dependency: $c"
done
CLAUDE_BIN=""
for c in "$HOME/.local/bin/claude" /opt/homebrew/bin/claude /usr/local/bin/claude; do
  [ -x "$c" ] && { CLAUDE_BIN="$c"; break; }
done
[ -n "$CLAUDE_BIN" ] || die 1 "no claude binary found"
gh auth status >/dev/null 2>&1 || die 1 "gh is not logged in"
[ -d "$REPO/public/assets/system/monitor" ] || die 1 "repo layout wrong: $REPO/public/assets/system/monitor missing"

# ---------- 2. usage reserve + auth (same gate as passion-cron/bin/claude-cron) ----------
# shellcheck disable=SC1091
. "$PASSION_CRON/lib/usage-reserve.sh" 2>/dev/null || die 1 "cannot source usage-reserve.sh"
# shellcheck disable=SC1091
. "$PASSION_CRON/lib/claude-preflight.sh" 2>/dev/null || die 1 "cannot source claude-preflight.sh"
export RESERVE_CALLER="jamesdare-agent-feed"
if ! reserve_ok; then
  log "STOOD DOWN rc=76: usage reserve refused (see $RESERVE_STATE/usage-reserve.log)"
  echo "record-agent-feed: stood down, usage reserve" >&2
  exit "$RESERVE_REFUSAL_EXIT"
fi
claude_auth_preflight "$CLAUDE_BIN"; arc=$?
if [ "$arc" -ne 0 ]; then
  log "STOOD DOWN rc=$arc: claude logged out"
  echo "record-agent-feed: stood down, claude logged out" >&2
  exit "$arc"
fi

# ---------- 3. run dir + launcher ----------
RUN="$(mktemp -d "$RUN_ROOT/run.XXXXXX")" || die 1 "mktemp failed"
RAW_TYPESCRIPT="$RUN/session.typescript"
EXIT_FILE="$RUN/claude.exit"
TAPE="$RUN/feed.tape"
PROMPT="Fact-check three numbers on jamesdare.com against live public sources. Run these as three separate Bash calls: 1) curl -sL https://www.jamesdare.com/data/figures.json | jq -c '.figures | {stars, forks, pypiVersion}'  2) gh api repos/DareDev256/fcp-mcp-server --jq '{stars: .stargazers_count, forks: .forks_count}'  3) curl -s https://pypi.org/pypi/fcp-mcp-server/json | jq -r .info.version  Then finish with one line per figure saying MATCH or DRIFT with both numbers."

# The launcher is hidden on camera so its flags (and any path) never show. env -i keeps every
# CLAUDE_* variable (plugin dirs, mods, hooks) out of the film; --setting-sources project skips the
# user settings and hooks; the only tool is Bash, and only these three read-only command shapes are
# allowed (anything else is denied, never prompted, so a stray ask cannot hang the run).
cat > "$RUN/go.sh" <<EOF
#!/bin/bash
cd "$WORK" || exit 97
env -i HOME="$HOME" USER="$(id -un)" PATH="$PATH" TERM=xterm-256color LANG=en_US.UTF-8 \\
  script -q -e "$RAW_TYPESCRIPT" "$CLAUDE_BIN" --model $MODEL \\
    --tools Bash --permission-mode dontAsk --setting-sources project \\
    --disable-slash-commands --strict-mcp-config \\
    --allowedTools 'Bash(curl:*)' 'Bash(jq:*)' 'Bash(gh api repos/DareDev256/fcp-mcp-server:*)'
echo \$? > "$EXIT_FILE"
EOF
chmod +x "$RUN/go.sh"

# Folder trust: the dialog defaults to "No, exit". Claude records acceptance in ~/.claude.json once
# given; read-only check here, so the tape only presses through the dialog the first time.
WORK_REAL="$(cd "$WORK" && pwd -P)"
TRUSTED="$(jq -r --arg p "$WORK_REAL" '.projects[$p].hasTrustDialogAccepted // false' "$HOME/.claude.json" 2>/dev/null || echo false)"

PLANT_LINES=""
if [ "${AGENT_FEED_PLANT:-0}" = "1" ]; then
  # FAKE token assembled at runtime; exists only to prove the safety gate refuses.
  FAKE="ghp_$(printf 'FAKE%.0s' 1 2 3 4 5 6 7 8 9)"
  PLANT_LINES="Type \"echo $FAKE\" Enter
Sleep 800ms"
  log "PLANT test: fake token will be typed on camera"
fi

{
  cat <<EOF
Output "$RUN/raw.mp4"
Output "$RUN/raw.txt"
Set Shell bash
Set FontSize 16
Set Width 960
Set Height 540
Set Padding 44
Set Theme "Builtin Dark"
Set TypingSpeed 22ms
Hide
Type "export PS1='\$ '; claude() { bash $RUN/go.sh; }; clear" Enter
Show
$PLANT_LINES
Sleep 600ms
Type "claude" Sleep 400ms Enter
EOF
  if [ "$TRUSTED" != "true" ]; then
    cat <<'EOF'
Wait+Screen@30s /trust this folder/
Sleep 800ms
Down
Sleep 400ms
Enter
EOF
  fi
  cat <<EOF
Wait+Screen@40s /for agents|shift\+tab/
Sleep 1500ms
Type "$PROMPT"
Sleep 1s
Enter
Sleep 4s
Sleep ${SESSION_CAP}s
Hide
Ctrl+D
Sleep 700ms
Ctrl+D
Sleep 4s
EOF
} > "$TAPE"

# ---------- 4. record ----------
START=$(date +%s)
perl -e 'alarm shift; exec @ARGV' 420 vhs "$TAPE" >> "$LOG" 2>&1
VRC=$?
WALL=$(( $(date +%s) - START ))
log "vhs rc=$VRC wall=${WALL}s"
[ "$VRC" -eq 0 ] || die 2 "vhs failed or timed out (rc=$VRC)"
[ -s "$RUN/raw.mp4" ] || die 2 "vhs produced no video"
[ -s "$RUN/raw.txt" ] || die 2 "vhs produced no text capture"
[ -s "$RAW_TYPESCRIPT" ] || die 2 "no session typescript (claude never started)"
CLAUDE_RC="$(cat "$EXIT_FILE" 2>/dev/null || true)"
[ -n "$CLAUDE_RC" ] || die 2 "claude did not exit cleanly (no exit code recorded)"

# ---------- 5. PUBLIC-SAFETY GATE (exit 3) ----------
# Scans the vhs text capture AND the full raw typescript (ANSI stripped). Reports only the
# CATEGORY and a count, never the matched text.
perl -pe 's/\e\[[0-9]*C/ /g; s/\e\[[0-9;?]*[ -\/]*[@-~]//g; s/\e\][^\a]*(\a|\e\\)//g; s/\r/\n/g' "$RAW_TYPESCRIPT" > "$RUN/session.clean.txt"
cat > "$RUN/gate.py" <<'PY'
import os, re, sys
files = sys.argv[1:]
home = os.path.expanduser("~")
text = ""
for f in files:
    with open(f, "r", errors="replace") as fh:
        text += fh.read() + "\n"
rules = [
  ("openai/anthropic-style key (sk-)", r"(?<![A-Za-z0-9])sk-[A-Za-z0-9_\-]{6,}"),
  ("github token (ghp_/gho_/ghs_/ghu_/ghr_)", r"gh[pousr]_[A-Za-z0-9]{6,}"),
  ("github fine-grained token", r"github_pat_[A-Za-z0-9_]{6,}"),
  ("aws access key (AKIA)", r"AKIA[0-9A-Z]{6,}"),
  ("Bearer credential", r"Bearer\s+[A-Za-z0-9._\-]{6,}"),
  ("private key block", r"-----BEGIN [A-Z ]*PRIVATE KEY"),
  ("slack/other token", r"xox[abprs]-[A-Za-z0-9\-]{6,}"),
  ("email address", r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}"),
  ("phone number", r"(?<![0-9])(\+?1[\s.\-])?\(?[0-9]{3}\)?[\s.\-][0-9]{3}[\s.\-][0-9]{4}(?![0-9])"),
  ("/Users/ path", r"/Users/"),
  ("home directory path", re.escape(home)),
  (".secrets reference", r"\.secrets"),
]
# Personal words (family names, private projects) live OUTSIDE this public repo,
# one case-insensitive regex per line. Missing or empty file = refuse: a gate that
# silently loses its word list is weaker without anyone noticing.
bl = os.path.join(home, ".local/state/jamesdare-agent-feed/blocklist.txt")
try:
    words = [w.strip() for w in open(bl).read().splitlines() if w.strip() and not w.startswith("#")]
except Exception:
    words = []
if not words:
    print("GATE-HIT private blocklist missing or empty (%s)" % bl)
    sys.exit(3)
for i, w in enumerate(words, 1):
    rules.append(("private blocklist word #%d" % i, "(?i)" + w))
hits = []
for name, pat in rules:
    n = len(re.findall(pat, text))
    if n:
        hits.append((name, n))
# anything from ~/.secrets: exact secret values (>=12 chars) anywhere in the capture
sd = os.path.join(home, ".secrets")
nsec = 0
if os.path.isdir(sd):
    for root, _, names in os.walk(sd):
        for n in names:
            p = os.path.join(root, n)
            try:
                if os.path.getsize(p) > 8192: continue
                body = open(p, "r", errors="strict").read()
            except Exception:
                continue
            cands = {body.strip()} | {l.strip() for l in body.splitlines()}
            for c in cands:
                for v in (c, c.split("=", 1)[-1].strip().strip("'\"")):
                    if len(v) >= 12 and " " not in v and v in text:
                        nsec += 1
if nsec:
    hits.append(("value from ~/.secrets", nsec))
if hits:
    for name, n in hits:
        print("GATE-HIT %s x%d" % (name, n))
    sys.exit(3)
print("GATE-CLEAN")
PY
GATE_OUT="$(python3 -I "$RUN/gate.py" "$RUN/raw.txt" "$RUN/session.clean.txt" 2>&1)"; GRC=$?
log "safety gate rc=$GRC: $(printf '%s' "$GATE_OUT" | tr '\n' ';')"
if [ "$GRC" -ne 0 ]; then
  # never keep a capture that matched a secret pattern around in /tmp
  rm -f "$RUN/raw.mp4" "$RUN/raw.txt" "$RAW_TYPESCRIPT" "$RUN/session.clean.txt"
  die 3 "PUBLIC-SAFETY GATE refused, old clip kept: $(printf '%s' "$GATE_OUT" | tr '\n' ';')"
fi

# ---------- 6. quality gates on the capture ----------
# the TUI redraws every line many times and drops spaces in the typescript, so check each of the three
# expected tool calls by signature (space-stripped) rather than counting lines
NOSP="$RUN/session.nospace.txt"; tr -d ' ' < "$RUN/session.clean.txt" > "$NOSP"
TOOLCALLS=0
for sig in 'Bash\(.*figures\.json' 'Bash\(.*ghapirepos/DareDev256' 'Bash\(.*pypi\.org/pypi/fcp-mcp-server'; do
  grep -qE "$sig" "$NOSP" && TOOLCALLS=$((TOOLCALLS+1))
done
grep -qiE 'API Error|rate limit|credit balance|please run /login|Invalid API key|usage limit' "$RUN/session.clean.txt" \
  && die 4 "session shows an API/auth/limit error"
grep -qE '[^ ]+ for [0-9]+(s|m)' "$RUN/session.clean.txt" || die 4 "session never reached its completion line"
[ "${TOOLCALLS:-0}" -ge 3 ] || die 4 "only $TOOLCALLS distinct tool calls on camera (need 3)"
grep -qE 'MATCH|DRIFT' "$RUN/session.clean.txt" || die 4 "no MATCH/DRIFT verdict in the session"
MODEL_NAME="$(grep -oE '(Haiku|Sonnet|Opus|Fable) ?[0-9][0-9.]*' "$RUN/session.clean.txt" | head -1 | sed -E 's/([A-Za-z]) ?([0-9])/\1 \2/')"
[ -n "$MODEL_NAME" ] || MODEL_NAME="$MODEL"

# ---------- 7. encode (speed up so it reads in ~12-20 s) ----------
RAW_FULL="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RUN/raw.mp4")"
[ -n "$RAW_FULL" ] || die 4 "cannot read raw video duration"
# vhs cannot Wait on late screen content (it only reads the TOP of the scrollback), so the tape films a
# fixed cap after Enter. The real session end is the moment the picture stops changing: trim there + a hold.
FREEZE_START="$(ffmpeg -v info -i "$RUN/raw.mp4" -vf "freezedetect=n=0.003:d=3" -an -f null - 2>&1 \
  | grep -o 'freeze_start: [0-9.]*' | tail -1 | awk '{print $2}')"
[ -n "$FREEZE_START" ] || die 4 "picture never settled (session still changing at the end of the cap)"
RAW_DUR="$(awk -v f="$FREEZE_START" 'BEGIN{printf "%.2f", f+3.0}')"
awk -v d="$RAW_DUR" -v full="$RAW_FULL" 'BEGIN{exit !(d < full-1)}' || die 4 "session ran to the end of the ${SESSION_CAP}s cap (not finished)"
SPEED="$(awk -v d="$RAW_DUR" -v t="$TARGET_PLAYBACK" 'BEGIN{s=d/t; if(s<1)s=1; if(s>10)s=10; printf "%.3f", s}')"
HOLD=3
# The first seconds are an empty prompt while Claude Code starts; a cut must not land on black.
LEAD=2.0
CLIP_DUR="$(awk -v d="$RAW_DUR" -v l="$LEAD" 'BEGIN{printf "%.2f", d-l}')"
encode() {  # $1 = crf
  ffmpeg -v error -y -ss "$LEAD" -t "$CLIP_DUR" -i "$RUN/raw.mp4" -an \
    -vf "setpts=PTS/$SPEED,fps=24,scale=960:540:flags=lanczos,tpad=stop_mode=clone:stop_duration=$HOLD,format=yuv420p" \
    -c:v libx264 -preset slow -crf "$1" -pix_fmt yuv420p -movflags +faststart -r 24 "$RUN/feed-agent.mp4"
}
CRF=26; encode $CRF || die 4 "ffmpeg encode failed"
while [ "$(stat -f%z "$RUN/feed-agent.mp4")" -gt "$MAX_BYTES" ] && [ "$CRF" -lt 36 ]; do
  CRF=$((CRF+3)); log "size over budget, re-encoding crf=$CRF"; encode $CRF || die 4 "ffmpeg re-encode failed"
done
SIZE="$(stat -f%z "$RUN/feed-agent.mp4")"
[ "$SIZE" -le "$MAX_BYTES" ] || die 4 "clip is $SIZE bytes, over the $MAX_BYTES budget"
PROBE="$(ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,pix_fmt -show_entries format=duration -of json "$RUN/feed-agent.mp4")"
[ "$(jq -r '[.streams[]|select(.codec_type=="audio")]|length' <<<"$PROBE")" = "0" ] || die 4 "clip has an audio stream"
[ "$(jq -r '.streams[0]|"\(.codec_name) \(.width)x\(.height) \(.pix_fmt)"' <<<"$PROBE")" = "h264 960x540 yuv420p" ] || die 4 "clip format wrong: $(jq -c '.streams' <<<"$PROBE")"
PLAYBACK="$(jq -r '.format.duration' <<<"$PROBE")"
awk -v p="$PLAYBACK" 'BEGIN{exit !(p>=10 && p<=24)}' || die 4 "playback ${PLAYBACK}s outside 10-24s"
# the poster is the finished state (answer on screen)
ffmpeg -v error -y -sseof -2 -i "$RUN/feed-agent.mp4" -frames:v 1 -vf scale=960:540 -q:v 4 "$RUN/feed-agent.jpg" || die 4 "poster extract failed"
[ -s "$RUN/feed-agent.jpg" ] || die 4 "poster empty"

# ---------- 8. metadata ----------
DUR_REAL="$(awk -v d="$RAW_DUR" 'BEGIN{printf "%.1f", d}')"
PLAY_R="$(awk -v p="$PLAYBACK" 'BEGIN{printf "%.1f", p}')"
jq -n --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg task "$TASK" --arg model "$MODEL_NAME" \
      --argjson dur "$DUR_REAL" --argjson play "$PLAY_R" --argjson rc "${CLAUDE_RC:-0}" \
  '{recordedAt:$at, task:$task, model:$model, durationSec:$dur, playbackSec:$play, exitCode:$rc}' > "$RUN/agent-feed.json" \
  || die 4 "metadata write failed"

# ---------- 9. publish (all gates passed): temp-then-rename in the destination dirs ----------
DEST_V="$REPO/public/assets/system/monitor"
DEST_D="$REPO/public/data"
mkdir -p "$DEST_V" "$DEST_D"
cp "$RUN/feed-agent.mp4" "$DEST_V/.feed-agent.mp4.tmp" && cp "$RUN/feed-agent.jpg" "$DEST_V/.feed-agent.jpg.tmp" \
  && cp "$RUN/agent-feed.json" "$DEST_D/.agent-feed.json.tmp" || die 1 "could not stage files in the repo"
mv -f "$DEST_V/.feed-agent.mp4.tmp" "$DEST_V/feed-agent.mp4" \
  && mv -f "$DEST_V/.feed-agent.jpg.tmp" "$DEST_V/feed-agent.jpg" \
  && mv -f "$DEST_D/.agent-feed.json.tmp" "$DEST_D/agent-feed.json" || die 1 "rename into place failed"

log "OK published feed-agent.mp4 ${SIZE}B real=${DUR_REAL}s playback=${PLAY_R}s toolcalls=$TOOLCALLS claudeRc=$CLAUDE_RC model=$MODEL_NAME"
echo "record-agent-feed: OK ${SIZE}B real=${DUR_REAL}s playback=${PLAY_R}s"
rm -rf "$RUN"
exit 0
