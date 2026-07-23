import type { components } from "@/types/api";
import { useEffect } from "react";

// #region Property
export type Lang = components["schemas"]["LangCode"];

type LangDetailRow = {
    Lang?: Lang | null;
    RowId?: number | null;
    RowNo?: number | null;
} & Record<string, unknown>;

type LangDetailCollectionKey<TFormModel extends object> = {
    [TKey in keyof TFormModel]-?: NonNullable<TFormModel[TKey]> extends Array<infer TDetail>
        ? TDetail extends { Lang?: unknown; } ? TKey : never
        : never;
}[keyof TFormModel];

type LangDetailRowByKey<TFormModel extends object, TDetailKey extends keyof TFormModel> =
    (NonNullable<TFormModel[TDetailKey]> extends Array<infer TDetail> ? TDetail : never) & LangDetailRow;

interface LangFormModelBinding<TFormModel>
{
    data: TFormModel;
    setFormData: (updater: TFormModel | ((prev: TFormModel) => TFormModel)) => void;
}

interface EnsureLangDetailsOptions<TFormModel extends object, TDetailKey extends LangDetailCollectionKey<TFormModel>>
{
    /** FormModel 根層的多語系 Detail collection 欄位。 */
    detailName: TDetailKey;
    /** Root 與 Detail 共用的關聯鍵，例如 AnnouncementId。 */
    parentKeys: readonly string[];
    /** 要補齊的語系列表，未提供時使用系統支援語系。 */
    langs?: readonly Lang[];
    /** 新增缺少語系及畫面排列時優先顯示的語系。 */
    preferFirstLang?: Lang;
}
// #endregion

// #region Public
/** 暫由前端提供語系顯示名稱，後續應改由後端或 SiteInfo 提供。 */
export const LangLabelMap: Record<Lang, string> = { "zh-tw": "中文", "zh-cn": "简体中文", "en": "English" };

/** 取得語系顯示名稱，未知語系保留原始代碼。 */
export const getLangLabel = (code?: string): string =>
{
    const key = normalizeLangCode(code);
    return key ? LangLabelMap[key] ?? code ?? "" : code ?? "";
};

/** 預設語系，後續應由 SiteInfo 設定提供。 */
export const DefaultLang: Lang = "zh-tw";

/** 系統支援語系，後續應由 SiteInfo 設定提供。 */
export const SUPPORTED_LANGS: Lang[] = ["zh-tw", "en"];

/** 判斷語系是否屬於系統支援範圍。 */
export const isSupportedLang = (value?: Lang | string | null): value is Lang =>
{
    return SUPPORTED_LANGS.includes(String(value ?? "").trim().toLowerCase() as Lang);
};

/**
 * 補齊 FormModel 根層的多語系 Detail collection。
 *
 * 本 Hook 僅處理 `FormModel._Detail[]`；Detail 內再包含 SubDetail 的情境，
 * 應由功能 Hook 依父層 RowId 在巢狀資料內處理，避免退回舊 Set 的平面集合邏輯。
 */
export const useEnsureLangDetails = <
    TFormModel extends object,
    TDetailKey extends LangDetailCollectionKey<TFormModel>,
>(
    formData: LangFormModelBinding<TFormModel>,
    options: EnsureLangDetailsOptions<TFormModel, TDetailKey>,
): void =>
{
    const detailName = String(options.detailName);
    const parentKeysSignature = options.parentKeys.join("|");
    const langSignature = (options.langs ?? SUPPORTED_LANGS).join("|");
    useEffect(() =>
    {
        if (!formData.data) return;
        formData.setFormData(prev => ensureFormModelLangDetails(prev, options));
    }, [
        formData.data,
        formData.setFormData,
        detailName,
        parentKeysSignature,
        langSignature,
        options.preferFirstLang,
    ]);
};

/** 正規化語系代碼，僅允許系統支援語系。 */
export const normalizeSupportedLang = (lang?: Lang): Lang | null =>
{
    const value = normalizeLangCode(lang);
    return value && isSupportedLang(value) ? value : null;
};

/** 建立支援語系排序，目前語系會優先排在第一個。 */
export const buildSupportedLangOrder = (preferLang?: Lang): Lang[] =>
{
    const normalizedPreferLang = normalizeSupportedLang(preferLang);
    const langs = normalizedPreferLang ? [normalizedPreferLang, ...SUPPORTED_LANGS] : [...SUPPORTED_LANGS];
    return langs.filter((lang, index) => langs.indexOf(lang) === index);
};
// #endregion

// #region Private
/** 依 FormModel 與設定補齊根層多語系 Detail。 */
const ensureFormModelLangDetails = <
    TFormModel extends object,
    TDetailKey extends LangDetailCollectionKey<TFormModel>,
