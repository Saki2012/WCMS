// hooks/useSetTableField.ts
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { UseFetchFormDataResult } from "../../Utils/API/FetchFormData";

export type FormDataLike<T> = {
    data: T;
    setFormData: React.Dispatch<React.SetStateAction<T>>;
    displayName?: ModelDisplaySchema | null;
};
type CoerceMode = "string" | "number" | "boolean" | "datetime" | ((v: unknown) => any);

const upsertRow = (
    currentTable: any,
    rowKeys: Record<string, any> | undefined,
    field: string | number | symbol,
    value: any,
) =>
{
    // 如果沒有 rowKeys，就照原本的邏輯處理（非明細）
    if (!rowKeys)
    {
        if (Array.isArray(currentTable))
        {
            // 沒 rowKeys 時不建議亂改全部列，所以直接回傳原本陣列
            return currentTable;
        }
        return { ...(currentTable ?? {}), [field]: value };
    }

    // 有 rowKeys：一定當「明細陣列」處理
    const rows: RowLike[] = Array.isArray(currentTable)
        ? (currentTable as RowLike[])
        : currentTable
        ? [currentTable as RowLike] // 若之前誤塞成物件，就把它包成一列
        : [];

    let found = false;
    const nextRows = rows.map(r =>
    {
        if (matchRowKeys(r, rowKeys))
        {
            found = true;
            return { ...r, [field]: value };
        }
        return r;
    });

    // 若沒找到那一筆，代表是第一次寫入，幫他 push 一筆新的
    if (!found)
    {
        nextRows.push({ ...rowKeys, [field]: value });
    }

    return nextRows;
};
const coerce = (mode: CoerceMode, val: unknown) =>
{
    switch (typeof mode === "function" ? "function" : mode)
    {
        case "function":
            return (mode as (val: unknown) => unknown)(val);
        case "number":
            return Number(val) || 0;
        case "boolean":
            return Boolean(val);
        case "datetime":
        {
            // 空值一律回 null
            if (val === null || val === undefined) return null;
            if (typeof val === "string")
            {
                const s = val.trim();
                return s === "" ? null : s; // 保留原始字串（YYYY-MM-DD 或 ISO）
            }
            if (val instanceof Date)
            {
                return isNaN(val.getTime()) ? null : val.toISOString();
            }
            const d = new Date(val as any);
            return isNaN(d.getTime()) ? null : d.toISOString();
        }
        case "string":
        default:
            return val;
    }
};

/** DefaultWhen：何時套用「預設值」的判斷條件
 * - "never"   ：永不套用預設值（完全關閉懶初始化）
 * - "nullish" ：僅在值為 null 或 undefined 時套用（不包含 ""、0、false）
 * - "empty"   ：在值為 null/undefined 或空字串 "" 時套用（不包含 0、false）
 * - "falsy"   ：在任何 JS 的「假值」時套用：undefined、null、""、0、false、NaN
 *
 * 使用建議：
 * - 文字/CSV 欄位   → "empty"  （空字串才補，不會覆蓋 0/false）
 * - 數字/bitmask    → "nullish"（0 是合法值，不要被當成需補預設）
 * - 下拉選單         → "nullish"（未選才補第一筆）
 * - 布林欄位         → "nullish"（false 是合法值，不要被當成需補）
 *
 * 範例對照：
 *   值        →  never   nullish  empty  falsy
 *   undefined →   ×        ✓       ✓      ✓
 *   null      →   ×        ✓       ✓      ✓
 *   ""        →   ×        ×       ✓      ✓
 *   "abc"     →   ×        ×       ×      ×
 *   0         →   ×        ×       ×      ✓
 *   false     →   ×        ×       ×      ✓
 *   NaN       →   ×        ×       ×      ✓
 *
 * 備註：目前 "empty" 僅判斷嚴格等於 ""（不含空白字元）。若想把 "   " 視為空白，
 * 可改成：typeof v === "string" && v.trim() === ""。
 */
