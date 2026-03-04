#!/usr/bin/env bash
# Setup script for a fresh Hetzner VPS (Ubuntu 24.04).
# Run remotely: ssh root@<IP> 'bash -s' < scripts/setup-vps.sh
#
# What it does:
#   1. System update
#   2. Firewall (ufw) — allow SSH, HTTP, HTTPS, Coolify (8000)
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
ufw allow 8000/tcp # Coolify UI + GitHub webhooks (TODO: move behind subdomain, see EVE-21)
ufw --force enable

echo "==> Installing fail2ban"
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "==> Hardening SSH"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

echo "==> Installing Coolify"
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ""
echo "==> Setup complete!"
echo ""
echo "Coolify is running at http://<IP>:8000"
echo "Port 8000 is open for GitHub webhooks."
echo "See EVE-21 to move Coolify behind a subdomain and close 8000."
