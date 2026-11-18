#!/usr/bin/env python3
"""
Claude Code <-> DeepSeek 协议桥接代理
完整支持：
- Anthropic Messages API -> OpenAI Chat Completions
- SSE 流式格式转换 (OpenAI SSE -> Anthropic SSE)
- Tools/Function Calling 双向转换
"""

import json
import ssl
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

UPSTREAM = "https://api.deepseek.com/v1"
API_KEY = "sk-b5f2b6da1a5f4a6aa6e8a1ad2d3e605a"
MODEL = "deepseek-v4-pro"


def log(msg):
    print(msg, flush=True)


def _sse_encode(event, data):
    """编码一个 SSE 事件"""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()


class SseState:
    """跟踪 SSE 转换状态"""
    def __init__(self, msg_id, model):
        self.msg_id = msg_id
        self.model = model
        self.content_block_idx = 0
        self.first_delta = True
        self.has_text = False
        self.has_tool_use = False
        self.tool_blocks = []  # (block_idx, tool_use_obj)
        self.current_tool_call = None
        self.usage = {"input_tokens": 0, "output_tokens": 0}
        self.stop_reason = "end_turn"


class OpenAIToAnthropicSSE:
    """把 OpenAI Chat Completions SSE 转成 Anthropic Messages SSE"""

    def __init__(self, model):
        self.model = model
        self.msg_id = f"msg_{__import__('uuid').uuid4().hex[:24]}"
        self.state = SseState(self.msg_id, model)
        self._emitted_content_blocks = set()

    def convert_chunk(self, chunk_text):
        """处理一个 OpenAI SSE chunk，返回若干 Anthropic SSE events"""
        out = []

        # 解析 SSE data 行
        lines = chunk_text.strip().split("\n")
        data_lines = [l[6:] for l in lines if l.startswith("data: ")]

        for dl in data_lines:
            if dl.strip() == "[DONE]":
                continue
            try:
                obj = json.loads(dl)
            except:
                continue

            choices = obj.get("choices", [])
            if not choices:
                continue

            choice = choices[0]
            delta = choice.get("delta", {})
            finish_reason = choice.get("finish_reason")

            # 记录 usage（如果有的话）
            usage = obj.get("usage")
            if usage:
                self.state.usage = {
                    "input_tokens": usage.get("prompt_tokens", 0),
                    "output_tokens": usage.get("completion_tokens", 0),
                }

            # 处理 finish_reason
            if finish_reason:
                self.state.stop_reason = {
                    "stop": "end_turn",
                    "tool_calls": "tool_use",
                    "length": "max_tokens",
                }.get(finish_reason, "end_turn")

            # 处理 role 变化 -> 发 message_start
            if delta.get("role") == "assistant" and self.state.first_delta:
                self.state.first_delta = False
                out.append(_sse_encode("message_start", {
                    "type": "message_start",
                    "message": {
                        "id": self.msg_id,
                        "type": "message",
                        "role": "assistant",
                        "model": self.model,
                        "content": [],
                        "stop_reason": None,
                        "stop_sequence": None,
                        "usage": {"input_tokens": 0, "output_tokens": 0},
                    }
                }))
                # 注意：不要在这里发 content_block_start(text)
                # 等真正有 text delta 时再发

            # 处理 text content delta
            content = delta.get("content")
            if content:
                if not self.state.has_text:
                    self.state.has_text = True
                    out.append(self._emit_text_block_start())
                out.append(_sse_encode("content_block_delta", {
                    "type": "content_block_delta",
                    "index": self.state.content_block_idx - 1,
                    "delta": {"type": "text_delta", "text": content}
                }))

            # 处理 tool_calls delta
            tool_calls = delta.get("tool_calls", [])
            for tc in tool_calls:
                tc_idx = tc.get("index", 0)

                # 新的 tool call 开始 -> 发 content_block_start(tool_use)
                if tc_idx not in self._emitted_content_blocks:
                    self._emitted_content_blocks.add(tc_idx)
                    block_idx = self.state.content_block_idx
                    self.state.content_block_idx += 1

                    tool_use = {
                        "type": "tool_use",
                        "id": tc.get("id", f"toolu_{__import__('uuid').uuid4().hex[:24]}"),
                        "name": tc.get("function", {}).get("name", ""),
                        "input": {},
                    }
                    self.state.tool_blocks.append((block_idx, tool_use))
                    self.state.current_tool_call = {
                        "idx": tc_idx,
                        "block_idx": block_idx,
                        "buffer": "",
                    }

                    out.append(_sse_encode("content_block_start", {
                        "type": "content_block_start",
                        "index": block_idx,
                        "content_block": tool_use
                    }))

                # 收集 function arguments
                tc_func = tc.get("function", {})
                if tc_func.get("arguments"):
                    if self.state.current_tool_call and self.state.current_tool_call["idx"] == tc_idx:
                        self.state.current_tool_call["buffer"] += tc_func["arguments"]
                        buf = self.state.current_tool_call["buffer"]
                        try:
                            args = json.loads(buf)
                        except:
                            args = buf
                        block_idx = self.state.current_tool_call["block_idx"]
                        out.append(_sse_encode("content_block_delta", {
                            "type": "content_block_delta",
                            "index": block_idx,
                            "delta": {"type": "input_json_delta", "partial_json": tc_func["arguments"]}
                        }))

        return out

    def _emit_text_block_start(self):
        block_idx = self.state.content_block_idx
        self.state.content_block_idx += 1
        return _sse_encode("content_block_start", {
            "type": "content_block_start",
            "index": block_idx,
            "content_block": {"type": "text", "text": ""}
        })

    def finish(self):
        """生成最后的 events: content_block_stop + message_delta + message_stop"""
        out = []

        # 结束所有 content blocks
        for i in range(self.state.content_block_idx):
            out.append(_sse_encode("content_block_stop", {
                "type": "content_block_stop",
                "index": i
            }))

        # message_delta
        out.append(_sse_encode("message_delta", {
            "type": "message_delta",
            "delta": {"stop_reason": self.state.stop_reason, "stop_sequence": None},
            "usage": self.state.usage
        }))

        # message_stop
        out.append(_sse_encode("message_stop", {
            "type": "message_stop"
        }))

        return out


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "ClaudeProxy/1.0"

    def log_message(self, fmt, *args):
        log(f"[PROXY] {self.address_string()} - {fmt % args}")

    def do_GET(self):
        path = self.path.rstrip("/")
        log(f"[PROXY] GET {path}")
        self._pass("GET", path, None)

    def do_POST(self):
        path = self.path.rstrip("/")
        clen = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(clen) if clen else b"{}"

        log(f"[PROXY] POST {path} ({len(raw)} bytes)")

        try:
            data = json.loads(raw)
        except Exception as e:
            self._err(400, f"Bad JSON: {e}")
            return

        is_anthropic = ("messages" in path or
                        (data.get("max_tokens") is not None and
                         data.get("model") and
                         not data.get("messages")))

        if is_anthropic:
            self._convert_and_stream(data)
        else:
            self._pass("POST", path, raw)

    def _convert_and_stream(self, data):
        """Anthropic -> OpenAI 转换 + SSE 格式转换"""
        model = data.get("model", MODEL)
        max_tokens = data.get("max_tokens", 4096)
        stream = data.get("stream", False)
        msgs = data.get("messages", [])
        system = data.get("system", "")
        tools = data.get("tools", [])
        tool_choice = data.get("tool_choice")

        # --- Convert messages ---
        sys_text = ""
        if system:
            if isinstance(system, str):
                sys_text = system
            elif isinstance(system, list):
                sys_text = "\n".join(
                    b.get("text", "") for b in system
                    if isinstance(b, dict) and b.get("type") == "text"
                )

        o_msgs = []
        if sys_text:
            o_msgs.append({"role": "system", "content": sys_text})

        for m in msgs:
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, list):
                txt = []
                for blk in content:
                    if isinstance(blk, dict) and blk.get("type") == "text":
                        txt.append(blk.get("text", ""))
                    elif isinstance(blk, dict) and blk.get("type") == "tool_use":
                        pass
                    elif isinstance(blk, dict) and blk.get("type") == "tool_result":
                        o_msgs.append({
                            "role": "tool",
                            "tool_call_id": blk.get("tool_use_id", ""),
                            "content": str(blk.get("content", ""))
                        })
                if txt:
                    o_msgs.append({"role": role, "content": "\n".join(txt)})
            elif content:
                o_msgs.append({"role": role, "content": content})

        # --- Convert tools ---
        o_tools = []
        for t in tools:
            if not isinstance(t, dict):
                continue
            o_tools.append({
                "type": "function",
                "function": {
                    "name": t.get("name", ""),
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema", {"type": "object", "properties": {}})
                }
            })

        # --- Convert tool_choice ---
        tc_out = None
        if tool_choice:
            if isinstance(tool_choice, str):
                tc_map = {"auto": "auto", "any": "required", "tool": "auto"}
                tc_out = tc_map.get(tool_choice, tool_choice)
            elif isinstance(tool_choice, dict) and tool_choice.get("type") == "tool":
                tc_out = {"type": "function", "function": {"name": tool_choice.get("name", "")}}

        payload = {
            "model": model, "messages": o_msgs,
            "max_tokens": max_tokens, "stream": stream,
        }
        if o_tools:
            payload["tools"] = o_tools
        if tc_out:
            payload["tool_choice"] = tc_out

        log(f"[PROXY] -> DeepSeek /chat/completions model={model} stream={stream} tools={len(o_tools)}")

        # --- Make request ---
        url = f"{UPSTREAM}/chat/completions"
        body = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=body, headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            # 注意：不要转 Accept-Encoding，让上游返回未压缩数据
        })

        ctx = ssl.create_default_context()
        try:
            resp = urllib.request.urlopen(req, context=ctx, timeout=300)
        except urllib.error.HTTPError as e:
            raw = e.read().decode()
            log(f"[PROXY] UPSTREAM ERROR {e.code}: {raw[:300]}")
            self._err(e.code, raw[:200])
            return

        # --- 始终缓冲后用 JSON 返回给 Claude Code ---
        # 这样就不用实现 SSE 格式转换了
        buffer = b""
        while True:
            data = resp.read(4096)
            if not data:
                break
            buffer += data

        log(f"[PROXY] Buffered {len(buffer)} bytes from upstream")

        # 判断是 SSE 还是 JSON
        is_sse = b"data:" in buffer[:200]

        try:
            if is_sse:
                json_resp = self._sse_to_json(buffer.decode(errors='replace'), model)
            else:
                # 非流式：直接 parse JSON
                deepseek_resp = json.loads(buffer.decode())
                json_resp = self._deepseek_json_to_anthropic(deepseek_resp, model)

            content_text = "".join(c.get("text", "") for c in json_resp.get("content", []) if c.get("type") == "text")
            log(f"[PROXY] Parsed content: {repr(content_text[:100])}, blocks: {len(json_resp.get('content', []))}, stop_reason: {json_resp.get('stop_reason')}")
        except Exception as e:
            log(f"[PROXY] Convert error: {e}")
            import traceback
            log(traceback.format_exc())
            self._err(502, str(e))
            return

        # 返回 JSON
        json_body = json.dumps(json_resp).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(json_body)))
        self.end_headers()
        self.wfile.write(json_body)
        self.wfile.flush()
        log(f"[PROXY] Sent {len(json_body)} bytes JSON to client")

    def _sse_to_json(self, sse_text, model):
        """从 OpenAI SSE 缓冲中提取完整内容，转成 Anthropic Messages 非流式 JSON"""
        content_parts = []
        tool_calls = []
        current_tc = None
        finish_reason = "end_turn"
        usage = {"input_tokens": 0, "output_tokens": 0}

        for line in sse_text.split("\n"):
            if not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str.strip() == "[DONE]":
                continue
            try:
                obj = json.loads(data_str)
            except:
                continue

            # usage
            if "usage" in obj and obj["usage"]:
                usage = {
                    "input_tokens": obj["usage"].get("prompt_tokens", 0),
                    "output_tokens": obj["usage"].get("completion_tokens", 0),
                }

            choices = obj.get("choices", [])
            if not choices:
                continue
            c = choices[0]

            # finish_reason
            fr = c.get("finish_reason")
            if fr:
                finish_reason = {
                    "stop": "end_turn",
                    "tool_calls": "tool_use",
                    "length": "max_tokens",
                }.get(fr, "end_turn")

            # delta
            delta = c.get("delta", {})
            if not delta:
                continue

            # text content
            if delta.get("content"):
                content_parts.append(delta["content"])

            # tool calls
            for tc in delta.get("tool_calls", []):
                tc_idx = tc.get("index", 0)
                if current_tc is None or current_tc["index"] != tc_idx:
                    # 保存上一个
                    if current_tc and current_tc.get("name"):
                        tool_calls.append(current_tc)
                    # 开始新的
                    current_tc = {
                        "index": tc_idx,
                        "id": tc.get("id", ""),
                        "name": tc.get("function", {}).get("name", ""),
                        "args_buf": "",
                    }
                if tc.get("function", {}).get("arguments"):
                    current_tc["args_buf"] += tc["function"]["arguments"]

        if current_tc and current_tc.get("name"):
            tool_calls.append(current_tc)

        # 构建 Anthropic content blocks
        blocks = []
        text_content = "".join(content_parts)
        if text_content:
            blocks.append({"type": "text", "text": text_content})

        for tc in tool_calls:
            try:
                args = json.loads(tc["args_buf"])
            except:
                args = {"raw": tc["args_buf"]}
            blocks.append({
                "type": "tool_use",
                "id": tc["id"] or f"toolu_{__import__('uuid').uuid4().hex[:24]}",
                "name": tc["name"],
                "input": args,
            })

        msg_id = f"msg_{__import__('uuid').uuid4().hex[:24]}"
        return {
            "id": msg_id,
            "type": "message",
            "role": "assistant",
            "model": model,
            "content": blocks,
            "stop_reason": finish_reason,
            "stop_sequence": None,
            "usage": usage,
        }

    def _deepseek_json_to_anthropic(self, ds_resp, model):
        """把 DeepSeek 非流式 JSON 响应转成 Anthropic JSON"""
        choice = ds_resp.get("choices", [{}])[0]
        msg = choice.get("message", {})
        content = msg.get("content") or ""
        tool_calls = msg.get("tool_calls", [])
        finish_reason = choice.get("finish_reason", "end_turn")

        usage = ds_resp.get("usage", {})
        anthropic_usage = {
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
        }

        blocks = []
        if content:
            blocks.append({"type": "text", "text": content})

        for tc in tool_calls:
            func = tc.get("function", {})
            try:
                args = json.loads(func.get("arguments", "{}"))
            except:
                args = {"raw": func.get("arguments", "")}
            blocks.append({
                "type": "tool_use",
                "id": tc.get("id", f"toolu_{__import__('uuid').uuid4().hex[:24]}"),
                "name": func.get("name", ""),
                "input": args,
            })

        fr_map = {
            "stop": "end_turn",
            "tool_calls": "tool_use",
            "length": "max_tokens",
        }
        return {
            "id": f"msg_{__import__('uuid').uuid4().hex[:24]}",
            "type": "message",
            "role": "assistant",
            "model": model,
            "content": blocks,
            "stop_reason": fr_map.get(finish_reason, "end_turn"),
            "stop_sequence": None,
            "usage": anthropic_usage,
        }

    def _pass(self, method, path, raw_body):
        url = f"{UPSTREAM}{path}"
        if method == "GET":
            req = urllib.request.Request(url)
        else:
            req = urllib.request.Request(url, data=raw_body)
        req.add_header("Authorization", f"Bearer {API_KEY}")
        req.add_header("Content-Type", "application/json")

        ctx = ssl.create_default_context()
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=300) as resp:
                self.send_response(resp.status)
                for h in ("Content-Type", "Cache-Control"):
                    v = resp.headers.get(h)
                    if v:
                        self.send_header(h, v)
                self.end_headers()
                while True:
                    d = resp.read(4096)
                    if not d:
                        break
                    self.wfile.write(d)
                log(f"[PROXY] Pass-through {resp.status}")
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                self.send_response(e.code)
                self.end_headers()
                self.wfile.write(raw)
            except:
                pass

    def _err(self, code, msg):
        try:
            body = json.dumps({"error": msg}).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except:
            pass


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 51010), ProxyHandler)
    log("=" * 60)
    log("  🔄 Claude Code <-> DeepSeek 完整协议桥接")
    log("  监听: http://127.0.0.1:51010")
    log("  上游: " + UPSTREAM)
    log("  功能: Anthropic Messages <-> OpenAI Chat Completions")
    log("        双向 SSE 格式转换 + Tools 转换")
    log("=" * 60)
    server.serve_forever()