type DefaultWhen = "never" | "nullish" | "empty" | "falsy";
const getColumnDisplayName = (schema: ModelDisplaySchema | null, tableName: string, columnId: string): string =>
{
    return (
        schema?.Tables?.find(t => t.TableId === tableName)?.Columns?.find((c: any) => c.ColumnId === columnId)
            ?.ColumnDisplayName ?? ""
    );
};
type RowLike = Record<string, any>;
type TableType<T, K extends keyof T> = NonNullable<T[K]>;
type RowType<X> = X extends (infer U)[] ? NonNullable<U> : NonNullable<X>;
const computeAutoDefault = (mode: CoerceMode, strategy: SetStrategy) =>
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
const ensureDefaultOnce = (
    ref: React.MutableRefObject<Set<string>>,
    args: {
        key: string;
        current: unknown;
        mode: CoerceMode;
        strategy: SetStrategy;
        setType?: SetOptions;
        writeBack: (v: unknown) => void;
    },
) =>
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

    const isEmptyString = typeof current === "string" && current === "";
    const isNullish = current === null || current === undefined;
    const isFalsy = !current;

    const needDefault = when === "never"
        ? false
        : when === "nullish"
        ? isNullish
        : when === "empty"
        ? (isNullish || isEmptyString)
        : isFalsy; // "falsy"

    if (!needDefault)
    {
        ref.current.add(key);
        return;
    }

    // 1) 呼叫端覆寫 > 2) 自動推導 > 3) 放棄
    let dv = typeof cfg.defaultValue === "function"
        ? (cfg.defaultValue as any)({ current, table: "", field: "", rowKeys: undefined })
        : cfg.defaultValue;

    if (dv === undefined) dv = computeAutoDefault(mode, strategy);
    if (dv === undefined)
    {
        ref.current.add(key);
        return;
    }

    writeBack(dv);
    ref.current.add(key);
};
/** 比對是否符合複合主鍵（全部 key 都相等才算符合） */
const matchRowKeys = (
    row: RowLike,
    rowKeys?: Record<string, string | number | boolean | null | undefined>,
): boolean =>
{
    if (!rowKeys) return false;
    const entries = Object.entries(rowKeys);
    if (!entries.length) return false;
    return entries.every(([k, v]) => String(row?.[k]) === String(v));
};
type SetStrategy = "default" | "sum" | "csv";
type SetOptions =
    | SetStrategy
    | {
        strategy?: SetStrategy;
        /** sum 模式用到的位元鍵集合（例：useContentStatus.data?.map(d => d.Key)） */
        sumKeys?: Array<number>;
        /** csv 模式的分隔字元（預設 ","） */
        csvDelimiter?: string;
        // 預設值設定（可不帶，則走自動規則）
        defaultValue?:
            | unknown
            | ((
                ctx: { table: string; field: string; rowKeys?: Record<string, unknown>; current: unknown; },
            ) => unknown);
        // 何時套用預設值；預設 nullish（null/undefined）
        defaultWhen?: DefaultWhen;
        // 是否啟用自動預設（預設 true）
        autoDefault?: boolean;
    };
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

    return useCallback(
        <
            TableName extends keyof NonNullable<T>,
            FieldName extends keyof RowType<TableType<NonNullable<T>, TableName>>,
        >(
            table: TableName,
            field: FieldName,
            mode: CoerceMode = "string", // ✅ 只用這個來決定輸入值轉型
            /** 複合主鍵（若表是陣列，需提供；若是單物件可省略） */
            rowKeys?: Record<string, string | number | boolean | any>,
            setType?: SetOptions,
        ) =>
        {
            const dataAny = form.data as any;
            const tableVal = dataAny?.[table];

            // 取目前值：若有 rowId 則從陣列那筆取；否則從物件取
            let raw: any;
            if (rowKeys !== undefined && Array.isArray(tableVal))
            {
                const row = (tableVal as RowLike[]).find(r => matchRowKeys(r, rowKeys));
                raw = row?.[field as any];
            } else
            {
                raw = tableVal?.[field as any];
            }

            const label = getColumnDisplayName(form.displayName ?? null, String(table), String(field))
                || `【${String(field)}】`;

            // 解析 setType
            const strategy: SetStrategy = typeof setType === "string" ? setType : (setType?.strategy ?? "default");

            const sumKeys = typeof setType === "object" ? setType.sumKeys : undefined;

            const csvDelimiter = typeof setType === "object" && setType.csvDelimiter ? setType.csvDelimiter : ",";

            // InputValue 視策略決定
            const inputValue: any = strategy === "sum"
                ? parseBitmaskToStringArray(Number(raw ?? 0), sumKeys ?? [])
                : strategy === "csv"
                ? String(raw ?? "")
                    .split(csvDelimiter)
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                : raw ?? (mode === "number" ? 0 : mode === "boolean" ? false : "");
            ensureDefaultOnce(appliedDefaultsRef, {
                key: `${String(table)}|${String(field)}|${JSON.stringify(rowKeys ?? {})}`,
                current: raw,
                mode,
                strategy,
                setType,
                writeBack: (dv) =>
                {
                    form.setFormData((prev: any) =>
                    {
                        if (!prev) return prev;
                        const currentTable = prev[table];
                        const nextCellValue = strategy === "sum"
                            ? (dv as any)
                            : strategy === "csv"
                            ? String(dv ?? "")
                            : coerce(mode, dv);
                        const nextTable = upsertRow(currentTable, rowKeys, field as any, nextCellValue);
                        return { ...prev, [table]: nextTable };
                    });
                },
            });
            const onChange = (v: unknown) =>
            {
                form.setFormData((prev: any) =>
                {
                    // 尚未有資料時，直接回傳原值
                    if (!prev) return prev;

                    const currentTable = prev[table];

                    // 根據策略先把要寫入的值算出來
                    const nextCellValue = strategy === "sum"
                        ? (sumStringArrayToBitmask(v as string[]) as any)
                        : strategy === "csv"
                        ? (Array.isArray(v) ? (v as string[]).join(csvDelimiter) : String(v ?? ""))
                        : coerce(mode, v);

                    const nextTable = upsertRow(currentTable, rowKeys, field as any, nextCellValue);
                    return { ...prev, [table]: nextTable };
                });
            };
            const bind = {
                ColumnDisplayName: label,
                InputValue: inputValue,
                OnChange: onChange,
            } as const;

            // 常用別名：維持你原本的呼叫習慣
            return { ...bind, Input: bind.InputValue, onChange: bind.OnChange };
        },
        [form.data, form.displayName, form.setFormData],
    );
};

