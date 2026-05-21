import type { SearchCustomSlots, SearchDateRangeValue, SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import { useEffect, useMemo, useState } from "react";

export interface ServerSearchBarCompProps
{
    /** 搜尋欄位設定 */
    fields: SearchFieldConfig[];

    /** 已送出的搜尋值 */
    submittedValues: SearchValues;

    /** 送出搜尋值 */
    onSubmit: (values: SearchValues) => void;

    /** 重置搜尋值 */
    onReset: () => void;

    /** 客製欄位渲染插槽 */
    customSlots?: SearchCustomSlots;

    /** 搜尋區塊 aria-label */
    ariaLabel?: string;

    /** 搜尋區塊標題 */
    title?: string;
}

interface SearchFieldRendererProps
{
    /** 欄位設定 */
    field: SearchFieldConfig;

    /** 欄位目前值 */
    value: SearchValue;

    /** 欄位值變更 */
    onChange: (value: SearchValue) => void;

    /** 客製欄位渲染插槽 */
    customSlots?: SearchCustomSlots;
}

/** 後台動態搜尋列 */
export const Server_SearchBar_Comp = (props: ServerSearchBarCompProps) =>
{
    const [draftValues, setDraftValues] = useState<SearchValues>(props.submittedValues);

    useEffect(() =>
    {
        setDraftValues(props.submittedValues);
    }, [props.submittedValues]);

    const hasFields = useMemo(() => props.fields.length > 0, [props.fields]);

    /** 設定指定欄位值 */
    const setFieldValue = (key: string, value: SearchValue): void =>
    {
        setDraftValues(prev => ({ ...prev, [key]: value }));
    };

    /** 送出搜尋資料 */
    const submitSearch = (): void =>
    {
        props.onSubmit(normalizeSearchValues(draftValues));
    };

    /** 重置搜尋資料 */
    const resetSearch = (): void =>
    {
        setDraftValues({});
        props.onReset();
    };

    if (!hasFields) return null;

    return (
        <form
            role="search"
            aria-label={props.ariaLabel ?? "資料搜尋"}
            onSubmit={(e) =>
            {
                e.preventDefault();
                submitSearch();
            }}
        >
            <fieldset className="border rounded-3 px-3 pb-3 pt-4 position-relative">
                <legend className="float-none w-auto px-2 mb-0 fs-5 fw-bold">{props.title ?? "搜尋條件"}</legend>

                <div className="row g-3">
                    {props.fields.map(field => (
                        <div key={field.key} className="col-12 col-md-6 col-xl-4">
                            <SearchFieldRenderer
                                field={field}
                                value={draftValues[field.key]}
                                customSlots={props.customSlots}
                                onChange={(value) => setFieldValue(field.key, value)}
                            />
                        </div>
                    ))}
                </div>

                <div className="row mt-3">
                    <div className="col-12 d-flex justify-content-start gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={resetSearch}>重置</button>
                        <button type="submit" className="btn btn-primary">搜尋</button>
                    </div>
                </div>
            </fieldset>
        </form>
    );
};

/** 依搜尋欄位類型渲染對應輸入元件 */
const SearchFieldRenderer = (props: SearchFieldRendererProps) =>
{
    if (props.field.type === "select") return <SearchSelectField {...props} />;
    if (props.field.type === "checkbox") return <SearchCheckboxField {...props} />;
    if (props.field.type === "checkboxGroup") return <SearchCheckboxGroupField {...props} />;
    if (props.field.type === "radio") return <SearchRadioField {...props} />;
    if (props.field.type === "date") return <SearchDateField {...props} />;
    if (props.field.type === "dateRange") return <SearchDateRangeField {...props} />;
    if (props.field.type === "custom") return <SearchCustomField {...props} />;

    return <SearchTextField {...props} />;
};

/** 渲染文字搜尋欄位 */
const SearchTextField = (props: SearchFieldRendererProps) =>
{
    const id = getSearchFieldId(props.field);
    const hintId = getSearchHintId(props.field);
    const value = typeof props.value === "string" ? props.value : "";

    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{props.field.title}</label>
            <input
                id={id}
                type="text"
                className="form-control"
                value={value}
                placeholder={props.field.placeholder}
                required={props.field.required}
                disabled={props.field.disabled}
                aria-describedby={props.field.helpText ? hintId : undefined}
                onChange={(e) => props.onChange(e.target.value)}
            />
            <SearchHelpText field={props.field} />
        </div>
    );
};

