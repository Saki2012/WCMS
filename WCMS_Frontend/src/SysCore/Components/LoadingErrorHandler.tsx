import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// #region Property
type Props = {
    isLoading: boolean;
    errorList: (string | null | undefined)[];
    children?: ReactNode;
};

const LIGHT_LOADING_DELAY_MS = 200;
const FULL_LOADING_DELAY_MS = 500;
// #endregion

// #region Public
/** 統一處理 Loading / Error，並在載入期間保留內容區塊避免畫面跳動。 */
export const LoadingErrorHandler = (prop: Props) =>
{
    const error = prop.errorList.find(Boolean);
    const loadingState = useLoadingDisplayState(prop.isLoading);

    if (error)
    {
        return <div style={{ color: "red" }}>❌ 錯誤：{error}</div>;
    }

    return (
        <div style={buildLoadingWrapperStyle()} aria-busy={prop.isLoading}>
            <div style={buildContentStyle(prop.isLoading)}>
                {prop.children}
            </div>

            {loadingState.showLoading && (
                <div role="status" aria-live="polite" style={buildLoadingOverlayStyle()}>
                    {loadingState.showFullLoading ? "📦 資料載入中..." : "🔄 載入中..."}
                </div>
            )}
        </div>
    );
};
// #endregion

// #region Private
/** 控制 Loading 顯示時機，避免短時間請求造成閃爍。 */
const useLoadingDisplayState = (isLoading: boolean) =>
{
    const [showLightLoading, setShowLightLoading] = useState(false);
    const [showFullLoading, setShowFullLoading] = useState(false);

    useEffect(() =>
    {
        if (!isLoading)
        {
            setShowLightLoading(false);
            setShowFullLoading(false);
            return;
        }

        const lightTimer = setTimeout(() => setShowLightLoading(true), LIGHT_LOADING_DELAY_MS);
        const fullTimer = setTimeout(() => setShowFullLoading(true), FULL_LOADING_DELAY_MS);

        return () =>
        {
            clearTimeout(lightTimer);
            clearTimeout(fullTimer);
        };
    }, [isLoading]);

    return {
        showLoading: isLoading && showLightLoading,
        showFullLoading: isLoading && showFullLoading,
    };
};

/** 建立 Loading 外層容器樣式。 */
const buildLoadingWrapperStyle = (): CSSProperties =>
{
    return {
        position: "relative",
        minHeight: "80px",
    };
};

/** 建立 Loading 期間內容區塊樣式。 */
const buildContentStyle = (isLoading: boolean): CSSProperties =>
{
    return {
        opacity: isLoading ? 0.55 : 1,
        pointerEvents: isLoading ? "none" : "auto",
        transition: "opacity 180ms ease",
    };
};

/** 建立 Loading 浮層樣式。 */
const buildLoadingOverlayStyle = (): CSSProperties =>
{
    return {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        background: "rgba(255, 255, 255, 0.55)",
        pointerEvents: "none",
    };
};
// #endregion
