"""WCMS 已部署測試環境的錯誤回應回歸測試；不輸出憑證或 Cookie 值。"""
import argparse
import gzip
import io
import json
import os
import re
import unittest
from http.cookies import SimpleCookie
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


MAX_RESPONSE_BYTES = 1024 * 1024


def decode_response(raw, encoding):
    """限制壓縮前後大小；解析失敗只輸出固定訊息。"""
    if len(raw) > MAX_RESPONSE_BYTES:
        raise AssertionError("回應超過允許大小。")
    encoding = encoding.strip().lower()
    if encoding not in ("", "identity", "gzip"):
        raise AssertionError("不支援的 Content-Encoding。")
    if encoding == "gzip":
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(raw)) as stream:
                raw = stream.read(MAX_RESPONSE_BYTES + 1)
        except Exception:
            raise AssertionError("gzip 回應損壞或不完整。") from None
        if len(raw) > MAX_RESPONSE_BYTES:
            raise AssertionError("解壓後回應超過允許大小。")
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        raise AssertionError("回應不是有效 UTF-8。") from None


class NoRedirect(HTTPRedirectHandler):
    """避免登入轉址或跨站轉址掩蓋實際 API 狀態碼。"""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class ErrorResponseSecurityTests(unittest.TestCase):
    """透過對外 HTTPS 入口驗證錯誤標頭、Cookie 與診斷端點存取限制。"""

    group = "all"

    @classmethod
    def setUpClass(cls):
        cls.base = os.environ.get("WCMS_VERIFY_BASE_URL", "").rstrip("/")
        cls.authorization = os.environ.get("WCMS_VERIFY_AUTHORIZATION", "")
        cls.cookie = os.environ.get("WCMS_VERIFY_COOKIE", "")
        parsed = urlsplit(cls.base)
        if (parsed.scheme != "https" or not parsed.netloc or parsed.username
                or parsed.password or parsed.query or parsed.fragment):
            raise RuntimeError("WCMS_VERIFY_BASE_URL 必須是測試站 HTTPS 根網址，可包含應用程式基底路徑。")
        if cls.group in ("all", "admin") and not (cls.authorization or cls.cookie):
            raise RuntimeError("請以環境變數提供測試管理者 Authorization 或 Cookie。")
        cls.client = build_opener(NoRedirect())

    def request_case(self, name, authenticated=True, verification=True):
        headers = {"Accept-Encoding": "gzip"}
        if authenticated:
            if self.authorization:
                headers["Authorization"] = self.authorization
            if self.cookie:
                headers["Cookie"] = self.cookie
        if verification:
            headers["X-WCMS-Security-Verification"] = "SameSite500"
        request = Request(self.base + "/Service/Diagnostics/SameSite500/" + name, headers=headers)
        return self.send_request(request, name)

    def send_request(self, request, case):
        """讀取原始回應，保留 HTTP 錯誤碼且不跟隨轉址。"""
        try:
            response = self.client.open(request, timeout=30)
        except HTTPError as error:
            response = error
        except Exception:
            raise AssertionError("HTTP 連線失敗；原始例外已隱藏。") from None
        with response:
            content_type = response.headers.get_content_type()
            trace = response.headers.get("X-WCMS-Trace-Id", "")
            print(json.dumps({"case": case, "status": response.status,
                              "content_type": content_type if content_type in ("application/json", "text/html") else "other",
                              "trace_id": trace if re.fullmatch(r"[0-9a-f]{32}", trace) else "missing-or-invalid"}), flush=True)
            body = decode_response(response.read(MAX_RESPONSE_BYTES + 1), response.headers.get("Content-Encoding", ""))
            return response.status, response.headers, body

    def assert_error_headers(self, headers):
        expected = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "X-Permitted-Cross-Domain-Policies": "none",
        }
        for name, value in expected.items():
            self.assertTrue(headers.get(name) == value, name)
        self.assertTrue(headers.get("Referrer-Policy") in ("no-referrer", "strict-origin-when-cross-origin"), "Referrer-Policy 不符合政策")
        self.assertTrue("default-src 'none'" in headers.get("Content-Security-Policy", ""), "CSP 不符合政策")
        self.assertTrue("no-store" in headers.get("Cache-Control", "").lower(), "缺少 no-store")
        self.assertTrue(headers.get("Pragma") == "no-cache", "Pragma 不符合政策")
        for name in ("X-Powered-By", "X-AspNet-Version", "X-AspNetMvc-Version"):
            self.assertFalse(headers.get(name, "").strip(), name)

    def test_xsrf_rejections(self):
        """向僅支援 GET 的診斷路由送 POST，避免防護失效時進入登入或計次業務。"""
        parsed = urlsplit(self.base)
        origin = parsed.scheme + "://" + parsed.netloc
        traces = set()
        for case in ("missing_cookie", "invalid_token"):
            with self.subTest(case=case):
                headers = {
                    "Accept-Encoding": "gzip",
                    "Origin": origin,
                    "Referer": self.base + "/",
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": "wcms-verification-invalid-token",
                }
                if case == "invalid_token":
                    headers["Cookie"] = "__Host-WCMS-Antiforgery=wcms-verification-invalid-cookie"
                request = Request(self.base + "/Service/Diagnostics/SameSite500/Throw",
                                  data=b"{}", headers=headers, method="POST")
                status, response_headers, body = self.send_request(request, case)
                self.assertEqual(status, 403, "應由 XSRF Middleware 拒絕；405 代表未通過本測試")
                self.assert_error_headers(response_headers)
                self.assertTrue(response_headers.get("Content-Type", "").lower().startswith("application/json"),
                                "403 必須保留 JSON，不可被 IIS HTML 錯誤頁取代")
                try:
                    payload = json.loads(body)
                except ValueError:
                    self.fail("403 回應不是有效 JSON")
                self.assertTrue(isinstance(payload, dict), "403 JSON 必須為物件")
                self.assertTrue(payload.get("success") is False, "必須回報驗證失敗")
                self.assertTrue(payload.get("message") == "Invalid XSRF token.",
                                "必須確認為 XSRF 拒絕，而非 Host 或 Origin 拒絕")
                trace = response_headers.get("X-WCMS-Trace-Id", "")
                self.assertTrue(re.fullmatch(r"[0-9a-f]{32}", trace) is not None,
                                "缺少有效的伺服器 Trace ID")
                self.assertTrue(trace not in traces, "不同拒絕請求不可重用 Trace ID")
                traces.add(trace)
                self.assertFalse(response_headers.get_all("Set-Cookie", []),
                                 "此 XSRF 拒絕流程不應發行 Cookie")

    def test_exception_responses(self):
        for name in ("Throw", "CookieThenThrow"):
            with self.subTest(case=name):
                status, headers, body = self.request_case(name)
                self.assertEqual(status, 500)
                self.assert_error_headers(headers)
                cookies = headers.get_all("Set-Cookie", [])
                self.assertFalse(any("wcms.diag500=" in value.lower() for value in cookies),
                                 "例外回應不可發行先前待送的診斷 Cookie")
                for marker in ("InvalidOperationException", "Controlled SameSite", "StackTrace"):
                    self.assertTrue(marker not in body, "錯誤內容含內部例外資訊")

    def test_direct_500_cookie_policy(self):
        status, headers, _ = self.request_case("Cookie")
        self.assertEqual(status, 500)
        self.assert_error_headers(headers)
        matches = []
        for value in headers.get_all("Set-Cookie", []):
            parsed = SimpleCookie()
            parsed.load(value)
            if "wcms.diag500" in parsed:
                matches.append(parsed["wcms.diag500"])
        self.assertEqual(len(matches), 1, "必須取得一筆診斷 Cookie")
        cookie = matches[0]
        self.assertTrue(cookie["samesite"].lower() == "strict", "SameSite 必須為 Strict")
        self.assertTrue(cookie["secure"], "缺少 Secure")
        self.assertTrue(cookie["httponly"], "缺少 HttpOnly")

    def test_missing_verification_header(self):
        status, _, _ = self.request_case("CookieThenThrow", verification=False)
        self.assertEqual(status, 404)

    def test_anonymous_rejected(self):
        status, _, _ = self.request_case("CookieThenThrow", authenticated=False)
        self.assertEqual(status, 401)