/** 渲染下拉搜尋欄位 */
const SearchSelectField = (props: SearchFieldRendererProps) =>
{
    const id = getSearchFieldId(props.field);
    const hintId = getSearchHintId(props.field);
    const value = typeof props.value === "string" ? props.value : "";

    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{props.field.title}</label>
            <select
                id={id}
                className="form-select"
                value={value}
                required={props.field.required}
                disabled={props.field.disabled}
                aria-describedby={props.field.helpText ? hintId : undefined}
                onChange={(e) => props.onChange(e.target.value || undefined)}
            >
                <option value="">全部</option>
                {props.field.options?.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.title}</option>)}
            </select>
            <SearchHelpText field={props.field} />
        </div>
    );
};

/** 渲染單一 checkbox 搜尋欄位 */
const SearchCheckboxField = (props: SearchFieldRendererProps) =>
{
    const id = getSearchFieldId(props.field);
    const hintId = getSearchHintId(props.field);
    const checked = props.value === true;

    return (
        <div className="form-group">
            <div className="form-check mt-4">
                <input
                    id={id}
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    required={props.field.required}
                    disabled={props.field.disabled}
                    aria-describedby={props.field.helpText ? hintId : undefined}
                    onChange={(e) => props.onChange(e.target.checked ? true : undefined)}
                />
                <label htmlFor={id} className="form-check-label">{props.field.title}</label>
            </div>
            <SearchHelpText field={props.field} />
        </div>
    );
};

/** 渲染 checkboxGroup 多選搜尋欄位 */
const SearchCheckboxGroupField = (props: SearchFieldRendererProps) =>
{
    const values = getStringArrayValue(props.value);
    const hintId = getSearchHintId(props.field);

    /** 切換選項勾選狀態 */
    const toggleValue = (value: string): void =>
    {
        const nextValues = values.includes(value) ? values.filter(item => item !== value) : [...values, value];

        props.onChange(nextValues.length > 0 ? nextValues : undefined);
    };

    return (
        <fieldset className="form-group" aria-describedby={props.field.helpText ? hintId : undefined}>
            <legend className="form-label">{props.field.title}</legend>
            <div className="d-flex flex-wrap gap-3">
                {props.field.options?.map(option =>
                {
                    const id = getSearchOptionId(props.field, option.value);

                    return (
                        <div key={option.value} className="form-check">
                            <input
                                id={id}
                                type="checkbox"
                                className="form-check-input"
                                checked={values.includes(option.value)}
                                disabled={props.field.disabled || option.disabled}
                                onChange={() => toggleValue(option.value)}
                            />
                            <label htmlFor={id} className="form-check-label">{option.title}</label>
                        </div>
                    );
                })}
            </div>
            <SearchHelpText field={props.field} />
        </fieldset>
    );
};

/** 渲染 radio 單選搜尋欄位 */
const SearchRadioField = (props: SearchFieldRendererProps) =>
{
    const value = typeof props.value === "string" ? props.value : "";
    const hintId = getSearchHintId(props.field);

    return (
        <fieldset className="form-group" aria-describedby={props.field.helpText ? hintId : undefined}>
            <legend className="form-label">{props.field.title}</legend>
            <div className="d-flex flex-wrap gap-3">
                {props.field.options?.map(option =>
                {
                    const id = getSearchOptionId(props.field, option.value);

                    return (
                        <div key={option.value} className="form-check">
                            <input
                                id={id}
                                type="radio"
                                name={getSearchFieldId(props.field)}
                                className="form-check-input"
                                value={option.value}
                                checked={value === option.value}
                                disabled={props.field.disabled || option.disabled}
                                onChange={(e) => props.onChange(e.target.value || undefined)}
                            />
                            <label htmlFor={id} className="form-check-label">{option.title}</label>
                        </div>
                    );
                })}
            </div>
            <SearchHelpText field={props.field} />
        </fieldset>
    );
};

/** 渲染日期搜尋欄位 */
const SearchDateField = (props: SearchFieldRendererProps) =>
{
    const id = getSearchFieldId(props.field);
    const hintId = getSearchHintId(props.field);
    const value = typeof props.value === "string" ? props.value : "";

    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{props.field.title}</label>
            <input
                id={id}
                type="date"
                className="form-control"
                value={value}
                required={props.field.required}
                disabled={props.field.disabled}
                aria-describedby={props.field.helpText ? hintId : undefined}
                onChange={(e) => props.onChange(e.target.value || undefined)}
            />
            <SearchHelpText field={props.field} />
        </div>
    );
};