interface UseSetTableFileFieldOptions
{
    /** 第一次上傳時，若檔名為空，要如何帶入預設值（original=全名；basename=去副檔名；none=不帶） */
    defaultNameFromOriginal?: "original" | "basename" | "none";
    /** 僅在目前檔名為空時才自動帶入（預設 true） */
    onlyFillNameIfEmpty?: boolean;
    // 底層預設值（新增明細時就可先帶）
    defaultWhen?: DefaultWhen; // 預設 "nullish"
    defaultId?: string; // 預設 FileId（通常空字串即可）
    defaultName?:
        | string
        | ((ctx: {
            table: string;
            rowKeys?: Record<string, unknown>;
        }) => string);
}
const deriveName = (
    originalName: string | undefined,
    mode: UseSetTableFileFieldOptions["defaultNameFromOriginal"] = "basename",
): string =>
{
    if (!originalName) return "";
    if (mode === "none") return "";
    if (mode === "basename") return originalName.replace(/\.[^.]+$/, "");
    return originalName; // original
};

/** 回傳給 <LibFileInput /> 可以直接展開的屬性 */
export interface FileFieldBindProps
{
    ColumnDisplayName: string;
    InputValue: string; // 檔名（可編輯）
    InternalId: string; // 檔案 internalId（唯讀顯示）
    onFileUploaded: (internalId: string, originalName?: string) => void;
    onNameChange: (name: string) => void; // 只有有提供檔名欄位時才會真的更新
}

