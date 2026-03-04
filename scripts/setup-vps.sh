#!/usr/bin/env bash
# Setup script for a fresh Hetzner VPS (Ubuntu 24.04).
# Run remotely: ssh root@<IP> 'bash -s' < scripts/setup-vps.sh
#
# What it does:
#   1. System update
#   2. Firewall (ufw) — allow SSH, HTTP, HTTPS only
#   3. fail2ban — ban IPs that brute-force SSH
#   4. SSH hardening — disable password auth, key-only
#   5. Install Docker CE (official)

set -euo pipefail

echo "==> Updating system packages"
apt-get update -y && apt-get upgrade -y

echo "==> Configuring firewall (ufw)"
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "==> Installing fail2ban"
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "==> Hardening SSH"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

echo "==> Installing Docker CE"
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

echo ""
echo "==> Setup complete!"
echo ""
echo "Docker is installed. Kamal will handle the rest (kamal setup installs kamal-proxy)."
