import { useEffect, useId } from 'react';

export interface ILibDropListStyle {
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}

interface ILibDropListProp {
    Style: ILibDropListStyle;
    ColumnDisplayName: string;
    Options: Record<string, string>;
    InputValue?: string;
    onChange: (val: string) => void;
    disable?: boolean;
    AutoDefaultFirst?: boolean;
    /** 顯示在最上面的空選項 */
    PlaceholderLabel?: string;
    /** 是否顯示空選項（預設 true） */
    ShowPlaceholder?: boolean;
}


const LibDropList = (prop: ILibDropListProp) => {
    const inputId = useId();

    const auto = prop.AutoDefaultFirst ?? true;

    // 重點：當「目前無值」而且 options 已經有資料，就自動選第一筆
    useEffect(() => {
        // 重點：當「目前無值」而且 options 已經有資料，就自動選第一筆（但要跳過 placeholder）
        if (!auto) return;
        const value = prop.InputValue;
        const nullish = value === null || value === undefined || value === "";
        if (!nullish) return;
        const keys = Object.keys(prop.Options ?? {});
        const firstKey = keys.find((k) => k !== ""); // 跳過空值
        if (!firstKey) return;
        if (firstKey === value) return;
        prop.onChange(firstKey);
    }, [auto, prop.InputValue, prop.Options, prop.onChange]);

    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <select id={inputId} className={prop.Style.OptionsStyle} value={prop.InputValue ?? ""} onChange={(e) => prop.onChange(e.target.value)} disabled={prop.disable}>
                    {(prop.ShowPlaceholder ?? true) && (<option value="">{prop.PlaceholderLabel ?? "請選擇..."}</option>)}
                    {Object.entries(prop.Options ?? {}).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default LibDropList;