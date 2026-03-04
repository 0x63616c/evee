#!/usr/bin/env bash
# One-time setup: installs age + sops, generates an age key, and encrypts all .env files.
# Run from repo root.
set -euo pipefail

KEY_FILE="$HOME/.config/sops/age/keys.txt"

# Install dependencies
if ! command -v age &>/dev/null || ! command -v sops &>/dev/null; then
  echo "Installing age and sops..."
  brew install age sops
fi

# Generate key (skip if already exists)
if [[ -f "$KEY_FILE" ]]; then
  echo "Key already exists at $KEY_FILE — skipping generation."
else
  mkdir -p "$(dirname "$KEY_FILE")"
  age-keygen -o "$KEY_FILE"
  echo "Key generated at $KEY_FILE"
fi

# Extract public key
PUBLIC_KEY=$(grep "^# public key:" "$KEY_FILE" | awk '{print $NF}')
echo "Public key: $PUBLIC_KEY"

# Write .sops.yaml
cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: \.env$
    age: $PUBLIC_KEY
EOF
echo "Created .sops.yaml"

# Encrypt .env files
for env_file in .env; do
  if [[ -f "$env_file" ]]; then
    enc_file="${env_file}.enc"
    sops --encrypt "$env_file" > "$enc_file"
    echo "Encrypted: $env_file -> $enc_file"
  else
    echo "Skipping $env_file (not found)"
  fi
done

echo ""
echo "All done. Copy your private key to 1Password:"
echo ""
echo "  cat $KEY_FILE | pbcopy"
echo ""
echo "Then paste into a new 1Password Secure Note titled 'evee age private key'."
echo "Without this key, encrypted .env files cannot be decrypted."
