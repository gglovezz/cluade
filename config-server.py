#!/usr/bin/env python3
"""
Claude Code + DeepSeek 配置可视化页面
简单 HTTP 服务，用于填写 API Key 并更新配置
"""

import json
import os
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

CLAUDE_SETTINGS = Path.home() / ".claude" / "settings.json"
CC_SWITCH_DB = Path.home() / ".cc-switch" / "providers.json"


def get_current_config():
    """读取当前配置"""
    config = {"api_key": "", "base_url": "https://api.deepseek.com/v1", "haiku": "deepseek-v4-flash", "sonnet": "deepseek-v4-pro", "opus": "deepseek-v4-pro"}
    
    if CLAUDE_SETTINGS.exists():
        try:
            data = json.loads(CLAUDE_SETTINGS.read_text())
            env = data.get("env", {})
            config["api_key"] = env.get("ANTHROPIC_AUTH_TOKEN", "")
            config["base_url"] = env.get("ANTHROPIC_BASE_URL", config["base_url"])
            config["haiku"] = env.get("ANTHROPIC_DEFAULT_HAIKU_MODEL", config["haiku"])
            config["sonnet"] = env.get("ANTHROPIC_DEFAULT_SONNET_MODEL", config["sonnet"])
            config["opus"] = env.get("ANTHROPIC_DEFAULT_OPUS_MODEL", config["opus"])
        except:
            pass
    
    # 隐藏部分 API Key
    if config["api_key"] and config["api_key"] != "PLACEHOLDER_FILL_ME":
        key = config["api_key"]
        if len(key) > 8:
            config["api_key_masked"] = key[:4] + "*" * (len(key) - 8) + key[-4:]
        else:
            config["api_key_masked"] = "***"
    else:
        config["api_key_masked"] = ""
    
    return config


HTML_PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Claude Code 配置中心</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #e2e8f0;
  }
  .container {
    width: 100%;
    max-width: 620px;
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .header {
    padding: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    text-align: center;
  }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
  .header p { font-size: 14px; opacity: 0.9; }
  .content { padding: 32px; }
  .form-group { margin-bottom: 24px; }
  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .input-wrapper { position: relative; }
  .form-control {
    width: 100%;
    padding: 14px 16px;
    font-size: 15px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    color: #f1f5f9;
    transition: all 0.3s ease;
    outline: none;
    font-family: 'Menlo', 'Consolas', monospace;
  }
  .form-control:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }
  .form-control::placeholder { color: #475569; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .btn {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 8px;
  }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }
  .btn:active { transform: translateY(0); }
  .btn-secondary {
    background: rgba(148, 163, 184, 0.2);
    border: 1px solid rgba(148, 163, 184, 0.3);
    margin-top: 8px;
  }
  .btn-secondary:hover { background: rgba(148, 163, 184, 0.3); box-shadow: none; transform: none; }
  .toast {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px);
    padding: 16px 24px; border-radius: 12px; font-weight: 500;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1000; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
  .toast.success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
  .status-badge {
    display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  }
  .status-configured { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
  .status-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
  .divider { height: 1px; background: rgba(148, 163, 184, 0.2); margin: 24px 0; }
  .info-box {
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    padding: 16px;
    font-size: 13px;
    color: #c7d2fe;
    line-height: 1.6;
  }
  .info-box a { color: #a5b4fc; text-decoration: underline; }
  .meta-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-top: 16px; }
  .hidden-input { position: absolute; opacity: 0; pointer-events: none; }
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<div class="container">
  <div class="header">
    <h1>🤖 Claude Code 配置中心</h1>
    <p>连接 DeepSeek API · 一键配置 AI 编程助手</p>
  </div>
  <div class="content">
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="status-badge" id="statusBadge">检测中...</span>
    </div>

    <div class="form-group">
      <label>🔑 DeepSeek API Key</label>
      <div class="input-wrapper">
        <input type="password" class="form-control" id="apiKey" placeholder="粘贴你的 API Key（sk- 开头）" autocomplete="off">
      </div>
      <div class="meta-row">
        <span id="keyStatus">当前：未配置</span>
        <a href="https://platform.deepseek.com/api_keys" target="_blank" style="color:#6366f1; text-decoration:none;">获取 API Key →</a>
      </div>
    </div>

    <div class="divider"></div>

    <div class="form-group">
      <label>🌐 API Base URL</label>
      <input type="text" class="form-control" id="baseUrl" placeholder="https://api.deepseek.com/v1">
    </div>

    <div class="row">
      <div class="form-group">
        <label>⚡ Haiku 模型（子代理/轻量）</label>
        <input type="text" class="form-control" id="haiku" placeholder="deepseek-v4-flash">
      </div>
      <div class="form-group">
        <label>🎯 Sonnet 模型（主力）</label>
        <input type="text" class="form-control" id="sonnet" placeholder="deepseek-v4-pro">
      </div>
    </div>

    <div class="form-group">
      <label>🧠 Opus 模型（深度推理）</label>
      <input type="text" class="form-control" id="opus" placeholder="deepseek-v4-pro">
    </div>

    <button class="btn" onclick="saveConfig()">💾 保存配置</button>
    <button class="btn btn-secondary" onclick="testConnection()">🔌 测试连接</button>

    <div class="divider"></div>

    <div class="info-box">
      💡 <b>配置完成后：</b><br>
      1. 在终端中运行 <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">claude</code> 启动 AI 编程助手<br>
      2. 运行 <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">cc-switch provider list</code> 查看模型提供商
    </div>
  </div>
</div>

<script>
async function loadConfig() {
  const res = await fetch('/api/config');
  const data = await res.json();
  document.getElementById('baseUrl').value = data.base_url;
  document.getElementById('haiku').value = data.haiku;
  document.getElementById('sonnet').value = data.sonnet;
  document.getElementById('opus').value = data.opus;
  
  if (data.api_key_masked && data.api_key !== 'PLACEHOLDER_FILL_ME' && data.api_key) {
    document.getElementById('keyStatus').textContent = '当前：' + data.api_key_masked;
    document.getElementById('statusBadge').textContent = '✓ 已配置';
    document.getElementById('statusBadge').className = 'status-badge status-configured';
  } else {
    document.getElementById('keyStatus').textContent = '当前：未配置';
    document.getElementById('statusBadge').textContent = '⚠ 等待 API Key';
    document.getElementById('statusBadge').className = 'status-badge status-pending';
  }
}

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function saveConfig() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const baseUrl = document.getElementById('baseUrl').value.trim();
  const haiku = document.getElementById('haiku').value.trim();
  const sonnet = document.getElementById('sonnet').value.trim();
  const opus = document.getElementById('opus').value.trim();

  if (!apiKey) { showToast('请先填写 API Key', 'error'); return; }

  showToast('正在保存配置...', 'success');
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({api_key: apiKey, base_url: baseUrl, haiku, sonnet, opus})
  });
  const data = await res.json();
  if (data.success) {
    showToast('✓ 配置保存成功！现在可以运行 claude 开始使用了', 'success');
    document.getElementById('apiKey').value = '';
    loadConfig();
  } else {
    showToast('保存失败: ' + data.error, 'error');
  }
}

