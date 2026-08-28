# Backend Cookie Platform Capability

`SysCore/PlatformServices/Cookies` 管理 Server-issued Cookie 的「實例、用途與生命週期」；`SysCore/Security/Hardening` 管理 Cookie 的「安全傳輸政策與最終 Enforcement」。

## Responsibility

```text
Feature / Domain
→ Cookie Capability
→ CookieDefinition
→ CookieService
→ ASP.NET Response Cookie Pipeline
→ Security/Hardening/CookieSecurityPolicy
→ CookiePolicy Middleware
→ Browser Set-Cookie
```

### PlatformServices/Cookies

負責：

- Cookie Name。
- Value 的建立／讀取來源。
- HttpOnly、IsEssential、Path、Domain 等角色屬性。
- Expires／Lifetime 等業務生命週期。
- Read／Write／Delete 共用入口。

不負責：

- SameSite 的最終安全等級。
- Production Secure 基準。
- Lax／None 例外核准。

### Security/Hardening

負責：

- `DefaultStrict`。
- `NavigationLax` Named Exception。
- `ExplicitCrossSite` Exception。
- Production Secure 基準。
- Append／Delete 的 Middleware 最終 Enforcement。

## Current Cookie Capabilities

```text
Cookies
├─ CookieDefinition.cs
├─ CookieService.cs
├─ Visitor
│  ├─ VisitorCookieDefinitions.cs
│  └─ VisitorCookieService.cs
└─ Xsrf
   ├─ XsrfCookieDefinitions.cs
   └─ XsrfCookieService.cs
```

### Visitor

`wcms.visitor` 是匿名 Browser Visitor Identity，供 SiteViewCount 與公開 FileManagement 計次／去重共用。Visitor Capability 管理 GUID 與一年期生命週期；SameSite／Secure 由 Security Policy 決定。

### XSRF Request Token

`XSRF-TOKEN` 是 Browser JavaScript 可讀取並回送 `X-XSRF-TOKEN` Header 的 Request Token，因此 `HttpOnly=false` 是其功能契約；SameSite／Secure 仍由中央 Security Policy 決定。

ASP.NET Core 內部 `__Host-WCMS-Antiforgery` Cookie 由 Antiforgery Framework 建立與管理，因此其 Framework Configuration 留在 `Security/Hardening`，不另建立平行的 Platform Cookie Lifecycle。

## Authentication Cookie Boundary

`access` 與 `rtid` 雖使用共用 `CookieService` 寫入，但其生命週期直接屬於 JWT Authentication、Refresh Rotation 與 Logout，因此 `AuthCookieDefinitions`／`AuthCookieService` 保留在 `Security/IdentityAccess/Authentication`，不為了目錄集中而拆散 Authentication Domain。

Cookie Instance 的 Business Role 與 Security Profile 是兩個不同維度；不得依 `Strict`／`Lax`／`None` 將 Business Cookie 分類到不同功能目錄。
