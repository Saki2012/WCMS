// 原 input 改以使用 "AAInputFieldItem" 20260626
import { useCallback, useId, useMemo } from "react";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
type KeyOf<T> = Extract<keyof T, string>;

export interface UrlFieldMap<T>
{
    rowId: KeyOf<T>;
    parentRowId?: KeyOf<T>;
    title: KeyOf<T>;
    url: KeyOf<T>;
    target?: KeyOf<T>;
}

export interface LibUrlInputRepeaterProps<T extends Record<string, any>>
{
    /** 整包來源資料，同一張 detail 表的全集合。 */
    items: T[];
    /** 寫回整包資料。 */
    onChange: (nextAll: T[]) => void;
    /** 欄位對映。 */
    fields: UrlFieldMap<T>;
    /** 指定此 repeater 綁定哪個 parent。 */
    parentValue?: any;
    /** 建立新列時的預設值，會自動帶 rowId、parentRowId。 */
    getDefault?: (ctx: { rowId: number; parentValue: any; }) => Partial<T>;
    /** Repeater 區塊標題。 */
    label?: string;
    /** target 選項，不傳則不顯示 target 欄位。 */
    targets?: Record<number, string>;
    /** 新增按鈕文本。 */
    addButtonText?: string;
}

interface LibUrlInputRowProps<T extends Record<string, any>>
{
    value: T;
    fields: UrlFieldMap<T>;
    onChange: (next: T) => void;
    onDelete: () => void;
    targets?: Record<number, string>;
}
// #endregion

// #region Public
/** URL repeater 欄位，支援網址說明、網址連結與開啟方式。 */
export const LibUrlInput = <T extends Record<string, any>>(props: LibUrlInputRepeaterProps<T>) =>
{
    const { items, onChange, fields, parentValue, getDefault, label = "外部連結", targets, addButtonText = "新增" } = props;
    const filtered = useMemo(() =>
    {
        const list = fields.parentRowId ? items.filter(x => x[fields.parentRowId!] === parentValue) : items.slice();
        return list.sort((a, b) => Number(a[fields.rowId] ?? 0) - Number(b[fields.rowId] ?? 0));
    }, [items, fields.parentRowId, fields.rowId, parentValue]);
    const nextRowId = useMemo(() =>
    {
        const last = filtered.at(-1);
        return (Number(last?.[fields.rowId] ?? 0) + 1) || 1;
    }, [filtered, fields.rowId]);
    const commitReplaceOne = useCallback((updated: T) =>
    {
        const rowIdVal = updated[fields.rowId];
        const parentOk = fields.parentRowId ? updated[fields.parentRowId] : undefined;
        const nextAll = items.map(x =>
        {
            const sameRow = x[fields.rowId] === rowIdVal && (!fields.parentRowId || x[fields.parentRowId] === parentOk);
            return sameRow ? updated : x;
        });
        onChange(nextAll);
    }, [items, onChange, fields]);
    const addRow = useCallback(() =>
    {
        const base = (getDefault?.({ rowId: nextRowId, parentValue }) ?? {}) as T;
        const newItem: T = {
            ...(base as any),
            [fields.rowId]: nextRowId,
            ...(fields.parentRowId ? { [fields.parentRowId]: parentValue } : {}),
            [fields.title]: (base as any)[fields.title] ?? "",
            [fields.url]: (base as any)[fields.url] ?? "",
            ...(fields.target ? { [fields.target]: (base as any)[fields.target] ?? "" } : {}),
        } as T;
        onChange([...items, newItem]);
    }, [getDefault, nextRowId, parentValue, fields, items, onChange]);
    const removeAt = useCallback((i: number) =>
    {
        const target = filtered[i];
        if (!target) return;
        const nextAll = items.filter(x =>
        {
            const sameRow = x[fields.rowId] === target[fields.rowId] && (!fields.parentRowId || x[fields.parentRowId] === target[fields.parentRowId]);
            return !sameRow;
        });
        onChange(nextAll);
    }, [filtered, items, onChange, fields]);
    return (
        <div role="group" className="mt-4">
            <div className="mb-2 font-semibold">{label}</div>
            {filtered.map((row, i) => (
                <LibUrlInputRow<T>
                    key={`${String(row[fields.parentRowId ?? ""] ?? "")}-${String(row[fields.rowId])}-${i}`}
                    value={row}
                    fields={fields}
                    targets={targets}
                    onChange={commitReplaceOne}
                    onDelete={() => removeAt(i)}
                />
            ))}
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">
                            <button
                                data-repeater-create=""
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 my-2"
                                onClick={addRow}
                                aria-label={addButtonText}
                            >
                                <i className="far fa-plus mr-2"></i>
                                {addButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** URL repeater 單列欄位。 */
const LibUrlInputRow = <T extends Record<string, any>>(props: LibUrlInputRowProps<T>) =>
{
    const { value, fields, onChange, onDelete, targets } = props;
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const titleKey = String(fields.title);
    const urlKey = String(fields.url);
    const targetKey = fields.target ? String(fields.target) : "target";
    const idTarget = buildFieldId(baseId, targetKey);
    const setField = <K extends KeyOf<T>>(k: K, v: any) =>
    {
        onChange({ ...value, [k]: v } as T);
    };
    const handleTitleChange = (_fieldKey: string, nextValue: AAInputValue) =>
    {
        setField(fields.title, String(nextValue ?? ""));
    };
    const handleUrlChange = (_fieldKey: string, nextValue: AAInputValue) =>
    {
        setField(fields.url, String(nextValue ?? ""));
    };
    return (
        <div className="flex flex-col gap-2 mb-3" role="group" aria-label="URL row">
            <div className="input-group">
                <AAInputFieldItem
                    baseId={baseId}
                    variant="gridCell"
                    className="flex-grow-1"
                    field={{
                        key: titleKey,
                        type: "text",
                        label: "網址說明",
                        aaLabel: "請輸入網址說明",
                        value: String(value[fields.title] ?? ""),
                        placeholder: "網址說明 …",
                        helpText: "網址說明欄位",
                    }}
                    onChange={handleTitleChange}
                />
                <button
                    data-repeater-delete=""
                    type="button"
                    className="btn btn-custom mb-1"
                    title=""
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-bs-original-title="刪除附加檔案"
                    onClick={onDelete}
                >
                    <i className="far fa-times"></i>
                </button>
            </div>
            <div className="input-group">
                <AAInputFieldItem
                    baseId={baseId}
                    variant="gridCell"
                    className="flex-grow-1"
                    field={{
                        key: urlKey,
                        type: "url",
                        label: "網址連結",
                        aaLabel: "請輸入網址連結",
                        value: String(value[fields.url] ?? ""),
                        placeholder: "https://…",
                        autoComplete: "url",
                        helpText: "網址連結欄位",
                    }}
                    onChange={handleUrlChange}
                />
                {fields.target && targets && (
                    <>
                        <label htmlFor={idTarget} className="sr-only">開啟方式</label>
                        <select
                            id={idTarget}
                            className="form-select"
                            value={String(value[fields.target] ?? "")}
                            onChange={e => setField(fields.target!, Number(e.target.value))}
                            aria-label="開啟方式"
                        >
                            {Object.entries(targets).map(([val, text]) => <option key={val} value={val}>{text}</option>)}
                        </select>
                    </>
                )}
            </div>
        </div>
    );
};
// #endregion