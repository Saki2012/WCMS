import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserAPI } from '../../../../../SysCore/Utils/API/UserAPI';
import { AuthAPI } from '../../../../../SysCore/Utils/API/AuthClient';




/** 介面：表單資料 */
export interface IRegisterForm {
  account: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** 確保 legacy 背景腳本載入一次（若你已在 index.html 全域載入，可刪掉這段） */
const ensureLegacyBgLoaded = (): void => {
  if (document.getElementById('legacy-bg-script')) return;
  const s = document.createElement('script');
  // ↓ 請改成你實際打包後的 legacy 路徑
  s.src = '/Legacy/ContentBack/bg_dynamic/login-particles.js';
  s.id = 'legacy-bg-script';
  s.defer = true;
  document.body.appendChild(s);
};

export const RegisterPage: React.FC = () => {
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState<IRegisterForm>({
    account: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const pwdMismatch =
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password !== form.confirmPassword;

  const canSubmit =
    form.account.trim() &&
    form.userName.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.confirmPassword.trim() &&
    !pwdMismatch &&
    !submitting;

  const onChange =
    (key: keyof IRegisterForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((s) => ({ ...s, [key]: e.target.value }));

  useEffect(() => {
    // 有 #particles-js 才會啟動背景；確保 legacy 腳本有載到
    ensureLegacyBgLoaded();
  }, []);


  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);

    if (pwdMismatch) {
      setErr('密碼與再次輸入密碼不一致');
      return;
    }

    try {
      setSubmitting(true);

      // 1) 送註冊：/Service/User/Create
      await UserAPI.create({
        UserId: form.account.trim(),
        UserName: form.userName.trim(),
        Email: form.email.trim(),
        Password: form.password,
      });

      // 2) 註冊成功 → 直接用帳密自動登入（/Service/Auth/Login）
      await AuthAPI.login({ account: form.account.trim(), password: form.password });

      // 3) 登入成功 → 導向回想去的頁面或後台首頁
      const to: string = (loc.state as any)?.from?.pathname ?? '/Server';
      nav(to, { replace: true });
    } catch (ex: any) {
      setErr(ex?.response?.data ?? '註冊或自動登入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="template-layout">
      {/* 背景動畫容器（legacy 會偵測這個 ID） */}
      <div id="particles-js" />
      <span className="shape-right + animation-active + animate__animated animate__slideInRight" />

      <section className="Register-section loaded">
        <div className="container">
          <div className="content-wrap">
            <div className="form-content animate__animated animate__fadeInUp delay__125">
              <div className="page-switcher">
                <div className="page-title mr-3">會員註冊 Register</div>
                <ul className="switcher-wrap">
                  <li>
                    <Link to="/Server/Login" className="switcher-btn">
                      會員登入 Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 關閉瀏覽器自動填入；避免帶入使用者名稱/密碼 */}
              <form
                className="main-form"
                onSubmit={onSubmit}
                noValidate
                autoComplete="off"
              >
                <div className="Basic_InfoBOX">
                  <div className="row">
                    <div className="col-sm-12">
                      <div className="inner-wrap mb-4">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <h5 className="font-weight-bold d-inline mb-0">基本資料</h5>
                            <span className="text-danger">　* 必填</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    {/* 帳號 */}
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                      <div className="inner-wrap">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <input
                              id="Account"
                              name="Account"              // 刻意不用 username，降低瀏覽器自動填入機率
                              type="text"
                              className="form-control"
                              value={form.account}
                              onChange={onChange('account')}
                              required
                              autoComplete="off"
                              inputMode="text"
                            />
                            <label className="i-label" htmlFor="Account">
                              <span className="text-danger">*</span> 帳號
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 使用者名稱 */}
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                      <div className="inner-wrap">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <input
                              id="UserName"
                              name="UserName"
                              type="text"
                              className="form-control"
                              value={form.userName}
                              onChange={onChange('userName')}
                              required
                              autoComplete="off"
                              inputMode="text"
                            />
                            <label className="i-label" htmlFor="UserName">
                              <span className="text-danger">*</span> 使用者名稱
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                      <div className="inner-wrap">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <input
                              id="Email"
                              name="Email"
                              type="email"
                              className="form-control"
                              value={form.email}
                              onChange={onChange('email')}
                              required
                              autoComplete="off"
                              inputMode="email"
                            />
                            <label className="i-label" htmlFor="Email">
                              <span className="text-danger">*</span> Email
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 密碼 */}
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                      <div className="inner-wrap">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <input
                              id="Password"
                              name="NewPassword"        // 不用 password；用 new-password 讓瀏覽器別帶舊值
                              type="password"
                              className="form-control"
                              value={form.password}
                              onChange={onChange('password')}
                              required
                              autoComplete="new-password"
                              aria-invalid={pwdMismatch ? 'true' : undefined}
                            />
                            <label className="i-label" htmlFor="Password">
                              <span className="text-danger">*</span> 使用者密碼
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 再次確認密碼 */}
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                      <div className="inner-wrap">
                        <div className="Form-DivBox">
                          <div className="form-group m-0">
                            <input
                              id="ConfirmPassword"
                              name="ConfirmNewPassword"
                              type="password"
                              className="form-control"
                              value={form.confirmPassword}
                              onChange={onChange('confirmPassword')}
                              required
                              autoComplete="new-password"
                              aria-invalid={pwdMismatch ? 'true' : undefined}
                            />
                            <label className="i-label" htmlFor="ConfirmPassword">
                              <span className="text-danger">*</span> 再次確認密碼
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(err || pwdMismatch) && (
                    <div className="row">
                      <div className="col-12">
                        <div className="inner-wrap">
                          <div className="Form-DivBox">
                            <div
                              className="form-group m-0"
                              role="alert"
                              aria-live="polite"
                              style={{ color: '#d9534f', paddingTop: 8 }}
                            >
                              {pwdMismatch ? '密碼與再次輸入密碼不一致' : err}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 按鈕列 */}
                <div className="ButtonBOX my-4">
                  <div className="row">
                    <div className="col-md-6 col-sm-12 col-12">
                      <div className="Form-DivBox">
                        <div className="form-group">
                          <button type="submit" className="btn-fill w-100" disabled={!canSubmit}>
                            {submitting ? '送出中…' : '確認註冊 Register'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12 col-12">
                      <div className="Form-DivBox">
                        <div className="form-group">
                          <Link to="/Server/Login" className="w-100" role="button" title="取消返回">
                            <button type="button" className="btn-fill w-100">取消返回 Cancel</button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
      </section>

      <section className="loginRegister-footer + animate__animated animate__fadeInUp delay__275">
        <div className="container">
          <div className="content-wrap">
            <div className="col-12 d-flex justify-content-sm-center justify-content-start px-3 my-2">
              <ul className="nav">
                <li className="nav-item mr-3">聯絡電話：02-2222-8888</li>
                <li className="nav-item">信箱：abc@gmail.com</li>
              </ul>
            </div>
            <div className="col-12 d-flex justify-content-sm-center justify-content-start px-3">
              <p className="mb-2">
                Copyright &copy; 2024 - 後台管理系統　|　design by <a href="#">it-easygo.</a>　|
                <Link to="/Server/Login">管理者登入</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