class ResponseDecodingTests(unittest.TestCase):
    """不連線的回應解析回歸測試。"""

    def test_plain_and_gzip(self):
        raw = b'{"success":false}'
        for encoding, payload in (("", raw), ("identity", raw), ("gzip", gzip.compress(raw))):
            with self.subTest(encoding=encoding):
                self.assertIs(json.loads(decode_response(payload, encoding))["success"], False)

    def test_invalid_data(self):
        cases = ((b"secret-corrupt", "gzip"), (gzip.compress(b"hello")[:-5], "gzip"),
                 (b"x", "br"), (bytes([255]), ""))
        for payload, encoding in cases:
            with self.subTest(encoding=encoding):
                with self.assertRaises(AssertionError) as error:
                    decode_response(payload, encoding)
                self.assertNotIn("secret-corrupt", str(error.exception))

    def test_size_limits(self):
        raw = b"x" * (MAX_RESPONSE_BYTES + 1)
        for payload, encoding in ((raw, ""), (gzip.compress(raw), "gzip")):
            with self.subTest(encoding=encoding):
                with self.assertRaises(AssertionError):
                    decode_response(payload, encoding)

    def test_safe_diagnostics_and_http_error_gzip(self):
        from contextlib import redirect_stdout
        from email.message import Message
        from unittest.mock import Mock
        headers = Message()
        headers["Content-Type"] = "application/json"
        headers["Content-Encoding"] = "gzip"
        headers["X-WCMS-Trace-Id"] = "secret-value"
        headers["Set-Cookie"] = "access=secret-value"
        error = HTTPError("https://example.invalid", 403, "Forbidden", headers,
                          io.BytesIO(gzip.compress(b'{"success":false}')))
        runner = ErrorResponseSecurityTests()
        runner.client = Mock()
        runner.client.open.side_effect = error
        output = io.StringIO()
        with redirect_stdout(output):
            status, _, body = runner.send_request(Request("https://example.invalid"), "missing_cookie")
        self.assertEqual(status, 403)
        self.assertIs(json.loads(body)["success"], False)
        self.assertNotIn("secret-value", output.getvalue())
        self.assertEqual(json.loads(output.getvalue())["trace_id"], "missing-or-invalid")

    def test_xsrf_without_credentials(self):
        from unittest.mock import patch
        with patch.dict(os.environ, {"WCMS_VERIFY_BASE_URL": "https://example.invalid"}, clear=True):
            old_group = ErrorResponseSecurityTests.group
            try:
                ErrorResponseSecurityTests.group = "xsrf"
                ErrorResponseSecurityTests.setUpClass()
                ErrorResponseSecurityTests.group = "admin"
                with self.assertRaises(RuntimeError):
                    ErrorResponseSecurityTests.setUpClass()
            finally:
                ErrorResponseSecurityTests.group = old_group


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WCMS 複驗；selftest 不連線。")
    parser.add_argument("--group", choices=("all", "xsrf", "admin", "selftest"), default="all")
    args = parser.parse_args()
    ErrorResponseSecurityTests.group = args.group
    loader = unittest.TestLoader()
    if args.group == "selftest":
        suite = loader.loadTestsFromTestCase(ResponseDecodingTests)
    else:
        names = loader.getTestCaseNames(ErrorResponseSecurityTests)
        if args.group == "xsrf":
            names = ["test_xsrf_rejections"]
        elif args.group == "admin":
            names = [name for name in names if name != "test_xsrf_rejections"]
        suite = unittest.TestSuite(ErrorResponseSecurityTests(name) for name in names)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