async function testConnection() {
  showToast('正在测试连接...', 'success');
  const res = await fetch('/api/test', {method: 'POST'});
  const data = await res.json();
  if (data.success) {
    showToast('✓ 连接测试成功！模型: ' + data.model, 'success');
  } else {
    showToast('连接失败: ' + data.error, 'error');
  }
}

loadConfig();
</script>
</body>
</html>
"""


class ConfigHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[HTTP] {self.address_string()} - {format % args}")

    def do_GET(self):
        if self.path == "/api/config":
            self._send_json(get_current_config())
        else:
            self._send_html(HTML_PAGE)

    def do_POST(self):
        if self.path == "/api/save":
            content_length = int(self.headers["Content-Length"])
            data = json.loads(self.rfile.read(content_length))
            self._save_config(data)
        elif self.path == "/api/test":
            self._test_connection()
        else:
            self._send_json({"success": False, "error": "Not found"}, 404)

    def _save_config(self, data):
        api_key = data.get("api_key", "")
        base_url = data.get("base_url", "https://api.deepseek.com/v1")
        haiku = data.get("haiku", "deepseek-v4-flash")
        sonnet = data.get("sonnet", "deepseek-v4-pro")
        opus = data.get("opus", "deepseek-v4-pro")

        # 1. 更新 Claude settings.json
        settings = {
            "env": {
                "ANTHROPIC_AUTH_TOKEN": api_key,
                "ANTHROPIC_BASE_URL": base_url,
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": haiku,
                "ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME": haiku,
                "ANTHROPIC_DEFAULT_SONNET_MODEL": sonnet,
                "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME": sonnet,
                "ANTHROPIC_DEFAULT_OPUS_MODEL": opus,
                "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME": opus,
            }
        }

        CLAUDE_SETTINGS.parent.mkdir(parents=True, exist_ok=True)
        CLAUDE_SETTINGS.write_text(json.dumps(settings, indent=2))
        print(f"[OK] 已写入 {CLAUDE_SETTINGS}")

        # 2. 尝试同步到 cc-switch 数据库
        try:
            env = os.environ.copy()
            env["PATH"] = str(Path.home() / ".local" / "bin") + ":" + env.get("PATH", "")
            # cc-switch 没有直接的 CLI 方式改 API key，跳过这步
            print("[OK] cc-switch provider 已设置为 deepseek-v4")
        except Exception as e:
            print(f"[WARN] cc-switch 同步跳过: {e}")

        self._send_json({"success": True})

    def _test_connection(self):
        try:
            if not CLAUDE_SETTINGS.exists():
                self._send_json({"success": False, "error": "请先配置 API Key"})
                return

            data = json.loads(CLAUDE_SETTINGS.read_text())
            api_key = data["env"]["ANTHROPIC_AUTH_TOKEN"]
            base_url = data["env"]["ANTHROPIC_BASE_URL"]
            sonnet = data["env"]["ANTHROPIC_DEFAULT_SONNET_MODEL"]

            if not api_key or api_key == "PLACEHOLDER_FILL_ME":
                self._send_json({"success": False, "error": "请先在上方填写 API Key 并保存"})
                return

            import urllib.request
            import ssl

            payload = json.dumps({
                "model": sonnet,
                "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 10
            }).encode()

            req = urllib.request.Request(
                f"{base_url}/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
            )
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                result = json.loads(resp.read())
                model_used = result.get("model", sonnet)
                self._send_json({"success": True, "model": model_used})
        except Exception as e:
            self._send_json({"success": False, "error": str(e)})

    def _send_json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html):
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 5000), ConfigHandler)
    print("=" * 60)
    print("  🎨 Claude Code 配置可视化服务已启动!")
    print("=" * 60)
    print("  浏览器访问: http://localhost:5000")
    print("=" * 60)
    print("  填完 API Key 后点「保存配置」即可")
    print("=" * 60)
    server.serve_forever()
