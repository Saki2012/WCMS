import { useEffect, useId } from 'react';

export interface ILibDropListStyle {
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}

interface ILibDropListProp {
    Style: ILibDropListStyle;
    ColumnDisplayName: string;
    Options?: Record<string, string>;
    InputValue?: string;
    onChange: (val: string) => void;
    AutoDefaultFirst?: boolean;
}


const LibDropList = (prop: ILibDropListProp) => {
    const inputId = useId();

    const auto = prop.AutoDefaultFirst ?? true;

    // 重點：當「目前無值」而且 options 已經有資料，就自動選第一筆
    useEffect(() => {
        if (!auto) return;
        const nullish = prop.InputValue === null || prop.InputValue === undefined || prop.InputValue === "";
        const firstKey = Object.keys(prop.Options ?? {})[0];
        if (nullish && firstKey !== undefined) {
            prop.onChange?.(firstKey); // 交給外層（setField）寫回 formData
        }
    }, [auto, prop.InputValue, prop.Options, prop.onChange]);

    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <select id={inputId} className={prop.Style.OptionsStyle} value={prop.InputValue ?? ""} onChange={(e) => prop.onChange(e.target.value)}>
                    {prop.Options && Object.entries(prop.Options).map(([key, label]) => {
                        if (key === "") { return (<option selected>{label}</option>); }
                        else { return (<option key={key} value={key}>{label}</option>); }
                    })}
                </select>
            </div>
        </>
    );
}

export default LibDropList;