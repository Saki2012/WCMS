// hooks/useSetTableField.ts
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
import * as React from "react";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { UseFetchFormDataResult } from "../../Utils/API/FetchFormData";
type CoerceMode = "string" | "number" | "boolean" | ((v: unknown) => any);

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
        case "string":
        default:
            return String(val ?? "").trim();
    }
};

const getColumnDisplayName = (schema: ModelDisplaySchema | null, tableName: string, columnId: string): string =>
{
    return (
        schema?.Tables?.find(t => t.TableId === tableName)?.Columns?.find((c: any) => c.ColumnId === columnId)
            ?.ColumnDisplayName ?? ""
    );
};
type RowLike = Record<string, any>;
const getKey = (row: RowLike, rowKey?: string) =>
    row?.[rowKey ?? "RowId"] ?? row?.RowId ?? row?.rowId ?? row?.Id ?? row?.id;
type TableType<T, K extends keyof T> = NonNullable<T[K]>;
type RowType<X> = X extends (infer U)[] ? NonNullable<U> : NonNullable<X>;
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
    };
export const useSetTableField = <T>(form: UseFetchFormDataResult<T>) =>
{
    return React.useCallback(
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

            const label = getColumnDisplayName(form.displayName, String(table), String(field))
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

                    // 陣列表（需 rowKeys 來定位）
                    if (Array.isArray(currentTable))
                    {
                        const nextRows = (currentTable as RowLike[]).map(r =>
                            matchRowKeys(r, rowKeys) ? { ...r, [field as any]: nextCellValue } : r
                        );

                        return { ...prev, [table]: nextRows };
                    }
                    // 單一物件
                    return { ...prev, [table]: { ...(currentTable ?? {}), [field as any]: nextCellValue } };
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
    InputValue: string; // 檔名（可編輯）
    InternalId: string; // 檔案 internalId（唯讀顯示）
    onFileUploaded: (internalId: string, originalName?: string) => void;
    onNameChange: (name: string) => void; // 只有有提供檔名欄位時才會真的更新
}

export const useSetTableFileField = <TSet>(formData: UseFetchFormDataResult<TSet>) =>
{
    const setFileField = React.useMemo(() =>
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

            return {
                InputValue: fileNameField ? currentName : "", // 若沒提供檔名欄位就回空字串
                InternalId: currentId,
                onFileUploaded,
                onNameChange,
            };
        };
    }, [formData]);

    return setFileField;
};
