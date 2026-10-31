#!/bin/bash
# publish-live-data.sh — regenerate the homepage's generated data and PUBLISH it.
#
# Run daily by com.daredev.jamesdare-data-publish (09:40 local).
#
# WHY: on 2026-10-31 the live site showed 127 stars, PyPI v0.26.0 and Bodies In
# Boxes counts "12 DAYS OLD". Two separate faults:
#   1. Nothing committed the generated files. tools/build-figures.mjs ran (from
#      system-snapshot.sh) and wrote public/data/figures.json into the working
#      tree, where it sat for a week while Vercel kept serving the committed copy.
#      A fresh file on disk is not a deploy.
#   2. The generator had refused every run since 2026-10-23, because the BIB
#      launch-week uptime probe kept logging "past" and bib-panel.py read that as
#      a fault. (Probe unloaded 2026-10-31; see the 4.62.1 changelog.)
# Fault 1 is this script's job. Fault 2 is why it fails LOUD: a refusing
# generator now pages #alerts the same day instead of freezing the page quietly.
#
# Gates:
#   - refuses off main (a commit on another branch deploys nothing);
#   - refuses when either generator refuses (they never write a partial file);
#   - refuses when the page reads a figure the new file does not carry
#     (tests/monitor.test.js + tests/bib-gate.test.js);
#   - publishes only when a VALUE changed, or the published activity feed is
#     older than 30h (the page labels it stale at 36h). generatedAt alone moves
#     on every run and must not cost a Vercel deploy (Hobby: 100/day, account-wide);
#   - commits ONLY the generated paths: this working tree routinely holds other
#     sessions' uncommitted work.
# DRY_RUN=1 does everything except commit and push.
set -uo pipefail

REPO="/Users/t./Projects/products/jamesdare.com"
LOG="/Users/t./Library/Logs/passion-cron/jamesdare-data.log"
PATHS=(public/data/figures.json public/data/passion-state.json public/data/client-sites.json public/data/activity.json)
# The filmed agent run (tools/record-agent-feed.sh). Published alongside, never required.
FEED=(public/assets/system/monitor/feed-agent.mp4 public/assets/system/monitor/feed-agent.jpg public/data/agent-feed.json)
mkdir -p "$(dirname "$LOG")"
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG"; }
. "$HOME/Projects/passion/utilities/passion-cron/lib/notify.sh" 2>/dev/null
fail() {
    log "FAIL: $*"
    command -v notify_discord >/dev/null && notify_discord "🔴" "jamesdare.com numbers did not publish" \
        "$*"$'\n\n'"The live page keeps its last published figures, each with its own age stamp. Log: $LOG" \
        15158332 "jamesdare-data-publish · daily 09:40" >/dev/null 2>&1
    exit 2
}

cd "$REPO" || fail "repo missing at $REPO"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ "$BRANCH" = "main" ] || fail "checkout is on '$BRANCH', not main: a push from here deploys nothing"

# 1. Film this morning's agent run. A failed or stood-down recording keeps
#    yesterday's clip (the recorder only moves files into place when every gate
#    passes) and must not hold back the figures, so it warns instead of failing.
FILMED=0
bash tools/record-agent-feed.sh >>"$LOG" 2>&1; rrc=$?
case $rrc in
    0) FILMED=1; log "agent feed filmed" ;;
    76) log "agent feed stood down (usage reserve); keeping the last clip" ;;
    *) log "WARN: agent feed recorder exited $rrc; keeping the last clip"
       command -v notify_discord >/dev/null && notify_discord "🟠" "jamesdare.com agent footage not refreshed" \
           "tools/record-agent-feed.sh exited $rrc (3 = the public-safety gate refused the capture). The page keeps the last clip and labels its age. Log: ~/Library/Logs/passion-cron/jamesdare-agent-feed.log" \
           16763904 "jamesdare-data-publish · daily 09:40" >/dev/null 2>&1 ;;
esac

out=$(node tools/build-figures.mjs 2>&1) || fail "build-figures refused: $(tail -3 <<< "$out")"
out=$(node tools/build-activity.mjs 2>&1) || fail "build-activity refused: $(tail -3 <<< "$out")"
out=$(npx vitest run tests/monitor.test.js tests/bib-gate.test.js 2>&1) || fail "the page reads a figure the new data does not carry: $(grep -E '✗|×|AssertionError' <<< "$out" | head -5)"

# What counts as a change, per file. Everything but the clock.
sig() {
    case "$1" in
        public/data/figures.json) jq -Sc '{figures, manual, services: (.services // {} | del(.checkedAt))}' ;;
        public/data/passion-state.json) jq -Sc 'del(.generatedAt)' ;;
        public/data/client-sites.json) jq -Sc '.sites' ;;
        public/data/activity.json) jq -Sc '{ranInWindow, jobsWatched, events: [.events[] | del(.ageMinutes)]}' ;;
    esac
}
CHANGED=()
for p in "${PATHS[@]}"; do
    now=$(sig "$p" < "$p" 2>/dev/null)
    was=$(git show "HEAD:$p" 2>/dev/null | sig "$p" 2>/dev/null)
    [ -n "$now" ] || fail "$p did not parse after regeneration"
    [ "$now" != "$was" ] && CHANGED+=("$p")
done

PUB_AT=$(git show HEAD:public/data/activity.json 2>/dev/null | jq -r '.generatedAt // empty')
PUB_EPOCH=$(date -j -u -f '%Y-%m-%dT%H:%M:%S' "${PUB_AT%.*}" '+%s' 2>/dev/null || echo 0)
AGE_H=$(( PUB_EPOCH > 0 ? ( $(date '+%s') - PUB_EPOCH ) / 3600 : 99 ))
[ "$AGE_H" -lt 0 ] && AGE_H=99

COMMIT_PATHS=("${PATHS[@]}")
if [ "$FILMED" = "1" ]; then COMMIT_PATHS+=("${FEED[@]}"); CHANGED+=(agent-feed); fi

if [ ${#CHANGED[@]} -eq 0 ] && [ "$AGE_H" -lt 30 ]; then
    log "OK no value changed (activity published ${AGE_H}h ago) — not deploying a timestamp"
    command -v job_ran >/dev/null && job_ran
    exit 0
fi

STARS=$(jq -r '.figures.stars' public/data/figures.json)
RAN=$(jq -r '"\(.ranInWindow)/\(.jobsWatched)"' public/data/activity.json)
MSG="chore(data): publish live figures ($(date -u '+%Y-%m-%d %H:%M UTC'))"
if [ "${DRY_RUN:-}" = "1" ]; then
    log "DRY RUN would publish: changed=[${CHANGED[*]:-none}] activityAge=${AGE_H}h stars=$STARS jobs=$RAN"
    exit 0
fi

git commit -q -m "$MSG" -m "Changed: ${CHANGED[*]:-activity age ${AGE_H}h}. Written by tools/publish-live-data.sh." -- "${COMMIT_PATHS[@]}" >>"$LOG" 2>&1 \
    || fail "commit failed"
git push -q origin main >>"$LOG" 2>&1 \
    || fail "PUSH REJECTED: the commit is local only and the live page stays stale. Never force it; pull and re-run."
log "OK published: changed=[${CHANGED[*]:-none}] activityAge=${AGE_H}h stars=$STARS jobs=$RAN"
command -v job_ran >/dev/null && job_ran
exit 0
