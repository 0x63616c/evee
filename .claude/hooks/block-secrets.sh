#!/bin/bash
# PreToolUse hook: block access to secret files
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Patterns that indicate secret files
SECRET_PATTERNS='\.env($|\.)|\.kamal/secrets|\.pem$|\.key$|credentials\.json|service-account.*\.json|\.ssh/(id_|known_hosts|config)|\.aws/(credentials|config)'

case "$TOOL" in
  Read)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    if echo "$FILE_PATH" | grep -qE "$SECRET_PATTERNS"; then
      echo '{"decision":"block","reason":"BLOCKED: This file contains secrets. Use .env.example or src/env.ts to check env var names."}' >&2
      exit 2
    fi
    ;;
  Bash)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    # Check if the bash command references secret files
    if echo "$COMMAND" | grep -qE "$SECRET_PATTERNS"; then
      echo '{"decision":"block","reason":"BLOCKED: Command references a secrets file. Use .env.example or src/env.ts to check env var names."}' >&2
      exit 2
    fi
    ;;
  Grep)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // empty')
    if echo "$FILE_PATH" | grep -qE "$SECRET_PATTERNS"; then
      echo '{"decision":"block","reason":"BLOCKED: Cannot search secret files."}' >&2
      exit 2
    fi
    ;;
  Edit|Write)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    if echo "$FILE_PATH" | grep -qE "$SECRET_PATTERNS"; then
      echo '{"decision":"block","reason":"BLOCKED: Cannot modify secret files."}' >&2
      exit 2
    fi
    ;;
esac

exit 0
