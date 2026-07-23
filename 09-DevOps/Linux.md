# Linux Engineering Standards

## Overview

本文档定义了项目中 Linux 服务器运维的工程规范，涵盖服务器加固、用户权限管理、进程管理、日志管理等核心实践。

---

## Rules

### R01 — 服务器加固

Linux 服务器上线前必须完成安全加固配置。

- **MUST** SSH 禁用密码登录和 root 远程登录：`PermitRootLogin no`、`PasswordAuthentication no`
- **MUST** 配置防火墙（iptables / firewalld），仅开放必要端口
- **SHOULD** 安装 fail2ban 防止暴力破解
- **MAY** 使用 SELinux / AppArmor 实施强制访问控制

✅ 示例：
```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300

# firewalld 规则
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

❌ 反例：允许 root 直接 SSH 登录且未配置防火墙。

---

### R02 — 用户与权限管理

系统用户和文件权限必须遵循最小权限原则。

- **MUST** 服务运行使用专用系统用户，禁止使用 root 启动服务
- **MUST** 敏感文件权限设置为 600（所有者读写），目录权限设置为 700
- **SHOULD** 使用 usermod / groupadd 管理用户组，通过 ACL 实现细粒度权限
- **MAY** 实施 Sudoers 规则限制管理员命令范围

✅ 示例：
```bash
# 创建专用服务用户
useradd -r -s /bin/false appuser
chown -R appuser:appgroup /opt/myapp
chmod 750 /opt/myapp
chmod 640 /opt/myapp/config/*

# Sudoers 规则
appuser ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
```

❌ 反例：所有服务以 root 身份运行，配置文件权限为 777。

---

### R03 — 进程管理（systemd）

所有长期运行的服务必须使用 systemd 管理。

- **MUST** 服务单元文件包含：Description、User、Group、ExecStart、RestartPolicy
- **SHOULD** 配置 Restart=on-failure 和 StartLimitIntervalSec 防止无限重启
- **MAY** 使用 systemd timer 替代 cron 执行定时任务

✅ 示例：
```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
After=network.target postgresql.service

[Service]
Type=notify
User=appuser
Group=appgroup
ExecStart=/opt/myapp/bin/server --config /opt/myapp/config.yaml
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=300
StartLimitBurst=5

[Install]
WantedBy=multi-user.target
```

❌ 反例：使用 `&` 后台启动进程或编写自定义 init 脚本。

---

### R04 — 日志管理

系统日志必须统一收集、保留足够时长并设置轮转。

- **MUST** 使用 journalctl 查看 systemd 日志，配置 logrotate 管理应用日志
- **SHOULD** 应用日志输出至标准输出（stdout/stderr），由 systemd 自动收集
- **MAY** 集成远程日志聚合（如 Filebeat → Logstash → Elasticsearch）

✅ 示例：
```bash
# journalctl 查询
journalctl -u myapp -f          # 实时跟踪
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp -p err      # 仅显示错误级别

# logrotate 配置 /etc/logrotate.conf
/var/log/myapp/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    copytruncate
}
```

❌ 反例：应用自行写入文件日志且不配置轮转，导致磁盘耗尽。

---

### R05 — 磁盘管理

磁盘空间必须定期监控，避免因空间不足导致服务中断。

- **MUST** 生产服务器配置 LVM 或 RAID，避免单盘故障数据丢失
- **SHOULD** 使用 df -h 定期检查磁盘使用率，阈值 > 80% 时告警
- **MAY** 使用 du -sh 分析大目录，清理过期备份和临时文件

✅ 示例：
```bash
# 磁盘监控脚本
#!/bin/bash
USAGE=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
if [ "$USAGE" -gt 80 ]; then
    echo "CRITICAL: Disk usage at ${USAGE}%" | mail -s "Disk Alert" admin@company.com
fi

# LVM 扩容
pvcreate /dev/sdb
vgextend vg_app /dev/sdb
lvextend -l +100%FREE /dev/vg_app/lv_app
xfs_growfs /dev/vg_app/lv_app
```

❌ 反例：不监控磁盘使用率，直到服务报错才发现磁盘已满。

---

### R06 — 网络配置

网络配置必须确保服务可达且安全。

- **MUST** 生产环境服务器配置静态 IP 或 DHCP 预留地址
- **SHOULD** 绑定关键服务至内网接口，避免暴露至公网
- **MAY** 使用 iptables nat 表配置端口转发或透明代理

✅ 示例：
```bash
# /etc/sysconfig/network-scripts/ifcfg-eth0
BOOTPROTO=none
ONBOOT=yes
IPADDR=10.0.1.100
NETMASK=255.255.255.0
GATEWAY=10.0.1.1
DNS1=10.0.1.1

# iptables 端口转发
iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-port 80
```

❌ 反例：数据库服务监听 0.0.0.0 且未配置防火墙规则。

---

### R07 — 安全更新

操作系统和软件包必须保持最新安全补丁。

- **MUST** 生产服务器启用自动安全更新（unattended-upgrades）
- **SHOULD** 更新前在测试环境验证兼容性，避免业务中断
- **MAY** 使用 Security Tracker（如 Debian Security Tracker）监控漏洞公告

✅ 示例：
```bash
# Ubuntu 自动安全更新
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
```

❌ 反例：服务器长时间未更新，存在已知高危漏洞。

---

### R08 — Shell 脚本最佳实践

编写 Shell 脚本时必须遵循规范，确保可维护性和安全性。

- **MUST** 脚本开头指定 shebang（`#!/usr/bin/env bash`）和 set -euo pipefail
- **SHOULD** 使用函数封装逻辑，变量加引号，避免硬编码路径
- **MAY** 使用 getopts 处理命令行参数，添加 usage() 帮助函数

✅ 示例：
```bash
#!/usr/bin/env bash
set -euo pipefail

APP_HOME="/opt/myapp"
LOG_FILE="${APP_HOME}/logs/deploy.log"

usage() {
    echo "Usage: $0 [--version VERSION]"
    exit 1
}

deploy() {
    local version="$1"
    echo "Deploying version ${version}..." >> "${LOG_FILE}"
    # ... deployment logic
}

main() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --version) DEPLOY_VERSION="$2"; shift 2 ;;
            *) usage ;;
        esac
    done
    deploy "${DEPLOY_VERSION}"
}

main "$@"
```

❌ 反例：脚本无错误处理，使用裸变量和硬编码路径。

---

## Checklist

- [ ] SSH 已禁用 root 登录和密码认证
- [ ] 防火墙仅开放必要端口，fail2ban 已安装
- [ ] 服务以专用用户运行，文件权限符合最小权限原则
- [ ] 所有服务使用 systemd 管理，配置自动重启
- [ ] 日志通过 journalctl 收集，logrotate 已配置
- [ ] 磁盘使用率监控已配置，LVM/RAID 已部署
- [ ] 安全自动更新已启用
- [ ] Shell 脚本包含 shebang 和 set -euo pipefail