"""WCMS 已部署測試環境的錯誤回應回歸測試；不輸出憑證或 Cookie 值。"""
import os
import unittest
from http.cookies import SimpleCookie
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


class NoRedirect(HTTPRedirectHandler):
    """避免登入轉址或跨站轉址掩蓋實際 API 狀態碼。"""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class ErrorResponseSecurityTests(unittest.TestCase):
    """透過對外 HTTPS 入口驗證錯誤標頭、Cookie 與診斷端點存取限制。"""

    @classmethod
    def setUpClass(cls):
        cls.base = os.environ.get("WCMS_VERIFY_BASE_URL", "").rstrip("/")
        cls.authorization = os.environ.get("WCMS_VERIFY_AUTHORIZATION", "")
        cls.cookie = os.environ.get("WCMS_VERIFY_COOKIE", "")
        parsed = urlsplit(cls.base)
        if (parsed.scheme != "https" or not parsed.netloc or parsed.username
                or parsed.password or parsed.query or parsed.fragment):
            raise RuntimeError("WCMS_VERIFY_BASE_URL 必須是測試站 HTTPS 根網址，可包含應用程式基底路徑。")
        if not (cls.authorization or cls.cookie):
            raise RuntimeError("請以環境變數提供測試管理者 Authorization 或 Cookie。")
        cls.client = build_opener(NoRedirect())

    def request_case(self, name, authenticated=True, verification=True):
        headers = {}
        if authenticated:
            if self.authorization:
                headers["Authorization"] = self.authorization
            if self.cookie:
                headers["Cookie"] = self.cookie
        if verification:
            headers["X-WCMS-Security-Verification"] = "SameSite500"
        request = Request(self.base + "/Service/Diagnostics/SameSite500/" + name, headers=headers)
        try:
            response = self.client.open(request, timeout=30)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read().decode("utf-8", errors="replace")

    def assert_error_headers(self, headers):
        expected = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            "Referrer-Policy": "no-referrer",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "X-Permitted-Cross-Domain-Policies": "none",
        }
        for name, value in expected.items():
            self.assertEqual(headers.get(name), value, name)
        self.assertIn("default-src 'none'", headers.get("Content-Security-Policy", ""))
        self.assertIn("no-store", headers.get("Cache-Control", "").lower())
        self.assertEqual(headers.get("Pragma"), "no-cache")
        for name in ("X-Powered-By", "X-AspNet-Version", "X-AspNetMvc-Version"):
            self.assertIsNone(headers.get(name), name)

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
