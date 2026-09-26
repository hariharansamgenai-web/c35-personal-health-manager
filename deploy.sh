#!/usr/bin/env bash
# One-command deploy: push to team repo (source of truth) + Lovaber mirror (triggers Netlify)
# Usage: ./deploy.sh "commit message"
set -e
git add -A
[ -n "$1" ] && git commit -m "$1" || true
git push origin BranchBabu
git push https://github.com/Lovaber/Personal-Health-Manager.git HEAD:main
echo "✓ Pushed. Netlify: https://app.netlify.com/projects/pulsepath-aiap/deploys"
echo "✓ Live:   https://pulsepath-aiap.netlify.app"