export const useSetTableFileField = <TSet>(formData: FormDataLike<TSet>) =>
{
    // 🟢 新增：檔案欄位的寫回佇列
    const fileWritesRef = useRef<Array<() => void>>([]);
    // 🟢 新增：commit 後一次 flush
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
            // 讀取目前值（header 物件或 detail 陣列）
            let currentRow: any = undefined;
            if (Array.isArray(table))
            {
                currentRow = table.find((r: any) => matchRowKeys(r, rowKeys));
            } else if (table && typeof table === "object")
            {
                currentRow = table;
            }

            const currentId: string = String(currentRow?.[fileIdField] ?? "");
            const currentName: string = fileNameField ? String(currentRow?.[fileNameField] ?? "") : "";

            // 若為新增列且欄位為空，先灌入預設
            const fileDefaultWhen: DefaultWhen = opts?.defaultWhen ?? "nullish";

            const shouldDefault = (v: unknown) =>
            {
                const isEmptyStr = typeof v === "string" && v === "";
                const isNullish = v === null || v === undefined;
                switch (fileDefaultWhen)
                {
                    case "never":
                        return false;
                    case "nullish":
                        return isNullish;
                    case "empty":
                        return isNullish || isEmptyStr;
                    case "falsy":
                        return !v;
                }
            };

            if (shouldDefault(currentId) || shouldDefault(currentName))
            {
                formData.setFormData((prevAny: any) =>
                {
                    const prev = prevAny ?? {};
                    const t = prev?.[tableName];

                    const computeName = () =>
                    {
                        if (typeof opts?.defaultName === "function")
                        {
                            return (opts!.defaultName as any)({ table: tableName, rowKeys });
                        }
                        if (typeof opts?.defaultName === "string")
                        {
                            return opts!.defaultName;
                        }
                        return ""; // 預設空字串
                    };

                    const apply = (row: any) =>
                    {
                        const next = { ...(row ?? {}) };
                        // 只有該欄位需要且為空才寫入
                        if (fileNameField && shouldDefault(next[fileNameField]))
                        {
                            next[fileNameField] = computeName();
                        }
                        if (fileIdField && shouldDefault(next[fileIdField]))
                        {
                            next[fileIdField] = opts?.defaultId ?? "";
                        }
                        return next;
                    };

                    if (Array.isArray(t))
                    {
                        const nextList = (t ?? []).map((r: any) => (matchRowKeys(r, rowKeys) ? apply(r) : r));
                        return { ...prev, [tableName]: nextList };
                    } else if (t && typeof t === "object")
                    {
                        return { ...prev, [tableName]: apply(t) };
                    } else
                    {
                        return { ...prev, [tableName]: apply({}) };
                    }
                });
            }

            // 寫入工具：immutable 更新 header/detail
            const updateRow = (updater: (row: any) => any) =>
            {
                formData.setFormData((prevAny: any) =>
                {
                    const prev = prevAny ?? {};
                    const t = prev?.[tableName];

                    if (Array.isArray(t))
                    {
                        const nextList = (t ?? []).map((r: any) => (matchRowKeys(r, rowKeys) ? updater(r) : r));
                        return { ...prev, [tableName]: nextList };
                    } else if (t && typeof t === "object")
                    {
                        const nextObj = updater(t);
                        return { ...prev, [tableName]: nextObj };
                    } else
                    {
                        // 若不存在，建 header 物件
                        const nextObj = updater({});
                        return { ...prev, [tableName]: nextObj };
                    }
                });
            };

            const onlyFillIfEmpty = opts?.onlyFillNameIfEmpty ?? true;
            const nameMode = opts?.defaultNameFromOriginal ?? "basename";

            const onFileUploaded = (internalId: string, originalName?: string) =>
            {
                updateRow((row) =>
                {
                    const next: any = { ...row, [fileIdField]: internalId };
                    if (fileNameField)
                    {
                        const needFill = onlyFillIfEmpty ? !String(row?.[fileNameField] ?? "").trim() : true;
                        if (needFill)
                        {
                            next[fileNameField] = deriveName(originalName, nameMode);
                        }
                    }
                    return next;
                });
            };

            const onNameChange = (name: string) =>
            {
                if (!fileNameField) return; // 未提供檔名欄位就無動作
                updateRow((row) => ({ ...row, [fileNameField]: name }));
            };
            const label = getColumnDisplayName(formData.displayName ?? null, String(tableName), String(fileIdField))
                || `[${String(fileIdField)}]`;

            return {
                ColumnDisplayName: label,
                InputValue: fileNameField ? currentName : "", // 若沒提供檔名欄位就回空字串
                InternalId: currentId,
                onFileUploaded,
                onNameChange,
            };
        };
    }, [formData]);

    return setFileField;
};