>(
    formModel: TFormModel,
    options: EnsureLangDetailsOptions<TFormModel, TDetailKey>,
): TFormModel =>
{
    const detailName = options.detailName;
    const details = readDetailRows<TFormModel, TDetailKey>(formModel, detailName);
    const langs = resolveEnsureLangOrder(options.langs, options.preferFirstLang);
    const nextDetails = appendMissingLangDetails(formModel, details, options.parentKeys, langs);
    const orderedDetails = orderLangDetails(nextDetails, options.preferFirstLang);
    if (isSameRowOrder(details, orderedDetails)) return formModel;
    return { ...formModel, [detailName]: orderedDetails } as TFormModel;
};

/** 讀取 FormModel 根層 Detail collection。 */
const readDetailRows = <
    TFormModel extends object,
    TDetailKey extends keyof TFormModel,
>(
    formModel: TFormModel,
    detailName: TDetailKey,
): Array<LangDetailRowByKey<TFormModel, TDetailKey>> =>
{
    const value = formModel[detailName];
    return Array.isArray(value) ? [...value] as Array<LangDetailRowByKey<TFormModel, TDetailKey>> : [];
};

/** 建立本次需要補齊的語系順序。 */
const resolveEnsureLangOrder = (langs: readonly Lang[] | undefined, preferLang?: Lang): Lang[] =>
{
    const source = langs?.length ? langs : SUPPORTED_LANGS;
    const normalized = source.map(normalizeLangCode).filter((lang): lang is Lang => lang !== null);
    const prefer = normalizeLangCode(preferLang);
    const ordered = prefer && normalized.includes(prefer) ? [prefer, ...normalized] : normalized;
    return ordered.filter((lang, index) => ordered.indexOf(lang) === index);
};

/** 為缺少的語系建立 Detail row，不移除後端既有的重複或額外語系資料。 */
const appendMissingLangDetails = <TFormModel extends object, TDetail extends LangDetailRow>(
    formModel: TFormModel,
    details: TDetail[],
    parentKeys: readonly string[],
    langs: readonly Lang[],
): TDetail[] =>
{
    const existingLangs = new Set(details.map(detail => normalizeLangCode(detail.Lang)).filter(Boolean));
    const missingLangs = langs.filter(lang => !existingLangs.has(lang));
    if (missingLangs.length === 0) return details;
    const parentValues = resolveParentValues(formModel, details, parentKeys);
    const maxRowId = getMaxNumber(details, "RowId");
    const maxRowNo = getMaxNumber(details, "RowNo");
    const appended = missingLangs.map((lang, index) => ({
        ...parentValues,
        RowId: maxRowId + index + 1,
        RowNo: maxRowNo + index + 1,
        Lang: lang,
    }) as TDetail);
    return [...details, ...appended];
};

/** 取得新 Detail row 需要的 Root 關聯鍵。 */
const resolveParentValues = <TFormModel extends object>(
    formModel: TFormModel,
    details: LangDetailRow[],
    parentKeys: readonly string[],
): Record<string, unknown> =>
{
    const root = formModel as Record<string, unknown>;
    const firstDetail = details[0] ?? {};
    return parentKeys.reduce<Record<string, unknown>>((result, key) =>
    {
        result[key] = root[key] ?? firstDetail[key] ?? null;
        return result;
    }, {});
};

/** 依偏好語系調整畫面使用的 Detail 順序，保留每筆原始 RowNo。 */
const orderLangDetails = <TDetail extends LangDetailRow>(details: TDetail[], preferLang?: Lang): TDetail[] =>
{
    const prefer = normalizeLangCode(preferLang);
    if (!prefer) return details;
    return details
        .map((detail, index) => ({ detail, index }))
        .sort((left, right) =>
        {
            const leftRank = normalizeLangCode(left.detail.Lang) === prefer ? 0 : 1;
            const rightRank = normalizeLangCode(right.detail.Lang) === prefer ? 0 : 1;
            return leftRank - rightRank || left.index - right.index;
        })
        .map(item => item.detail);
};

/** 比較 Detail reference 與排列是否完全相同。 */
const isSameRowOrder = <TDetail>(current: TDetail[], next: TDetail[]): boolean =>
{
    return current.length === next.length && current.every((detail, index) => detail === next[index]);
};

/** 取得 Detail 指定數字欄位的最大值。 */
const getMaxNumber = (details: LangDetailRow[], field: "RowId" | "RowNo"): number =>
{
    return details.reduce((max, detail) => Math.max(max, Number(detail[field] ?? 0)), 0);
};

/** 正規化語系代碼格式。 */
const normalizeLangCode = (value?: Lang | string | null): Lang | null =>
{
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized ? normalized as Lang : null;
};
// #endregion
