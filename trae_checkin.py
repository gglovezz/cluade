#!/usr/bin/env python3
"""
Trae 每日自动签到（不依赖 Trae 客户端运行）

用法：
  python trae_checkin.py --init            生成配置模板
  python trae_checkin.py                   查询状态，未签到则自动领取
  python trae_checkin.py --status          只查询，不领取
  python trae_checkin.py --dry-run         演示：只打印将要做的请求
  python trae_checkin.py --config X.json   指定配置文件

配置（trae_checkin.json，与本脚本同目录）：
  {
    "token":     "粘贴 Cloud-IDE-JWT 后面的 JWT 串",
    "device_id": "客户端设备号（claim 必填）",
    "user_id":   "可选",
    "region":    "CN"
  }
也可用环境变量覆盖：TRAE_TOKEN / TRAE_DEVICE_ID / TRAE_USER_ID / TRAE_REGION

退出码：0 成功或今日已签 | 2 登录态失效需更新 token | 3 配置缺失 | 4 网络错误 | 1 其他
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://api.trae.cn"
STATUS_URL = f"{BASE}/trae/api/v2/ug/checkin_credits/status"
CLAIM_URL = f"{BASE}/trae/api/v2/ug/checkin_credits/claim"
DEFAULT_CONFIG = Path(__file__).with_name("trae_checkin.json")

MAX_RETRIES = 4
RETRY_BASE = 3.0
RETRY_JITTER = 2.0
TIMEOUT = 20

AUTH_CODES = {401, 403, 1001}


def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)


def load_config(path):
    cfg = {}
    if Path(path).exists():
        try:
            cfg = json.loads(Path(path).read_text(encoding="utf-8"))
        except Exception as e:
            log(f"配置文件解析失败：{e}")
            sys.exit(3)
    for env_key, cfg_key in (
        ("TRAE_TOKEN", "token"),
        ("TRAE_DEVICE_ID", "device_id"),
        ("TRAE_USER_ID", "user_id"),
        ("TRAE_REGION", "region"),
    ):
        val = os.environ.get(env_key)
        if val:
            cfg[cfg_key] = val
    cfg.setdefault("region", "CN")
    return cfg


def build_headers(cfg, need_device=True):
    token = (cfg.get("token") or "").strip()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Cloud-IDE-JWT {token}",
    }
    if need_device and cfg.get("device_id"):
        headers["x-device-id"] = str(cfg["device_id"])
    if cfg.get("user_id"):
        headers["x-user-id"] = str(cfg["user_id"])
    if cfg.get("region"):
        headers["X-User-Region"] = str(cfg["region"])
    return headers


def is_rate_limited(http_code, body):
    if http_code in (429, 500, 502, 503, 504):
        return True
    msg = str(body.get("message", "")).lower()
    return any(k in msg for k in ("frequent", "too many", "rate", "频繁", "稍后"))


def post(url, headers, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            body = json.loads(raw)
        except Exception:
            body = {"message": raw[:200]}
        return e.code, body
    except urllib.error.URLError as e:
        raise ConnectionError(str(e.reason))


def post_with_retry(url, headers, payload, op):
    last = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            code, body = post(url, headers, payload)
        except ConnectionError as e:
            last = f"网络错误：{e}"
            log(f"{op} 第 {attempt} 次失败：{last}")
        else:
            if is_rate_limited(code, body):
                last = f"HTTP {code} / {body.get('message', '')}"
                log(f"{op} 被限流（第 {attempt} 次）：{last}")
            else:
                return code, body
        if attempt < MAX_RETRIES:
            delay = RETRY_BASE * attempt + random.uniform(0, RETRY_JITTER)
            time.sleep(delay)
    raise RuntimeError(f"{op} 重试 {MAX_RETRIES} 次仍失败：{last}")


def refresh_checkin_status(body):
    """从 status / claim 响应中稳健判断今日是否已签"""
    for key in ("checked_in", "did_checked_in"):
        if key in body and isinstance(body[key], bool):
            return body[key]
    data = body.get("data")
    if isinstance(data, dict):
        for key in ("checked_in", "did_checked_in"):
            if key in data and isinstance(data[key], bool):
                return data[key]
    return None


def extract_credits(body):
    """尽量提取积分数量，找不到就返回 None（不编造）"""
    candidates = [body]
    if isinstance(body.get("data"), dict):
        candidates.append(body["data"])
    for obj in candidates:
        for key in ("credits", "available_credits", "total_credits", "balance"):
            val = obj.get(key)
            if isinstance(val, (int, float)):
                return val
    return None


def handle_auth_failure(http_code, body):
    biz_code = body.get("code")
    if http_code in AUTH_CODES or http_code >= 400 or biz_code in AUTH_CODES:
        msg = body.get("message", "")
        log(f"登录态无效或已过期（HTTP {http_code} / code={biz_code} / {msg}）。")
        log("请重新从 Trae 客户端本地登录态中取新的 token，更新 trae_checkin.json。")
        sys.exit(2)


def cmd_init(path):
    if Path(path).exists():
        log(f"配置已存在，未覆盖：{path}")
        return
    template = {
        "token": "",
        "device_id": "",
        "user_id": "",
        "region": "CN",
    }
    Path(path).write_text(json.dumps(template, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"已生成配置模板：{path}")
    log("请填入 token 与 device_id 后再运行。")


def main():
    parser = argparse.ArgumentParser(description="Trae 每日自动签到")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--init", action="store_true", help="生成配置模板")
    parser.add_argument("--status", action="store_true", help="只查询状态")
    parser.add_argument("--claim", action="store_true", help="直接领取（跳过状态查询）")
    parser.add_argument("--dry-run", action="store_true", help="只演示请求，不发送")
    args = parser.parse_args()

    if args.init:
        cmd_init(args.config)
        return

    cfg = load_config(args.config)
    if not cfg.get("token"):
        log(f"未配置 token。运行 `python {Path(__file__).name} --init` 生成模板，或设置环境变量 TRAE_TOKEN。")
        sys.exit(3)
    if args.claim and not cfg.get("device_id"):
        log("领取接口需要 device_id，请在配置中填写。")
        sys.exit(3)

    payload = {"req_source": 1}

    if args.dry_run:
        log(f"DRY-RUN status -> POST {STATUS_URL} {payload}")
        log(f"DRY-RUN headers: {list(build_headers(cfg, need_device=False))}")
        log(f"DRY-RUN claim  -> POST {CLAIM_URL} {payload}")
        return

    # 1) 查询状态
    code, body = post_with_retry(STATUS_URL, build_headers(cfg, need_device=False), payload, "查询状态")
    handle_auth_failure(code, body)
    if code != 200:
        log(f"查询状态失败：HTTP {code} / {body.get('message', '')}")
        sys.exit(1)

    credits = extract_credits(body)
    checked = refresh_checkin_status(body)

    if checked is True:
        log(f"今日已签到，跳过领取。当前积分：{credits if credits is not None else '未知'}")
        return
    if checked is None:
        log(f"状态字段无法识别，响应：{json.dumps(body, ensure_ascii=False)[:300]}")

    if args.status:
        log(f"今日未签到。当前积分：{credits if credits is not None else '未知'}")
        return

    # 2) 领取
    if not cfg.get("device_id"):
        log("领取接口需要 device_id（claim 必填），请在配置中填写后重试。")
        sys.exit(3)
    code, body = post_with_retry(CLAIM_URL, build_headers(cfg, need_device=True), payload, "领取签到")
    handle_auth_failure(code, body)

    if code == 200 and body.get("code") in (0, None):
        new_credits = extract_credits(body)
        log(f"签到成功，获得积分：{new_credits if new_credits is not None else '未知'}")
        return

    msg = str(body.get("message", ""))
    if "already" in msg.lower() or "已签" in msg or "already checked" in msg.lower():
        log(f"今日已签到（{msg or 'already checked in'}）。")
        return

    log(f"领取失败：HTTP {code} / code={body.get('code')} / {msg}")
    sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        log(str(e))
        sys.exit(4)
    except KeyboardInterrupt:
        sys.exit(130)
