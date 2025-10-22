import { useCallback, useId, useState } from "react";

export interface SearchBarProps {
    /** 標題（label） */
    title: string;
    /** 輸入框 placeholder */
    subTitle: string;
    /** 右側設定區標題（保留欄位，供之後擴充） */
    settingTitle?: string;
    /** —— 受控/非受控 兼容 —— */
    /** 受控值：若提供則改為受控模式（外部主導），不提供則走內部 useState */
    keyword?: string;
    /** 非受控初始值：只在第一次掛載時吃進來 */
    defaultKeyword?: string;
    /** URL 參數名稱（GET） */
    paramName?: string; // 預設 'q'
    /** SSR/無 JS 的 action 與 method（SPA 會 e.preventDefault） */
    action?: string;
    method?: "get" | "post";
    /** 回呼（可選）：若想在 SPA 內攔截搜尋而不換頁，就傳這些 */
    onChange?: (kw: string) => void;
    onSubmit?: (kw: string) => void;
    onReset?: () => void;
}

/** 共用常數：預設使用的查詢參數名 */
export const SEARCH_PARAM = "q" as const;

/** 可以獨立工作（GET），也可透過回呼交還 keyword */
export const LibSearchBar: React.FC<SearchBarProps> = (prop) => {
    const id = useId();
    const isControlled = typeof prop.keyword === "string";
    const [kw, setKw] = useState<string>(prop.defaultKeyword ?? "");
    const value = isControlled ? (prop.keyword as string) : kw;
    const name = prop.paramName ?? SEARCH_PARAM;

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            if (!isControlled) setKw(v);               // 🟩 內部維護狀態（非受控時）
            prop.onChange?.(v);                        // 🟩 外部若想聽變化，也能接收到
        },
        [isControlled, prop.onChange]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // SPA 預設攔截（外面若沒傳 onSubmit，仍會因為有 action/method 而是「可漸進增強」的）
            e.preventDefault();
            const v = (isControlled ? (prop.keyword ?? "") : kw).trim();
            prop.onSubmit?.(v);                        // 🟩 有回呼就回傳 keyword 給外層使用
            // 🟡 若想支援「沒回呼也要 GET 導頁」，可在沒有 onSubmit 時移除 e.preventDefault()
            //   → 目前專案多為 SPA，保留攔截較安全。需要我可幫你加成可切換模式。
        },
        [isControlled, prop.keyword, kw, prop.onSubmit]
    );

    const handleReset = useCallback(() => {
        if (!isControlled) setKw("");                // 🟩 清空內部狀態
        prop.onReset?.();                            // 🟩 通知外層（若需要同步清其他條件）
    }, [isControlled, prop.onReset]);

    return (
        <form role="search" aria-label="資料搜尋" action={prop.action ?? "/search"} method={prop.method ?? "get"} onSubmit={handleSubmit} onReset={handleReset}>
            <div id="div_Search" className="col-sm-12 col-12 mb-4">
                <div className="row mx-0">
                    <div className="col-md-6 col-sm-12 float-md-left float-sm-none form-group">
                        <label htmlFor={`${id}-site-search`} className="col-md-3 col-sm-12 float-md-left float-sm-none col-form-label">
                            {prop.title}
                        </label>
                        <div className="col-md-9 col-sm-12 float-md-left float-sm-none">
                            <div className="input-group search-box">
                                <input id={`${id}-site-search`} name={name} type="search" className="form-control" placeholder={prop.subTitle}
                                    value={value} onChange={handleChange} autoComplete="search" enterKeyHint="search" inputMode="search" />
                                <button type="submit" className="btn btn-custom btn-rounded btn-search">
                                    <i className="far fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};
