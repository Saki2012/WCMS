// Features/Server/Pages/LoginPage.tsx
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../../../../../SysCore/Utils/API/AuthClient';

export default function LoginPage() {
  const [account, setAccount] = useState('');      // HTML 的 email 欄位 -> 後端 account
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);   // 眼睛切換（不靠 DOM 操作）
  const [remember, setRemember] = useState(false); // 保持登入（先保留，不強制實作）
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nav = useNavigate();
  const loc = useLocation() as any;


  const ACCOUNT_MIN = 3;
  const ACCOUNT_MAX = 20;
  // 若帳號是 email 就改用  type="email"  不要 pattern
  const ACCOUNT_PATTERN = /^[A-Za-z0-9._-]+$/; // 依規格調整
  const PWD_MIN = 3;
  const PWD_MAX = 64;


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                 // 防止直接導航
    if (submitting) return;             // 避免重複送出
    setErr(null);
    setSubmitting(true);
    try {

      // 前端最終防線（避免被繞過）
      if (account.length < ACCOUNT_MIN || account.length > ACCOUNT_MAX || !ACCOUNT_PATTERN.test(account)) {
        setErr(`帳號需為 ${ACCOUNT_MIN}–${ACCOUNT_MAX} 碼，僅可含英數與 . _ -`);
        return;
      }
      if (password.length < PWD_MIN || password.length > PWD_MAX) {
        setErr(`密碼需為 ${PWD_MIN}–${PWD_MAX} 碼`);
        return;
      }
      // 這裡會真的打到後端 /Service/Auth/Login
      await AuthAPI.login({ account, password });

      const locState = (loc as any).state;
      const from = locState?.from?.pathname as string | undefined;
      const isSafe = from && !from.startsWith('/Server/Logout') && !from.startsWith('/Server/Login');
      const to = isSafe ? from : '/Server';
      nav(to, { replace: true });       // 只有成功才導頁
    } catch (ex: any) {
      const msg = ex?.response?.data?.message ?? '登入失敗，請檢查帳號或密碼';
      setErr(msg);                      // 失敗不導頁，顯示錯誤
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main" aria-labelledby="loginTitle">
      {/* SEO：登入頁不需索引 */}
      <meta name="robots" content="noindex,nofollow" />
      {/* <a className="skip-link" href="#form">跳到登入表單</a> */}

      {/* ==== 以下為以公司 HTML 為藍本的 JSX（移除內嵌 script，保留 class 結構） ==== */}
      <div className="template-layout">
        {/* 背景動畫容器（交由 legacy JS 處理） */}
        <div id="particles-js" aria-hidden="true" />

        <span className="shape-left + animation-active + animate__animated animate__slideInLeft" aria-hidden="true" />

        <section className="Login-section loaded">
          <div className="container-customize1">
            <div className="content-wrap">

              <div className="heading-content + animate__animated animate__fadeInUp delay__015">
                <div className="inner-wrap">
                  <div className="+ animate__animated animate__fadeInUp delay__05">
                    {/* LOGO：若要內部導向可改 <Link>；此處保留外部連結 */}
                    <Link to="/" className="logo" title="國際暢行科技 LOGO" target="_blank" rel="noreferrer">
                      <h1 id="loginTitle"><img src="/Legacy/Server/images/logo/logo_PC_640x192.svg" alt="國際暢行科技 LOGO" /></h1>
                    </Link>
                  </div>

                  <div className="+ animate__animated animate__fadeInUp delay__075">
                    <h2 className="main-title">後台管理系統</h2>
                  </div>

                </div>
              </div>

              <div className="form-content + animate__animated animate__fadeInUp delay__125">
                <div className="page-switcher" aria-label="登入與註冊切換">
                  <div className="page-title mr-3 + animate__animated animate__fadeInRight delay__15">會員登入 Login</div>
                  <ul className="switcher-wrap + animate__animated animate__fadeInRight delay__175">
                    {/* 內部路由導向註冊頁（之後我們會實作 /Server/Register） */}
                    <li><Link to="/Server/Register" className="switcher-btn">會員註冊 Register</Link></li>
                  </ul>
                </div>

                <div className="main-form">
                  <div className="inner-wrap">
                    {/* AA：role=form、aria-describedby 指向錯誤訊息 */}
                    <form id="form" role="form" onSubmit={onSubmit} aria-describedby={err ? 'loginError' : undefined}>
                      <div className="Form-DivBox">
                        <div className="row">
                          <div className="col-sm-12 + animate__animated animate__fadeInRight delay__175">
                            <div className="form-group m-0">
                              <input
                                id="account"
                                type="text"
                                className="form-control"
                                name="account"
                                autoComplete="username"
                                required
                                value={account}
                                onChange={e => setAccount(e.target.value)}
                                placeholder=""
                                aria-label="帳號 Account"
                              />
                              <label className="i-label" htmlFor="email">帳號 Account</label>
                            </div>
                          </div>

                          <div className="col-sm-12 + animate__animated animate__fadeInRight delay__2">
                            <div className="form-group m-0" style={{ position: 'relative' }}>
                              <input
                                id="password"
                                type={showPwd ? 'text' : 'password'}
                                className="form-control"
                                name="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder=""
                                aria-label="密碼 Password"
                              />
                              <label className="i-label" htmlFor="password">密碼 Password</label>

                              {/* 眼睛按鈕：button + aria-pressed */}
                              <button
                                type="button"
                                className="eye-btn"
                                aria-label={showPwd ? '隱藏密碼' : '顯示密碼'}
                                aria-pressed={showPwd}
                                onClick={() => setShowPwd(v => !v)}
                                style={{ right: 3, }}
                              >
                                <span className="material-symbols-outlined">{showPwd ? 'visibility' : 'visibility_off'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="col-sm-12 + animate__animated animate__fadeInRight delay__225">
                            <div className="form-group">
                              <div className="checkbox-wrap">
                                <div className="checkbox-box mr-3">
                                  <input
                                    id="checkbox1"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={e => setRemember(e.target.checked)}
                                  />
                                  <label htmlFor="checkbox1" className="pl-4">保持登入狀態</label>
                                </div>
                                {/* 忘記密碼之後可接內部 modal 或路由 */}
                                <button type="button" className="switcher-text btn btn-link p-0">Forgot Password</button>
                              </div>
                            </div>
                          </div>

                          <div className="col-sm-12 + animate__animated animate__fadeInRight delay__25">
                            <div className="form-group">
                              {/* 重要：用 submit button，避免 <a><button/></a> 導致無障礙與表單無法提交 */}
                              <button id="loginBtn" type="submit" className="btn-fill w-100" title="登入">{submitting ? '登入中…' : '登入 Log in'}</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AA：錯誤訊息（role=alert） */}
                      {err && (
                        <div id="loginError" role="alert" aria-live="assertive" className="mt-2">
                          {err}
                        </div>
                      )}
                    </form>

                    <div className="switcher-description + animate__animated animate__fadeInRight delay__275">
                      沒有帳戶？&nbsp;&nbsp;<Link to="/Server/Register" className="switcher-text ms-1">Register</Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>{/* // content-wrap */}
          </div>
        </section>

        <section className="loginRegister-footer + animate__animated animate__fadeInUp delay__275">
          <div className="container px-0">
            <div className="content-wrap">
              <div className="col-12 d-flex justify-content-sm-center justify-content-start px-3">
                <p className="mb-2">
                  Copyright © 2025 - 後台管理系統　|　design by <a href="#">it-easygo.</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {submitting && (
        <div aria-live="polite" role="status"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
          <div className="loading" style={{
            padding: '12px 16px', background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            正在登入，請稍候…
          </div>
        </div>
      )}
    </main>
  );
}
