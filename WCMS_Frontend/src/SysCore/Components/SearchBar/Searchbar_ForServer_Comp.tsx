import { useCallback, useId, useState, type ReactNode } from "react";

export interface SearchBarProps {
    /** 標題 */
    title: string;
    /** placeholder */
    subTitle: string;
    /** 額外搜尋欄位 */
    extraFields?: ReactNode;

    /** 受控/非受控 */
    keyword?: string;
    defaultKeyword?: string;
    paramName?: string;
    action?: string;
    method?: "get" | "post";
    onChange?: (kw: string) => void;
    onSubmit?: (kw: string) => void;
    onReset?: () => void;
}

export const SEARCH_PARAM = "q" as const;

export const LibSearchBar: React.FC<SearchBarProps> = (prop) =>
{
    const id = useId();
    const isControlled = typeof prop.keyword === "string";
    const [kw, setKw] = useState<string>(prop.defaultKeyword ?? "");
    const value = isControlled ? (prop.keyword as string) : kw;
    const name = prop.paramName ?? SEARCH_PARAM;
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const v = e.target.value;
        if (!isControlled) setKw(v);
        prop.onChange?.(v);
    }, [isControlled, prop.onChange]);
    const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) =>
    {
        const v = (isControlled ? (prop.keyword ?? "") : kw).trim();
        e.preventDefault();
        prop.onSubmit?.(v);
    }, [isControlled, prop.keyword, kw, prop.onSubmit]);
    const handleReset = useCallback(() =>
    {
        if (!isControlled) setKw("");
        prop.onReset?.();
    }, [isControlled, prop.onReset]);
    return (
        <form role="search" aria-label="資料搜尋" action={prop.action ?? "/search"} method={prop.method ?? "get"} onSubmit={handleSubmit} onReset={handleReset}>
            <div id="div_Search" className="col-sm-12 col-12 mb-4">
                <div className="row mx-0">
                    <div className="col-sm-12 col-12 form-group">
                        <div className="row mx-0">
                            <label htmlFor={`${id}-site-search`} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                                搜尋
                            </label>
                            <div className="col-md-4 col-sm-12 float-md-left float-sm-none">
                                <input
                                    id={`${id}-site-search`}
                                    name={name}
                                    type="search"
                                    className="form-control"
                                    placeholder={prop.subTitle || "關鍵字 ..."}
                                    value={value}
                                    onChange={handleChange}
                                    autoComplete="search"
                                    enterKeyHint="search"
                                    inputMode="search"
                                />
                            </div>
                        </div>
                        {prop.extraFields && (
                            <div aria-label="搜尋附加條件">
                                {prop.extraFields}
                            </div>
                        )}
                            <div className="row mx-0">
                                <div className="offset-md-2 col-md-4 col-sm-12 px-0 mt-3 text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-custom btn-rounded" onClick={handleReset}>
                                            重置
                                        </button>
                                        <button type="submit" className="btn btn-custom btn-rounded">
                                            搜尋
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </form>
    );
};