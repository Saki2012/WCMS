// hooks/useSetTableField.ts
import type { ILibDatetimeRangeProp } from "@/SysCore/Components/FormField/FieldComponets/LibDatetimeRange_Comp";
import { LibJson, parseBitmaskToStringArray, splitTrimToArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { UseFetchFormDataResult } from "../../Utils/API/FetchFormData";

// #region Property
export type FormDataLike<T> = { data: T; setFormData: React.Dispatch<React.SetStateAction<T>>; displayName?: ModelDisplaySchema | null; };

type CoerceMode = "string" | "number" | "boolean" | "datetime" | ((v: unknown) => any);

/** DefaultWhen：何時套用「預設值」的判斷條件 */
type DefaultWhen = "never" | "nullish" | "empty" | "falsy";

type RowLike = Record<string, any>;

type TableType<T, K extends keyof T> = NonNullable<T[K]>;

type RowType<X> = X extends (infer U)[] ? NonNullable<U> : NonNullable<X>;

type SetStrategy = "default" | "sum" | "csv";

type SetOptions = SetStrategy | {
    strategy?: SetStrategy;
    /** sum 模式用到的位元鍵集合 */
    sumKeys?: Array<number>;
    /** csv 模式的分隔字元 */
    csvDelimiter?: string;
    /** 預設值設定 */
    defaultValue?: unknown | ((ctx: { table: string; field: string; rowKeys?: Record<string, unknown>; current: unknown; }) => unknown);
    /** 何時套用預設值 */
    defaultWhen?: DefaultWhen;
    /** 是否啟用自動預設 */
    autoDefault?: boolean;
};

interface UseSetTableFileFieldOptions
{
    /** 第一次上傳時，若檔名為空，要如何帶入預設值 */
    defaultNameFromOriginal?: "original" | "basename" | "none";

    /** 僅在目前檔名為空時才自動帶入 */
    onlyFillNameIfEmpty?: boolean;

    /** 底層預設值套用時機 */
    defaultWhen?: DefaultWhen;

    /** 預設 FileId */
    defaultId?: string;

    /** 預設檔名 */
    defaultName?: string | ((ctx: { table: string; rowKeys?: Record<string, unknown>; }) => string);

    /** 顯示用實體檔名 */
    fileName?: string;
}

/** 回傳給 LibFileInput 可以直接展開的屬性 */
export interface FileFieldBindProps
{
    ColumnDisplayName: string;
    InputValue: string;
    FileInternalId: string;
    FileName?: string;
    onFileUploaded: (internalId: string, originalName?: string) => void;
    onNameChange: (name: string) => void;
}

export interface JsonFieldBinder<TJson extends object>
{
    /** 取出完整 JSON 物件 */
    get: () => TJson;

    /** 直接整包寫回 */
    set: (next: TJson) => void;

    /** 綁定某個 JSON 內 key */
    bind: <K extends keyof TJson>(key: K, mode?: "string" | "number" | "csv" | "boolean") => {
        value: any;
        onChange: (v: any) => void;
    };
}

type RangeBind = Omit<ILibDatetimeRangeProp, "Style" | "valueType" | "disabled">;
// #endregion

// #region Public
/** 建立 table field 綁定器，提供欄位讀寫與預設值套用。 */
export const useSetTableField = <T>(form: FormDataLike<T>) =>
{
    const appliedDefaultsRef = useRef<Set<string>>(new Set());
    const pendingWritesRef = useRef<Array<() => void>>([]);

    useEffect(() =>
    {
        if (pendingWritesRef.current.length === 0) return;

        const jobs = pendingWritesRef.current.splice(0);
        for (const job of jobs) job();
    });

    return useCallback(<TableName extends keyof NonNullable<T>, FieldName extends keyof RowType<TableType<NonNullable<T>, TableName>>>(
        table: TableName,
        field: FieldName,
        mode: CoerceMode = "string",
        rowKeys?: Record<string, string | number | boolean | any>,
        setType?: SetOptions,
    ) =>
    {
        const dataAny = form.data as any;
        const tableVal = dataAny?.[table];
        const raw = resolveCurrentFieldValue(tableVal, field, rowKeys);
        const label = getColumnDisplayName(form.displayName ?? null, String(table), String(field)) || `【${String(field)}】`;
        const strategy: SetStrategy = typeof setType === "string" ? setType : (setType?.strategy ?? "default");
        const sumKeys = typeof setType === "object" ? setType.sumKeys : undefined;
        const csvDelimiter = typeof setType === "object" && setType.csvDelimiter ? setType.csvDelimiter : ",";
        const inputValue = resolveInputValue(raw, mode, strategy, sumKeys, csvDelimiter);

        ensureDefaultOnce(appliedDefaultsRef, {
            key: `${String(table)}|${String(field)}|${buildRowKeysSignature(rowKeys)}`,
            current: raw,
            mode,
            strategy,
            setType,
            writeBack: (dv) =>
            {
                pendingWritesRef.current.push(() =>
                {
                    form.setFormData((prev: any) =>
                    {
                        if (!prev) return prev;

                        const currentTable = prev[table];
                        const nextCellValue = strategy === "sum" ? (dv as any) : strategy === "csv" ? String(dv ?? "") : coerce(mode, dv);
                        const nextTable = upsertRow(currentTable, rowKeys, field as any, nextCellValue);

                        return nextTable === currentTable ? prev : { ...prev, [table]: nextTable };
                    });
                });
            },
        });

        const onChange = (v: unknown): void =>
        {
            form.setFormData((prev: any) =>
            {
                if (!prev) return prev;

                const currentTable = prev[table];
                const nextCellValue = resolveNextCellValue(v, mode, strategy, csvDelimiter);
                const nextTable = upsertRow(currentTable, rowKeys, field as any, nextCellValue);

                return nextTable === currentTable ? prev : { ...prev, [table]: nextTable };
            });
        };

        const bind = { ColumnDisplayName: label, InputValue: inputValue, OnChange: onChange } as const;

        return { ...bind, Input: bind.InputValue, onChange: bind.OnChange };
    }, [form.data, form.displayName, form.setFormData]);
};

/** 建立 table file field 綁定器，提供檔案 internalId 與檔名欄位同步。 */
export const useSetTableFileField = <TSet>(formData: FormDataLike<TSet>) =>
{
    const fileWritesRef = useRef<Array<() => void>>([]);
    const fileDefaultKeysRef = useRef<Set<string>>(new Set());

    useEffect(() =>
    {
        if (fileWritesRef.current.length === 0) return;

        const jobs = fileWritesRef.current.splice(0);
        for (const job of jobs) job();
    });

    const setFileField = useMemo(() =>
    {
        return (
            tableName: string,
            fileIdField: string,
            fileNameField?: string,
            rowKeys?: Record<string, string | number | boolean | null | undefined>,
            opts?: UseSetTableFileFieldOptions,
        ): FileFieldBindProps =>
        {
            const data: any = formData.data ?? {};
            const table = data?.[tableName];
            const currentRow = resolveCurrentRow(table, rowKeys);
            const currentId: string = String(currentRow?.[fileIdField] ?? "");
            const currentName: string = fileNameField ? String(currentRow?.[fileNameField] ?? "") : "";
            const fileDefaultWhen: DefaultWhen = opts?.defaultWhen ?? "nullish";
            const shouldDefault = (v: unknown): boolean => isDefaultRequired(v, fileDefaultWhen);
            const fileDefaultKey = `${tableName}|${fileIdField}|${fileNameField ?? ""}|${buildRowKeysSignature(rowKeys)}`;
            const needFileDefault = shouldDefault(currentId) || shouldDefault(currentName);

            if (needFileDefault && !fileDefaultKeysRef.current.has(fileDefaultKey))
            {
                fileDefaultKeysRef.current.add(fileDefaultKey);
                fileWritesRef.current.push(() =>
                {
                    formData.setFormData((prevAny: any) =>
                    {
                        const prev = prevAny ?? {};
                        const t = prev?.[tableName];

                        const computeName = (): string =>
                        {
                            if (typeof opts?.defaultName === "function") return (opts.defaultName as any)({ table: tableName, rowKeys });
                            if (typeof opts?.defaultName === "string") return opts.defaultName;

                            return "";
                        };

                        const apply = (row: any): any =>
                        {
                            const next = { ...(row ?? {}) };
                            let changed = false;

                            if (fileNameField && shouldDefault(next[fileNameField]))
                            {
                                const nextName = computeName();
                                changed = !Object.is(next[fileNameField], nextName) || changed;
                                next[fileNameField] = nextName;
                            }

                            if (fileIdField && shouldDefault(next[fileIdField]))
                            {
                                const nextId = opts?.defaultId ?? "";
                                changed = !Object.is(next[fileIdField], nextId) || changed;
                                next[fileIdField] = nextId;
                            }

                            return changed ? next : row;
                        };

                        if (Array.isArray(t))
                        {
                            let changed = false;
                            const nextList = t.map((r: any) =>
                            {
                                if (!matchRowKeys(r, rowKeys)) return r;

                                const nextRow = apply(r);
                                changed = nextRow !== r || changed;
                                return nextRow;
                            });

                            return changed ? { ...prev, [tableName]: nextList } : prev;
                        }

                        if (t && typeof t === "object")
                        {
                            const nextObj = apply(t);
                            return nextObj === t ? prev : { ...prev, [tableName]: nextObj };
                        }

                        const nextObj = apply({});
                        return { ...prev, [tableName]: nextObj };
                    });
                });
            }

            const updateRow = (updater: (row: any) => any): void =>
            {
                formData.setFormData((prevAny: any) =>
                {
                    const prev = prevAny ?? {};
                    const t = prev?.[tableName];

                    if (Array.isArray(t))
                    {
                        const nextList = (t ?? []).map((r: any) => (matchRowKeys(r, rowKeys) ? updater(r) : r));
                        return { ...prev, [tableName]: nextList };
                    }

                    if (t && typeof t === "object")
                    {
                        const nextObj = updater(t);
                        return { ...prev, [tableName]: nextObj };
                    }

                    const nextObj = updater({});
                    return { ...prev, [tableName]: nextObj };
                });
            };

            const onlyFillIfEmpty = opts?.onlyFillNameIfEmpty ?? true;
            const nameMode = opts?.defaultNameFromOriginal ?? "basename";

            const onFileUploaded = (internalId: string, originalName?: string): void =>
            {
                updateRow((row) =>
                {
                    const next: any = { ...row, [fileIdField]: internalId };

                    if (fileNameField)
                    {
                        const needFill = onlyFillIfEmpty ? !String(row?.[fileNameField] ?? "").trim() : true;
                        if (needFill) next[fileNameField] = deriveName(originalName, nameMode);
                    }

                    return next;
                });
            };

            const onNameChange = (name: string): void =>
            {
                if (!fileNameField) return;

                updateRow((row) => ({ ...row, [fileNameField]: name }));
            };

            const label = getColumnDisplayName(formData.displayName ?? null, String(tableName), String(fileIdField)) || `[${String(fileIdField)}]`;

            return {
                ColumnDisplayName: label,
                InputValue: fileNameField ? currentName : "",
                FileInternalId: currentId,
                FileName: opts?.fileName ?? "",
                onFileUploaded,
                onNameChange,
            };
        };
    }, [formData]);

    return setFileField;
};

/** 建立 JSON 欄位綁定器，提供 JSON object 安全解析與欄位綁定。 */
export const useSetJsonField = <TSet, TJson extends Record<string, any>>(
    formData: UseFetchFormDataResult<TSet>,
    tableName: string,
    fieldName: string,
    rowKeys: Record<string, any>,
    defaults: TJson,
): JsonFieldBinder<TJson> =>
{
    const setField = useSetTableField<TSet>(formData);
    const base = useMemo(() => setField(tableName as any, fieldName as any, "string", rowKeys), [setField, tableName, fieldName, rowKeys]);

    const get = (): TJson =>
    {
        return LibJson.parseJsonRecordWithFallback<TJson>(base.InputValue, defaults);
    };

    const set = (next: TJson): void =>
    {
        const json = LibJson.stringifyJson(next);
        if (!json) return;

        base.onChange?.(json);
    };

    const bind = <K extends keyof TJson>(key: K, mode: "string" | "number" | "csv" | "boolean" = "string") =>
    {
        const json = get();
        const rawVal = (json as any)[key];
        const value = resolveJsonBindValue(rawVal, mode);

        const onChange = (uiVal: any): void =>
        {
            const next: any = { ...json };

            if (mode === "csv")
            {
                next[key as any] = toCSV(uiVal as string[]);
            } else if (mode === "number")
            {
                const n = Number(uiVal);
                next[key as any] = Number.isFinite(n) ? n : 0;
            } else if (mode === "boolean")
            {
                next[key as any] = normalizeBool(uiVal);
            } else
            {
                next[key as any] = String(uiVal ?? "");
            }

            set(next);
        };

        return { value, onChange };
    };

    return { get, set, bind };
};

/** 建立日期區間欄位綁定器，將起訖欄位合成 Range Field props。 */
export const useSetDateRangeField = <TSet>(formData: UseFetchFormDataResult<TSet>) =>
{
    const setField = useSetTableField<TSet>(formData);

    return (
        table: keyof NonNullable<TSet> | string,
        startField: string,
        endField: string,
        mode: "string" | "number" | "boolean" | "datetime" | ((v: unknown) => any) = "datetime",
        rowKeys?: Record<string, any>,
    ): RangeBind =>
    {
        const start = setField(table as any, startField as any, mode as any, rowKeys);
        const end = setField(table as any, endField as any, mode as any, rowKeys);

        return {
            ColumnDisplayName: start.ColumnDisplayName,
            StartValue: ((start.InputValue ?? "") as string),
            EndValue: ((end.InputValue ?? "") as string),
            onChangeStart: (val) =>
            {
                start.onChange?.(normalizeDateRangeValue(val));
            },
            onChangeEnd: (val) =>
            {
                end.onChange?.(normalizeDateRangeValue(val));
            },
        };
    };
};
// #endregion

// #region Private
/** 讀取目前欄位值，支援 detail array 與 header object。 */
const resolveCurrentFieldValue = <FieldName extends string | number | symbol>(
    tableVal: any,
    field: FieldName,
    rowKeys?: Record<string, string | number | boolean | any>,
): any =>
{
    if (rowKeys !== undefined && Array.isArray(tableVal))
    {
        const row = (tableVal as RowLike[]).find(r => matchRowKeys(r, rowKeys));
        return row?.[field as any];
    }

    return tableVal?.[field as any];
};

/** 解析目前 row，支援 detail array 與 header object。 */
const resolveCurrentRow = (table: any, rowKeys?: Record<string, string | number | boolean | null | undefined>): any =>
{
    if (Array.isArray(table)) return table.find((r: any) => matchRowKeys(r, rowKeys));
    if (table && typeof table === "object") return table;

    return undefined;
};

/** 解析欄位顯示用輸入值。 */
const resolveInputValue = (
    raw: any,
    mode: CoerceMode,
    strategy: SetStrategy,
    sumKeys: Array<number> | undefined,
    csvDelimiter: string,
): any =>
{
    if (strategy === "sum") return parseBitmaskToStringArray(Number(raw ?? 0), sumKeys ?? []);
    if (strategy === "csv") return splitTrimToArray(String(raw ?? ""), csvDelimiter);

    return raw ?? (mode === "number" ? 0 : mode === "boolean" ? false : "");
};

/** 解析欄位變更後要寫回表單的值。 */
const resolveNextCellValue = (value: unknown, mode: CoerceMode, strategy: SetStrategy, csvDelimiter: string): any =>
{
    if (strategy === "sum") return sumStringArrayToBitmask(value as string[]);
    if (strategy === "csv") return Array.isArray(value) ? (value as string[]).join(csvDelimiter) : String(value ?? "");

    return coerce(mode, value);
};

/** 更新表格欄位，內容相同時回傳原 reference。 */
const upsertRow = (currentTable: any, rowKeys: Record<string, any> | undefined, field: string | number | symbol, value: any): any =>
{
    const fieldKey = String(field);

    if (!rowKeys)
    {
        if (Array.isArray(currentTable)) return currentTable;

        const currentObj = currentTable ?? {};
        if (currentTable && Object.is(currentObj[fieldKey], value)) return currentTable;

        return { ...currentObj, [fieldKey]: value };
    }

    const rows: RowLike[] = Array.isArray(currentTable) ? (currentTable as RowLike[]) : currentTable ? [currentTable as RowLike] : [];
    let found = false;
    let changed = false;

    const nextRows = rows.map(r =>
    {
        if (!matchRowKeys(r, rowKeys)) return r;

        found = true;
        if (Object.is(r[fieldKey], value)) return r;

        changed = true;
        return { ...r, [fieldKey]: value };
    });

    if (!found)
    {
        changed = true;
        nextRows.push({ ...rowKeys, [fieldKey]: value });
    }

    return changed ? nextRows : currentTable;
};

/** 依欄位模式轉換寫入值。 */
const coerce = (mode: CoerceMode, val: unknown): any =>
{
    switch (typeof mode === "function" ? "function" : mode)
    {
        case "function":
            return (mode as (val: unknown) => unknown)(val);
        case "number":
            return Number(val) || 0;
        case "boolean":
            return normalizeBool(val);
        case "datetime":
            return coerceDatetime(val);
        case "string":
        default:
            return val;
    }
};

/** 將輸入值轉換為 datetime 欄位可寫入值。 */
const coerceDatetime = (val: unknown): string | null =>
{
    if (val === null || val === undefined) return null;

    if (typeof val === "string")
    {
        const s = val.trim();
        return s === "" ? null : s;
    }

    if (val instanceof Date) return isNaN(val.getTime()) ? null : val.toISOString();

    const d = new Date(val as any);
    return isNaN(d.getTime()) ? null : d.toISOString();
};

/** 取得欄位顯示名稱。 */
const getColumnDisplayName = (schema: ModelDisplaySchema | null, tableName: string, columnId: string): string =>
{
    return (schema?.Tables?.find(t => t.TableId === tableName)?.Columns?.find((c: any) => c.ColumnId === columnId)?.ColumnDisplayName ?? "");
};

/** 依欄位模式與策略推導自動預設值。 */
const computeAutoDefault = (mode: CoerceMode, strategy: SetStrategy): unknown =>
{
    if (strategy === "csv") return "";
    if (strategy === "sum") return 0;
    if (typeof mode === "function") return undefined;

    switch (mode)
    {
        case "string":
            return "";
        case "number":
            return 0;
        case "boolean":
            return false;
        case "datetime":
            return null;
        default:
            return undefined;
    }
};

/** 確認欄位預設值只套用一次，避免 render 中重複寫入。 */
const ensureDefaultOnce = (
    ref: React.MutableRefObject<Set<string>>,
    args: { key: string; current: unknown; mode: CoerceMode; strategy: SetStrategy; setType?: SetOptions; writeBack: (v: unknown) => void; },
): void =>
{
    const { key, current, mode, strategy, setType, writeBack } = args;
    if (ref.current.has(key)) return;

    const cfg = (typeof setType === "object" ? setType : undefined) ?? {};
    const when: DefaultWhen = cfg.defaultWhen ?? (mode === "datetime" ? "empty" : "nullish");
    const enabled = cfg.autoDefault ?? true;

    if (!enabled)
    {
        ref.current.add(key);
        return;
    }

    const needDefault = isDefaultRequired(current, when);

    if (!needDefault)
    {
        ref.current.add(key);
        return;
    }

    let dv = typeof cfg.defaultValue === "function" ? (cfg.defaultValue as any)({ current, table: "", field: "", rowKeys: undefined }) : cfg.defaultValue;

    if (dv === undefined) dv = computeAutoDefault(mode, strategy);
    if (dv === undefined)
    {
        ref.current.add(key);
        return;
    }

    writeBack(dv);
    ref.current.add(key);
};

/** 判斷指定值是否需要套用預設值。 */
const isDefaultRequired = (value: unknown, when: DefaultWhen): boolean =>
{
    const isEmptyString = typeof value === "string" && value === "";
    const isNullish = value === null || value === undefined;

    switch (when)
    {
        case "never":
            return false;
        case "nullish":
            return isNullish;
        case "empty":
            return isNullish || isEmptyString;
        case "falsy":
            return !value;
    }
};

/** 比對是否符合複合主鍵。 */
const matchRowKeys = (row: RowLike, rowKeys?: Record<string, string | number | boolean | null | undefined>): boolean =>
{
    if (!rowKeys) return false;

    const entries = Object.entries(rowKeys);
    if (!entries.length) return false;

    return entries.every(([k, v]) => String(row?.[k]) === String(v));
};

/** 建立 rowKeys 的穩定字串簽章。 */
const buildRowKeysSignature = (rowKeys?: Record<string, unknown>): string =>
{
    return LibJson.stringifyJson(rowKeys ?? {}, "{}");
};

/** 從原始檔名推導欄位檔名。 */
const deriveName = (originalName: string | undefined, mode: UseSetTableFileFieldOptions["defaultNameFromOriginal"] = "basename"): string =>
{
    if (!originalName) return "";
    if (mode === "none") return "";
    if (mode === "basename") return originalName.replace(/\.[^.]+$/, "");

    return originalName;
};

/** 將陣列轉成 CSV 字串。 */
const toCSV = (arr: string[] | number[] | undefined | null): string =>
{
    return (arr ?? []).map(String).filter(Boolean).join(",");
};

/** 將 CSV 字串轉成陣列。 */
const fromCSV = (s: string | undefined | null): string[] =>
{
    return splitTrimToArray(s);
};

/** 將輸入值轉成 boolean。 */
const normalizeBool = (value: unknown): boolean =>
{
    if (value === true) return true;
    if (value === false) return false;

    const raw = `${value ?? ""}`.trim().toLowerCase();
    return raw === "true" || raw === "1";
};

/** 解析 JSON 欄位綁定值。 */
const resolveJsonBindValue = (rawVal: unknown, mode: "string" | "number" | "csv" | "boolean"): any =>
{
    if (mode === "csv") return fromCSV(String(rawVal ?? ""));
    if (mode === "number") return Number(rawVal ?? 0);
    if (mode === "boolean") return normalizeBool(rawVal);

    return String(rawVal ?? "");
};

/** 將日期區間空值統一轉為 null。 */
const normalizeDateRangeValue = (val: string | null | undefined): string | null =>
{
    if (val == null) return null;

    const text = String(val).trim();
    return text === "" ? null : text;
};
// #endregion
