#!/usr/bin/env bash
# Decrypt all .env.enc files to .env. Run from repo root.
# Requires your age private key at ~/.config/sops/age/keys.txt
# (restore from 1Password if on a new machine).
set -euo pipefail

for enc_file in .env.enc apps/api/.env.enc; do
  if [[ -f "$enc_file" ]]; then
    out="${enc_file%.enc}"
    sops --decrypt "$enc_file" > "$out"
    echo "Decrypted: $enc_file -> $out"
  else
    echo "Skipping $enc_file (not found)"
  fi
done
