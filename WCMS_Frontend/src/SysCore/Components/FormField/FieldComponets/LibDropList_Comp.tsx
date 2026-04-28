import { useEffect, useId } from "react";

export interface ILibDropListStyle
{
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}

interface ILibDropListProp
{
    Style: ILibDropListStyle;
    ColumnDisplayName: string;
    Options: Map<string, string>;
    InputValue?: string;
    onChange: (val: string) => void;
    disable?: boolean;
    AutoDefaultFirst?: boolean;
    /** 顯示在最上面的空選項 */
    PlaceholderLabel?: string;
    /** 是否顯示空選項（預設 true） */
    ShowPlaceholder?: boolean;
}

const LibDropList = (prop: ILibDropListProp) =>
{
    // 宣告變數
    const inputId = useId();
    const auto = prop.AutoDefaultFirst ?? true;
    useEffect(() =>
    {
        // 宣告變數：當「目前無值」而且 options 已經有資料，就自動選第一筆（但要跳過空值）
        if (!auto) return;
        const value = prop.InputValue;
        const nullish = value === null || value === undefined || value === "";
        if (!nullish) return;
        const firstKey = Array.from(prop.Options?.keys() ?? []).find((k) => k !== "");
        if (!firstKey) return;
        if (firstKey === value) return;
        // 執行 function
        prop.onChange(firstKey);
    }, [auto, prop.InputValue, prop.Options, prop.onChange]);
    // return
    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <select
                    id={inputId}
                    className={prop.Style.OptionsStyle}
                    value={prop.InputValue ?? ""}
                    onChange={(e) => prop.onChange(e.target.value)}
                    disabled={prop.disable}
                >
                    {(prop.ShowPlaceholder ?? true) && <option value="">{prop.PlaceholderLabel ?? "請選擇..."}</option>}

                    {Array.from(prop.Options?.entries() ?? []).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
            </div>
        </>
    );
};

export default LibDropList;
