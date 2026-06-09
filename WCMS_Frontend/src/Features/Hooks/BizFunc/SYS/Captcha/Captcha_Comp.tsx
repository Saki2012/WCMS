import { useId, useMemo } from "react";
import { type CaptchaController } from "./Captcha_Hook";
import { CaptchaTurnstile_Comp, type CaptchaTurnstileProps } from "./CaptchaTurnstile_Comp";

// #region Property
type CaptchaTurnstileOption = Pick<CaptchaTurnstileProps, "action" | "cData" | "theme" | "size" | "tabIndex" | "language" | "nonce">;
interface CaptchaCompProps
{
    captcha: CaptchaController;
    className?: string;
    titleText?: string;
    hintText?: string;
    requiredText?: string;
    turnstile?: CaptchaTurnstileOption;
}
// #endregion

// #region Public
/** Captcha 共用欄位元件，頁面只需負責擺放位置與送出流程 */
export const Captcha_Comp = (props: CaptchaCompProps) =>
{
    const id = useId();
    const titleId = `${id}-title`;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const titleText = props.titleText ?? "驗證碼";
    const hintText = props.hintText ?? "請完成驗證後再送出。";
    const requiredText = props.requiredText ?? "必填";
    const errorText = useMemo(() => getDisplayErrorText(props.captcha), [props.captcha]);
    const describedBy = useMemo(() => [hintId, errorText ? errorId : null].filter((x): x is string => Boolean(x)).join(" "), [hintId, errorId, errorText]);
    if (!props.captcha.config.isEnabled && !props.captcha.isLoading) return null;
    return (
        <fieldset
            ref={props.captcha.rootRef}
            className={props.className ?? "mb-3"}
            tabIndex={-1}
            aria-labelledby={titleId}
            aria-describedby={describedBy}
            aria-invalid={Boolean(errorText)}
        >
            <legend id={titleId} className="form-label mb-1">
                {titleText}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
                <span className="visually-hidden">{requiredText}</span>
            </legend>
            <p id={hintId} className="form-text mb-2">{hintText}</p>
            {props.captcha.isLoading && <p className="form-text mb-2" aria-live="polite">驗證碼設定載入中。</p>}
            {!props.captcha.isLoading && props.captcha.config.canRender && (
                <CaptchaTurnstile_Comp
                    siteKey={props.captcha.config.siteKey}
                    resetKey={props.captcha.resetKey}
                    describedBy={describedBy}
                    action={props.turnstile?.action}
                    cData={props.turnstile?.cData}
                    theme={props.turnstile?.theme}
                    size={props.turnstile?.size}
                    tabIndex={props.turnstile?.tabIndex}
                    language={props.turnstile?.language}
                    nonce={props.turnstile?.nonce}
                    onTokenChange={props.captcha.handleTokenChange}
                    onExpired={props.captcha.handleExpired}
                    onError={props.captcha.handleError}
                />
            )}
            {!props.captcha.isLoading && props.captcha.config.isEnabled && !props.captcha.config.canRender && (
                <p className="text-danger small mb-0" role="alert">{props.captcha.config.messageText ?? "驗證碼設定異常。"}</p>
            )}
            {errorText && <p id={errorId} className="text-danger small mt-2 mb-0" role="alert" aria-live="polite">{errorText}</p>}
        </fieldset>
    );
};
// #endregion

// #region Private
/** 取得畫面要顯示的 Captcha 錯誤訊息 */
const getDisplayErrorText = (captcha: CaptchaController): string | null =>
{
    if (captcha.validationErrorText) return captcha.validationErrorText;
    if (captcha.configErrorText) return captcha.configErrorText;
    return null;
};
// #endregion