export interface JsonFieldBinder<TJson extends object>
{
    /** 取出完整 JSON 物件（已做安全解析 + 預設值套用） */
    get: () => TJson;
    /** 直接整包寫回（會自動 JSON.stringify） */
    set: (next: TJson) => void;
    /**
     * 綁定某個 JSON 內 key（支援 string / number / csv 三種 UI 型別）
     * - string: 直接存字串
     * - number: 轉成 number 後存
     * - csv: 以陣列<string> 映射 UI，入庫時存 "a,b,c" 這種字串
     */
    bind: <K extends keyof TJson>(
        key: K,
        mode?: "string" | "number" | "csv",
    ) => {
        value: any; // 給 UI 用的值（csv 會是 string[]）
        onChange: (v: any) => void; // 給 UI 用的改變事件
    };
}

const safeParse = <T extends object>(raw: unknown, fallback: T): T =>
{
    if (typeof raw !== "string" || raw.trim() === "") return fallback;
    try
    {
        const obj = JSON.parse(raw);
        return (obj && typeof obj === "object") ? { ...fallback, ...obj } : fallback;
    } catch
    {
        return fallback;
    }
};

const toCSV = (arr: string[] | number[] | undefined | null) => (arr ?? []).map(String).filter(Boolean).join(",");

const fromCSV = (s: string | undefined | null) => (s ?? "").split(",").map(x => x.trim()).filter(Boolean);

export const useSetJsonField = <TSet, TJson extends Record<string, any>>(
    formData: UseFetchFormDataResult<TSet>, // 🟢 1) 型別改成 UseFetchFormDataResult<TSet>
    tableName: string,
    fieldName: string, // 目標 JSON 欄位（如 ModuleOptions）
    rowKeys: Record<string, any>, // 定位該列的 keys（SiteIndex+ItemRowId）
    defaults: TJson, // JSON 預設值
): JsonFieldBinder<TJson> =>
{
    const setField = useSetTableField<TSet>(formData);

    const base = useMemo(
        () => setField(tableName as any, fieldName as any, "string", rowKeys),
        [setField, tableName, fieldName, rowKeys],
    );

    const get = () => safeParse<TJson>(base.InputValue as any, defaults); // 🟢 2) 用 InputValue
    const set = (next: TJson) => base.onChange?.(JSON.stringify(next)); // 🟢 2) 用 onChange

    const bind = <K extends keyof TJson>(key: K, mode: "string" | "number" | "csv" = "string") =>
    {
        const json = get();
        const rawVal = (json as any)[key];

        const value = mode === "csv"
            ? fromCSV(String(rawVal ?? ""))
            : mode === "number"
            ? Number(rawVal ?? 0)
            : String(rawVal ?? "");

        const onChange = (uiVal: any) =>
        {
            const next: any = { ...json }; // 🟢 3) 用 any 解除 TJson[K] 限制
            if (mode === "csv") next[key as any] = toCSV(uiVal as string[]);
            else if (mode === "number")
            {
                const n = Number(uiVal);
                next[key as any] = Number.isFinite(n) ? n : 0;
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

// /SysCore/Components/FormField/useSetDateRangeField.ts
import type { ILibDatetimeRangeProp } from "@/SysCore/Components/FormField/FieldComponets/LibDatetimeRange_Comp";

type RangeBind = Omit<ILibDatetimeRangeProp, "Style" | "valueType" | "disabled">;

// 跟 useSetTableField 一樣綁在 formData 上
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

        // 共用一個 normalize：空字串 / null / undefined 都轉成 null
        const normalize = (val: string | null | undefined) =>
        {
            if (val == null) return null;
            const s = String(val).trim();
            return s === "" ? null : s;
        };

        return {
            ColumnDisplayName: start.ColumnDisplayName,
            // 給 UI 顯示的值：null 就顯示成 ""，避免 uncontrolled warning
            StartValue: ((start.InputValue ?? "") as string),
            EndValue: ((end.InputValue ?? "") as string),
            onChangeStart: (val) =>
            {
                start.onChange?.(normalize(val));
            },
            onChangeEnd: (val) =>
            {
                end.onChange?.(normalize(val));
            },
        };
    };
};
