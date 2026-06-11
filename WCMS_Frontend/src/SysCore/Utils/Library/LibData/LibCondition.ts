import { mergeText, safeTrim, wrapSingleQuote } from "./LibText";

// #region Property
/** 條件合併模式 */
export type JoinMode = typeof JoinMode[keyof typeof JoinMode];

/** 條件運算子 */
export type Operator = typeof Operator[keyof typeof Operator];

/** 條件可接受的值 */
export type ConditionValue = string | number | boolean | Date | Array<string | number | boolean> | null | undefined;

/** 條件來源，可傳完整條件字串或參數化條件物件 */
export type ConditionSource = string | ConditionItem | null | undefined;

/** 參數化條件項目 */
export interface ConditionItem
{
    /** 後端欄位名稱 */
    FieldName: string;
    /** 後端條件運算子 */
    Operator: Operator;
    /** 條件值，IsNull / IsNotNull 可不傳 */
    Value?: ConditionValue;
    /** 是否允許空值也建立條件 */
    AllowEmptyValue?: boolean;
}
// #endregion

// #region Public
/** 條件合併模式，對應後端 And / Or */
export const JoinMode = { And: "And", Or: "Or" } as const;

/** 條件運算子，對應後端 NormalizeCondition 可解析的 operator */
export const Operator = {
    Equal: "=",
    EqualStrict: "==",
    NotEqual: "!=",
    GreaterThan: ">",
    GreaterThanOrEqual: ">=",
    LessThan: "<",
    LessThanOrEqual: "<=",
    In: "In",
    NotIn: "Not In",
    Like: "Like",
    IsNull: "Is Null",
    IsNotNull: "Is Not Null",
    HasAny: "HasAny",
    HasAll: "HasAll",
    HasAllOf: "HasAllOf",
    BitwiseHasAny: "&",
    BitwiseHasNone: "!&",
} as const;

/** 合併條件文字或參數化條件 */
export const joinConditions = (conditions: ConditionSource[], mode: JoinMode = JoinMode.And): string =>
{
    const validConditions = normalizeConditionSources(conditions);
    const separator = ` ${mode} `;
    const condition = mergeText(separator, { hasEmpty: false }, ...validConditions);
    // TODO: 如果mode為Or的話，要不要自動包一個()?
    return condition;
};
/** 建立參數化條件項目 */
export const createCondition = (fieldName: string, operator: Operator, value?: ConditionValue, allowEmptyValue = false): ConditionItem =>
{
    return { FieldName: fieldName, Operator: operator, Value: value, AllowEmptyValue: allowEmptyValue };
};

/** 將條件值包成單引號，保留特殊條件需要自行組字串時使用 */
export const quoteConditionValue = (value: string | number | boolean | null | undefined): string =>
{
    return wrapSingleQuote(value);
};

/** Escape 查詢條件值中的雙引號，保留特殊條件需要自行組字串時使用 */
export const escapeConditionValue = (value: string | number | boolean | null | undefined): string =>
{
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, `""`);
    return escaped;
};
// #endregion

// #region Private
/** 將條件來源轉換成有效條件字串 */
const normalizeConditionSources = (conditions: ConditionSource[]): string[] =>
{
    return conditions.map((item) => normalizeConditionSource(item)).filter(isValidCondition).map((item) => item.trim());
};

/** 將單筆條件來源轉換成條件字串 */
const normalizeConditionSource = (condition: ConditionSource): string | null =>
{
    if (typeof condition === "string") return condition;
    if (!condition) return null;

    return buildConditionText(condition);
};

/** 建立單筆參數化條件字串 */
const buildConditionText = (condition: ConditionItem): string | null =>
{
    const fieldName = safeTrim(condition.FieldName);
    const operator = safeTrim(condition.Operator) as Operator;
    if (!fieldName || !operator) return null;

    if (isNullOperator(operator)) return `${fieldName} ${operator}`;
    if (!condition.AllowEmptyValue && isEmptyConditionValue(condition.Value)) return null;
    const valueText = formatConditionValue(condition.Value, operator);
    return `${fieldName} ${operator} ${valueText}`;
};

/** 判斷是否為 null 判斷運算子 */
const isNullOperator = (operator: Operator): boolean =>
{
    return operator === Operator.IsNull || operator === Operator.IsNotNull;
};

/** 判斷條件值是否可略過 */
const isEmptyConditionValue = (value: ConditionValue): boolean =>
{
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim().length === 0) return true;
    if (Array.isArray(value) && value.length === 0) return true;

    return false;
};

/** 依運算子與型態格式化條件值 */
const formatConditionValue = (value: ConditionValue, operator: Operator): string =>
{
    if (Array.isArray(value)) return formatConditionArrayValue(value, operator);
    if (operator === Operator.BitwiseHasAny || operator === Operator.BitwiseHasNone) return String(value ?? "");
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Date) return wrapDoubleQuote(value.toISOString());

    return wrapDoubleQuote(value);
};

/** 格式化陣列型條件值 */
const formatConditionArrayValue = (values: Array<string | number | boolean>, operator: Operator): string =>
{
    const valueTexts = values.map((item) => formatConditionArrayItem(item));
    const separator = isBitwiseOperator(operator) ? "|" : ",";
    const merged = mergeText(separator, { hasEmpty: false }, ...valueTexts);

    return isListOperator(operator) ? `(${merged})` : merged;
};

/** 格式化陣列中的單一條件值 */
const formatConditionArrayItem = (value: string | number | boolean): string =>
{
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    return wrapDoubleQuote(value);
};

/** 判斷是否為清單型運算子 */
const isListOperator = (operator: Operator): boolean =>
{
    return operator === Operator.In
        || operator === Operator.NotIn
        || operator === Operator.HasAny
        || operator === Operator.HasAll
        || operator === Operator.HasAllOf;
};

/** 判斷是否為位元條件運算子 */
const isBitwiseOperator = (operator: Operator): boolean =>
{
    return operator === Operator.BitwiseHasAny || operator === Operator.BitwiseHasNone;
};

/** 將條件值包成雙引號並處理雙引號跳脫 */
const wrapDoubleQuote = (value: unknown): string =>
{
    const text = escapeConditionValue(value as string | number | boolean | null | undefined);
    return `"${text}"`;
};

/** 判斷條件文字是否有效 */
const isValidCondition = (value: string | null | undefined): value is string =>
{
    return typeof value === "string" && value.trim().length > 0;
};
// #endregion