/** 渲染日期區間搜尋欄位 */
const SearchDateRangeField = (props: SearchFieldRendererProps) =>
{
    const value = getDateRangeValue(props.value);
    const fromId = `${getSearchFieldId(props.field)}-from`;
    const toId = `${getSearchFieldId(props.field)}-to`;
    const hintId = getSearchHintId(props.field);

    /** 設定日期區間指定欄位 */
    const setRangeValue = (key: keyof SearchDateRangeValue, nextValue: string): void =>
    {
        const nextRange = { ...value, [key]: nextValue || undefined };
        props.onChange(nextRange.from || nextRange.to ? nextRange : undefined);
    };

    return (
        <fieldset className="form-group" aria-describedby={props.field.helpText ? hintId : undefined}>
            <legend className="form-label">{props.field.title}</legend>
            <div className="row g-2">
                <div className="col-12 col-md-6">
                    <label htmlFor={fromId} className="form-label">起始日期</label>
                    <input
                        id={fromId}
                        type="date"
                        className="form-control"
                        value={value.from ?? ""}
                        disabled={props.field.disabled}
                        onChange={(e) => setRangeValue("from", e.target.value)}
                    />
                </div>
                <div className="col-12 col-md-6">
                    <label htmlFor={toId} className="form-label">結束日期</label>
                    <input
                        id={toId}
                        type="date"
                        className="form-control"
                        value={value.to ?? ""}
                        disabled={props.field.disabled}
                        onChange={(e) => setRangeValue("to", e.target.value)}
                    />
                </div>
            </div>
            <SearchHelpText field={props.field} />
        </fieldset>
    );
};

/** 渲染客製搜尋欄位 */
const SearchCustomField = (props: SearchFieldRendererProps) =>
{
    const slotKey = props.field.slotName ?? props.field.key;
    const renderer = props.customSlots?.[slotKey];

    if (!renderer)
    {
        return (
            <div className="form-group">
                <span className="form-label">{props.field.title}</span>
                <div className="text-muted">尚未設定客製搜尋欄位</div>
            </div>
        );
    }

    return <>{renderer({ field: props.field, value: props.value, onChange: props.onChange })}</>;
};

/** 渲染搜尋欄位提示文字 */
const SearchHelpText = (props: { field: SearchFieldConfig; }) =>
{
    if (!props.field.helpText) return null;

    return <div id={getSearchHintId(props.field)} className="form-text">{props.field.helpText}</div>;
};

/** 正規化搜尋值，避免空字串或空陣列送入查詢 */
const normalizeSearchValues = (values: SearchValues): SearchValues =>
{
    return Object.entries(values).reduce<SearchValues>((next, [key, value]) =>
    {
        const normalizedValue = normalizeSearchValue(value);
        if (normalizedValue !== undefined) next[key] = normalizedValue;

        return next;
    }, {});
};

/** 正規化單一搜尋值 */
const normalizeSearchValue = (value: SearchValue): SearchValue =>
{
    if (typeof value === "string")
    {
        const text = value.trim();
        return text.length > 0 ? text : undefined;
    }

    if (Array.isArray(value))
    {
        const list = value.map(item => item.trim()).filter(Boolean);
        return list.length > 0 ? list : undefined;
    }

    if (typeof value === "boolean") return value ? true : undefined;
    if (value && typeof value === "object") return normalizeDateRangeValue(value);

    return undefined;
};

/** 正規化日期區間搜尋值 */
const normalizeDateRangeValue = (value: SearchDateRangeValue): SearchValue =>
{
    const from = value.from?.trim() || undefined;
    const to = value.to?.trim() || undefined;

    return from || to ? { from, to } : undefined;
};

/** 取得字串陣列搜尋值 */
const getStringArrayValue = (value: SearchValue): string[] =>
{
    return Array.isArray(value) ? value : [];
};

/** 取得日期區間搜尋值 */
const getDateRangeValue = (value: SearchValue): SearchDateRangeValue =>
{
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
};

/** 建立搜尋欄位 ID */
const getSearchFieldId = (field: SearchFieldConfig): string =>
{
    return `server-search-${normalizeDomId(field.key)}`;
};

/** 建立搜尋欄位提示文字 ID */
const getSearchHintId = (field: SearchFieldConfig): string =>
{
    return `${getSearchFieldId(field)}-hint`;
};

/** 建立搜尋選項 ID */
const getSearchOptionId = (field: SearchFieldConfig, value: string): string =>
{
    return `${getSearchFieldId(field)}-${normalizeDomId(value)}`;
};

/** 將任意 key 轉為穩定 DOM ID */
const normalizeDomId = (value: string): string =>
{
    return value.replace(/[^a-zA-Z0-9_-]/g, "-");
};
