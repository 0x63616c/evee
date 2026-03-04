#!/usr/bin/env bash
# Opens an SSH tunnel to the Coolify UI on the VPS.
# Coolify listens on port 8000 but it's firewalled — this is the only way in.
#
# Usage: bash scripts/coolify-tunnel.sh [IP]

set -euo pipefail

VPS_IP="${1:-46.225.220.11}"

echo "Opening tunnel to Coolify UI at http://localhost:8000"
echo "Press Ctrl+C to close."
echo ""
ssh -N -L 8000:localhost:8000 "root@${VPS_IP}"
