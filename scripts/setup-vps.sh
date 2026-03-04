#!/usr/bin/env bash
# Setup script for a fresh Hetzner VPS (Ubuntu 24.04).
# Run remotely: ssh root@<IP> 'bash -s' < scripts/setup-vps.sh
#
# What it does:
#   1. System update
#   2. Firewall (ufw) — allow SSH, HTTP, HTTPS only
#   3. fail2ban — ban IPs that brute-force SSH
#   4. SSH hardening — disable password auth, key-only
#   5. Install Coolify

set -euo pipefail

echo "==> Updating system packages"
apt-get update -y && apt-get upgrade -y

echo "==> Configuring firewall (ufw)"
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (Traefik)
ufw allow 443/tcp  # HTTPS (Traefik)
# Port 8000 (Coolify UI) is intentionally NOT opened.
# Access it via SSH tunnel: ssh -L 8000:localhost:8000 root@<IP>
ufw --force enable

echo "==> Installing fail2ban"
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "==> Hardening SSH"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

echo "==> Installing Coolify"
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ""
echo "==> Setup complete!"
echo ""
echo "Coolify is running but port 8000 is firewalled."
echo "To access the UI, run this on your local machine:"
echo ""
echo "  bash scripts/coolify-tunnel.sh"
echo ""
echo "Then open http://localhost:8000 in your browser."
