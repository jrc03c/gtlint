#!/usr/bin/env bash
# PreToolUse hook: reminds Claude to run the post-change checklist before committing.
# Receives tool input JSON on stdin. Checks if the Bash command is a git commit.

input=$(cat)
command=$(echo "$input" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/^"command"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

if echo "$command" | grep -qE '\bgit\b.*\bcommit\b'; then
  cat <<'MSG'
STOP — Have you completed the post-change checklist?

1. CLI / VS Code Extension Parity — Did you check whether the other side needs a matching update?
2. Documentation — CLAUDE.md, ARCHITECTURE.md, LANGUAGE_SPEC.md, README.md updated if relevant?
3. Version bump — package.json and vscode-extension/package.json updated? Extension rebuilt?
4. GitHub Release — Will be needed after push.

If you haven't done these, do them before committing.
MSG
fi
