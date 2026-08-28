---
title: "Codex 桌面应用隔夜打不开：一次 Windows AppX 挂载点故障排查"
date: "2026-08-28 18:00:00"
description: "ChatGPT/Codex 桌面应用重装后当天正常、自动更新后再次打不开。本文记录如何从 AppServerConnection 卡死追到 AppX 默认安装卷与不受信任挂载点，并给出可复用的修复和验证方法。"
tags: ["Codex", "ChatGPT", "Windows", "故障排查", "AppX"]
---

# Codex 桌面应用隔夜打不开：一次 Windows AppX 挂载点故障排查

最近遇到一个很有迷惑性的故障：Windows 上的 ChatGPT/Codex 桌面应用双击后没有窗口，但后台能看到部分 `ChatGPT.exe` 进程。卸载重装后当天恢复正常，第二天却再次打不开。

真正的问题不在账号、网络或 GPU，而在 **Windows AppX 的默认安装卷和包目录挂载方式**。自动更新把应用包重新部署到了 D 盘，C 盘的包目录变成了指向 D 盘的 junction。Windows 将这条启动路径判定为“不受信任的挂载点”，于是应用无法正常派生 Codex CLI 后端。

> 本文记录的是一次特定环境下的排障经验。涉及卸载、移动目录和修改 AppX 安装卷的命令都有数据风险，请先备份自己的配置，并根据实际路径调整命令。

## 故障现象

最初看到的现象有这些：

- 双击 ChatGPT 图标后没有窗口；
- 后台存在多个 `ChatGPT.exe` 子进程，但 `MainWindowHandle` 一直为 `0`；
- 日志停在 `Starting app-server connection hostId=local transport=stdio`；
- 主进程下没有正常出现 `codex.exe` CLI 子进程；
- 重装后立即可用，但经过一次自动更新又会复发。

其中最关键的线索是“**重装当天正常，第二天复发**”。这说明安装包本身大概率没有损坏，真正的触发器更像是夜间自动更新。

## 根本原因

这台电脑曾把 Windows 设置中的“新的应用将保存到”改成 D 盘，因此 AppX 默认安装卷是 `D:\WindowsApps`。

Codex 桌面应用自动更新后，包的真实内容被部署到 D 盘；而 `C:\Program Files\WindowsApps` 下对应的包目录成为指向 D 盘的 junction（reparse point）。完整因果链如下：

```text
新的应用默认保存到 D 盘
        ↓
AppX 默认安装卷变成 D:\WindowsApps
        ↓
自动更新把新版应用部署到 D 盘
        ↓
C:\Program Files\WindowsApps 下的包目录成为 junction
        ↓
Windows 拒绝穿过“不受信任的挂载点”启动或派生进程
        ↓
Codex CLI 后端没有启动，AppServerConnection 一直等待
        ↓
应用不创建窗口，看起来像“点了没反应”
```

直接运行包内程序时，可以看到很有辨识度的错误：

```text
The path cannot be traversed because it contains an untrusted mount point.
```

对应错误码为 `0xc00701c0`。

## 如何确认是不是同一个问题

先检查 AppX 默认安装卷：

```powershell
Get-AppxDefaultVolume
```

再检查 Codex 包目录是否是 reparse point：

```powershell
$pkg = Get-AppxPackage -Name "OpenAI.Codex"
$item = Get-Item $pkg.InstallLocation -Force

$item | Select-Object FullName, Attributes, Target
($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
```

最后一条命令如果返回 `True`，说明包目录经过了挂载点。结合 `0xc00701c0`、无窗口和 `codex.exe` 未启动等现象，就很接近本文的问题。

还可以检查进程状态：

```powershell
Get-Process -Name ChatGPT -ErrorAction SilentlyContinue |
    Select-Object Id, MainWindowHandle, MainWindowTitle

Get-Process -Name codex -ErrorAction SilentlyContinue |
    Select-Object Id, Path
```

## 修复思路

核心原则只有一句：

> 应用本体安装在 C 盘真实目录中；会持续增长的用户数据可以通过 junction 放到其他磁盘。

包根目录必须避免使用会触发信任检查的 AppX 跨卷挂载点。与此同时，Codex 的配置、会话和运行时数据通常更占空间，可以在做好备份后单独重定向。

### 1. 先备份配置

至少备份自己的 `.codex` 目录，尤其不要丢失仍需使用的配置。`auth.json` 含登录令牌，备份文件必须放在安全位置，绝不能上传到 Git 仓库或网盘公开链接。

```powershell
$codexHome = Join-Path $env:USERPROFILE ".codex"
$backupDir = Join-Path $env:USERPROFILE "codex-backup"

New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item $codexHome -Destination $backupDir -Recurse -Force
```

### 2. 卸载当前 AppX 包

先退出应用，再卸载当前包：

```powershell
Get-Process -Name ChatGPT, codex -ErrorAction SilentlyContinue |
    Stop-Process -Force

$pkg = Get-AppxPackage -Name "OpenAI.Codex"
Remove-AppxPackage -Package $pkg.PackageFullName
```

### 3. 显式安装到 C 盘

准备好官方 MSIX 安装包后，不要直接双击安装，而是显式指定 C 盘卷：

```powershell
Add-AppxPackage -Path "D:\CodexData\ChatGPT-x64.msix" -Volume "C:\"
```

