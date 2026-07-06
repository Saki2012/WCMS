// 原 textarea 改以使用 "AAInputFieldItem" 20260626
import { useEffect, useId, useMemo } from "react";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAInputOption,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
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
    /** 顯示在最上面的空選項。 */
    PlaceholderLabel?: string;
    /** 是否顯示空選項，預設 true。 */
    ShowPlaceholder?: boolean;
    /** 是否啟用可搜尋 select，預設 false。 */
    Searchable?: boolean;
    /** 穩定欄位 key，未傳入時使用 ColumnDisplayName。 */
    FieldKey?: string;
}
// #endregion

// #region Public
/** 下拉選單欄位，使用 AAInputFieldItem 接 selectSingle。 */
export const LibDropList = (prop: ILibDropListProp) =>
{
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const fieldKey = prop.FieldKey ?? prop.ColumnDisplayName;
    const inputId = buildFieldId(baseId, fieldKey);
    const auto = prop.AutoDefaultFirst ?? true;
    const options = useMemo(() => normalizeDropListOptions(prop.Options), [prop.Options]);
    const placeholder = resolvePlaceholderLabel(prop.PlaceholderLabel, prop.ShowPlaceholder);
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        prop.onChange(String(value ?? ""));
    };

    useEffect(() =>
    {
        syncDefaultFirstOption(auto, prop.InputValue, options, prop.onChange);
    }, [auto, prop.InputValue, options, prop.onChange]);

    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <AAInputFieldItem
                    baseId={baseId}
                    variant="gridCell"
                    field={{
                        key: fieldKey,
                        type: "selectSingle",
                        label: prop.ColumnDisplayName,
                        aaLabel: `請選擇${prop.ColumnDisplayName}`,
                        value: prop.InputValue ?? "",
                        options,
                        placeholder,
                        showPlaceholder: prop.ShowPlaceholder ?? true,
                        disabled: prop.disable,
                        searchable: prop.Searchable ?? false,
                        helpText: `${prop.ColumnDisplayName}欄位`,
                    }}
                    onChange={handleChange}
                />
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 將舊 Map options 轉成 AAInputOption，並排除空 key 避免重複 placeholder。 */
const normalizeDropListOptions = (options: Map<string, string>): AAInputOption[] =>
{
    return Array.from(options?.entries() ?? [])
        .filter(([key]) => key !== "")
        .map(([value, label]) => ({ value, label }));
};

/** 依顯示設定取得 placeholder 文字。 */
const resolvePlaceholderLabel = (label?: string, showPlaceholder?: boolean) =>
{
    if (showPlaceholder === false) return undefined;
    return label ?? "請選擇...";
};

/** 判斷目前下拉值是否尚未選取。 */
const isEmptySelectValue = (value?: string | null) =>
{
    return value === null || value === undefined || value === "";
};

/** 當欄位未選取且啟用自動預設時，帶入第一筆 option。 */
const syncDefaultFirstOption = (
    auto: boolean,
    value: string | undefined,
    options: AAInputOption[],
    onChange: (val: string) => void,
) =>
{
    if (!auto) return;
    if (!isEmptySelectValue(value)) return;

    const firstValue = options.find((item) => item.value !== "" && !item.disabled)?.value;
    if (!firstValue || firstValue === value) return;

    onChange(firstValue);
};
// #endregion