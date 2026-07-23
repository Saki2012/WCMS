import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { findTextByKey } from "@/SysCore/Utils/Library/LibData";

// #region Property
interface ClientCategoryDictRow
{
    /** 分類主資料 */
    CategoryId?: string | number | null;

    /** 分類多語明細 */
    _CategoryDetail?: ({ Lang?: Lang | string | null; CategoryName?: string | null; } | null)[] | null;
}

interface ClientTagDictRow
{
    /** 標籤主資料 */
    TagId?: string | number | null;

    /** 標籤多語明細 */
    _TagDetail?: ({ Lang?: Lang | string | null; TagName?: string | null; } | null)[] | null;
}

interface ClientAnnouncementKeySource
{
    /** 公告資料 */
    Announcement?: { InternalId?: string | null; AnnouncementId?: string | number | null; } | null;
}

interface ClientGalleryKeySource
{
    /** 相簿資料 */
    Gallery?: { InternalId?: string | null; GalleryId?: string | number | null; } | null;
}
// #endregion

// #region Public
/** 建立 Client Adapter initial 資料結構 */
export const buildClientListInitial = <TArgs, TItem>(args: TArgs, data: TItem[]): ApiLoaderData<TArgs, TItem[]> =>
{
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};

/** 先取置頂資料，再以一般資料補滿指定數量 */
export const takeTopThenFill = <T>(top: T[] | undefined, rest: T[] | undefined, limit: number, getKey: (item: T) => string): T[] =>
{
    const result: T[] = [];
    const seen = new Set<string>();
    pushUniqueItems(result, seen, top, limit, getKey);
    pushUniqueItems(result, seen, rest, limit, getKey);

    return result;
};

/** 將分類資料轉為前台顯示文字字典 */
export const buildClientCategoryTextDict = <T extends ClientCategoryDictRow>(list: T[], lang: Lang): Record<string, string> =>
{
    const pairs = list.map((item) => buildCategoryPair(item, lang)).filter(([id]) => Boolean(id));
    return Object.fromEntries(pairs);
};

/** 將標籤資料轉為前台顯示文字字典 */
export const buildClientTagTextDict = <T extends ClientTagDictRow>(list: T[], lang: Lang): Record<string, string> =>
{
    const pairs = list.map((item) => buildTagPair(item, lang)).filter(([id]) => Boolean(id));
    return Object.fromEntries(pairs);
};

/** 取得公告資料唯一識別值 */
export const getAnnouncementSetKey = (item: ClientAnnouncementKeySource): string =>
{
    return item.Announcement?.InternalId ?? `${item.Announcement?.AnnouncementId ?? ""}`;
};

/** 取得相簿資料唯一識別值 */
export const getGallerySetKey = (item: ClientGalleryKeySource): string =>
{
    return item.Gallery?.InternalId ?? `${item.Gallery?.GalleryId ?? ""}`;
};

/** 延遲指定毫秒數 */
export const delayMs = (ms: number): Promise<void> =>
{
    return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
};
// #endregion

// #region Private
/** 依序推入未重複資料 */
const pushUniqueItems = <T>(result: T[], seen: Set<string>, source: T[] | undefined, limit: number, getKey: (item: T) => string): void =>
{
    for (const item of source ?? [])
    {
        pushUniqueItem(result, seen, item, limit, getKey);
        if (result.length >= limit) return;
    }
};

/** 推入單筆未重複資料 */
const pushUniqueItem = <T>(result: T[], seen: Set<string>, item: T, limit: number, getKey: (item: T) => string): void =>
{
    const key = getKey(item);
    if (!key || seen.has(key) || result.length >= limit) return;

    seen.add(key);
    result.push(item);
};

/** 建立分類字典 pair */
const buildCategoryPair = (item: ClientCategoryDictRow, lang: Lang): readonly [string, string] =>
{
    const id = `${item.CategoryId ?? ""}`;
    const name = findTextByKey(item._CategoryDetail, (detail) => detail?.Lang, lang, (detail) => detail?.CategoryName);

    return [id, name] as const;
};

/** 建立標籤字典 pair */
const buildTagPair = (item: ClientTagDictRow, lang: Lang): readonly [string, string] =>
{
    const id = `${item.TagId ?? ""}`;
    const name = findTextByKey(item._TagDetail, (detail) => detail?.Lang, lang, (detail) => detail?.TagName);

    return [id, name] as const;
};
// #endregion