安装包存在哪个盘并不决定最终部署到哪个卷；真正关键的是 `-Volume "C:\"`。

安装完成后立即验证：

```powershell
$pkg = Get-AppxPackage -Name "OpenAI.Codex"
$item = Get-Item $pkg.InstallLocation -Force

($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
Test-Path "$($pkg.InstallLocation)\app\ChatGPT.exe"
```

正确结果应分别为：

```text
False
True
```

也就是包目录不是 reparse point，并且主程序真实存在。

### 4. 启动并验证后端

可以通过 AppsFolder 激活应用：

```powershell
& "C:\Windows\explorer.exe" `
    "shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App"
```

等待应用启动后，再检查：

```powershell
Get-Process -Name ChatGPT -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 }

Get-Process -Name codex -ErrorAction SilentlyContinue
```

如果窗口句柄非零，且 `codex.exe` 子进程存在，说明原来卡死的 `AppServerConnection` 链路已经打通。

## 可选：把增长型数据放到 D 盘

如果 C 盘空间紧张，可以保留应用本体在 C 盘，只把用户数据放到 D 盘。下面是一个示意布局：

| 用户目录入口 | D 盘真实目录 | 用途 |
|---|---|---|
| `%USERPROFILE%\.codex` | `D:\CodexData\dot-codex` | 配置、会话和状态 |
| `%LOCALAPPDATA%\OpenAI` | `D:\CodexData\OpenAI` | CLI 后端和运行时 |
| `%USERPROFILE%\.cache\codex-runtimes` | `D:\CodexData\codex-runtimes` | 运行时缓存 |

在确认源目录已经备份、目标目录已创建，并且原入口目录不存在后，可以用 PowerShell 创建 junction：

```powershell
New-Item -ItemType Junction `
    -Path (Join-Path $env:USERPROFILE ".codex") `
    -Target "D:\CodexData\dot-codex"

New-Item -ItemType Junction `
    -Path (Join-Path $env:LOCALAPPDATA "OpenAI") `
    -Target "D:\CodexData\OpenAI"

New-Item -ItemType Junction `
    -Path (Join-Path $env:USERPROFILE ".cache\codex-runtimes") `
    -Target "D:\CodexData\codex-runtimes"
```

这里的区别很重要：故障来自 AppX 包根目录的跨卷挂载布局；本次实测中，用户目录内自建的 junction 不影响 `codex.exe` 正常运行。但不同系统策略可能不同，操作后仍应完整验证。

## 防止自动更新再次破坏布局

如果系统的 AppX 默认卷暂时仍在 D 盘，自动更新可能再次把包部署回 D 盘。可以在 Codex 桌面应用设置中关闭自动更新，或者在 `config.toml` 中确认存在：

```toml
[desktop]
disableAutomaticUpdates = true
```

修改 TOML 时要确保文件是 UTF-8 且不带 BOM。Windows PowerShell 5.1 的部分写入方式会产生 BOM，可以用下面的方法写入：

```powershell
$cfg = Join-Path $env:USERPROFILE ".codex\config.toml"
$content = Get-Content $cfg -Raw
$block = "[desktop]`ndisableAutomaticUpdates = true`n`n"

[System.IO.File]::WriteAllText(
    $cfg,
    $block + $content,
    [System.Text.UTF8Encoding]::new($false)
)
```

更彻底的处理方式，是在 Windows 设置中把“新的应用将保存到”改回 C 盘。也可以在管理员 PowerShell 中设置默认 AppX 卷，并用查询命令复验：

```powershell
Set-AppxDefaultVolume -Volume "C:\Program Files\WindowsApps"
Get-AppxDefaultVolume
```

不要只看设置命令有没有报错；非管理员环境下它可能没有真正生效，一定要用 `Get-AppxDefaultVolume` 再查一次。

## 以后如何安全升级

在默认安装卷还没有改回 C 盘时，建议手动升级：

1. 从官方来源下载新版 MSIX；
2. 备份 `.codex` 配置；
3. 卸载旧的 AppX 包；
4. 使用 `Add-AppxPackage -Volume "C:\"` 显式安装；
5. 确认包目录的 `ReparsePoint` 为 `False`；
6. 启动后确认窗口和 `codex.exe` 子进程正常；
7. 再检查自动更新设置是否仍然生效。

## 这次排障最有价值的经验

第一，不要忽略故障的时间规律。“当天正常、隔夜复发”比大量零散日志更早指出了自动更新这个触发器。

第二，`Status=Ok` 只说明 AppX 注册状态正常，不代表它的物理安装布局适合启动。检查 `InstallLocation` 是否为 reparse point，才真正命中了问题。

第三，源文件位于 C 盘还是 D 盘并不决定 AppX 部署卷。显式的 `-Volume` 参数以及系统默认 AppX 卷才是关键。

最后，修复不能只看窗口是否出现，还要验证完整链路：包目录是真实目录、窗口句柄非零、Codex CLI 子进程正常运行，并在重启或更新周期后确认没有复发。

## 参考资料

- [OpenAI Codex Windows 文档](https://developers.openai.com/codex/app/windows)
- [Microsoft Learn：Add-AppxPackage](https://learn.microsoft.com/powershell/module/appx/add-appxpackage)
- [Microsoft Learn：Get-AppxDefaultVolume](https://learn.microsoft.com/powershell/module/appx/get-appxdefaultvolume)
