import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// #region Property
const SERVER_HOME_PATH = "/Server";
const AUTO_REDIRECT_SECONDS = 5;

interface UseServerNotFoundCountdownOptions
{
    /** 倒數初始秒數 */
    initialSeconds: number;

    /** 倒數結束後執行的動作 */
    onFinished: () => void;
}
// #endregion

// #region Public
/** 後台找不到頁面：已登入時提示後，CSR 倒數返回後台首頁 */
export const Server_NotFoundPage = () =>
{
    const location = useLocation();
    const navigate = useNavigate();

    const goServerHome = useCallback((): void =>
    {
        navigate(SERVER_HOME_PATH, { replace: true });
    }, [navigate]);

    const seconds = useServerNotFoundCountdown({
        initialSeconds: AUTO_REDIRECT_SECONDS,
        onFinished: goServerHome,
    });

    return (
        <div className="card">
            <div className="card-body">
                <h3 className="mb-3">找不到後台頁面</h3>

                <p>
                    您要前往的後台頁面不存在，可能是網址錯誤、功能已移除，或資料已被刪除。
                </p>

                <p>
                    <strong>原始網址：</strong>
                    {location.pathname}
                    {location.search}
                </p>

                <p aria-live="polite">
                    {seconds} 秒後將自動返回後台首頁。
                </p>

                <Link to={SERVER_HOME_PATH} className="btn btn-primary">
                    返回後台首頁
                </Link>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** CSR 倒數計時，SSR 不執行 useEffect，因此只會在瀏覽器端自動導頁 */
const useServerNotFoundCountdown = (opt: UseServerNotFoundCountdownOptions): number =>
{
    const [seconds, setSeconds] = useState(opt.initialSeconds);

    useEffect(() =>
    {
        if (seconds <= 0)
        {
            opt.onFinished();
            return;
        }

        const timer = window.setTimeout(() =>
        {
            setSeconds(prev => prev - 1);
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [seconds, opt.onFinished]);

    return seconds;
};
// #endregion
