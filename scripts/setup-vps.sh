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
#   6. Create 'deploy' user with Docker access and limited sudo

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

echo "==> Creating deploy user"
if id "deploy" &>/dev/null; then
  echo "    User 'deploy' already exists, skipping creation"
else
  useradd --create-home --shell /bin/bash deploy
fi
usermod -aG docker deploy

# Allow deploy user to restart services (needed for kamal-proxy)
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl" > /etc/sudoers.d/deploy
chmod 0440 /etc/sudoers.d/deploy

# Copy root's authorized SSH keys to deploy user
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

echo ""
echo "==> Setup complete!"
echo ""
echo "Docker is installed and 'deploy' user is ready."
echo "Kamal will handle the rest (kamal setup installs kamal-proxy)."
