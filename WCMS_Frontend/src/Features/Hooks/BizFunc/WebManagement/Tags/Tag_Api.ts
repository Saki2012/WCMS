import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type TagSet = components["schemas"]["TagSet_DTO"];
type TagDetail = components["schemas"]["TagDetail_DTO"];

class TagService extends ApiDataService<TagSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Tag, apiInstance);
    }
}

const escapeQueryString = (value: string): string =>
{
    // 宣告變數
    const escaped = value.replace(/"/g, `""`);

    // return
    return escaped;
};

export const buildTagQueryByProgIdParam = (opt: { progId: string; lang?: Lang; pageSize?: number; }): QueryListParam =>
{
    // 宣告變數
    const progId = escapeQueryString(opt.progId);
    const lang = opt.lang ? escapeQueryString(opt.lang) : null;

    const fields: string[] = [
        TagDataFields.TagId,
        TagDataFields.InternalId,
        `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
        `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
    ];

    const condLang = lang
        ? ` And ${TagDataFields._TagDetail}.${TagDetailFields.Lang} = "${lang}"`
        : "";

    // return
    return {
        Fields: fields,
        Condition: `${TagDataFields.ProgId} = "${progId}"${condLang}`,
        OrderBy: [{ Col: TagDataFields.CreateTime, Desc: false }],
        PageNumber: 0,
        PageSize: opt.pageSize ?? 0,
    };
};

/**
 * ✅ 命名不變
 * - 擴充 adapter.hooks：useMapByProgId（後台 CSR 用，先不做 loader）
 */
export const TagAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<TagSet, TagService>(
        (api?: AxiosInstance) => new TagService(api ?? apiInstance),
    );

    const useMapByProgId = (opt: {
        progId: string;
        lang: Lang;
        pageSize?: number;
        apiInstance?: AxiosInstance;
        deps?: EffectDeps;
    }) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize];

        // 執行 function：沿用基底 useQueryList
        const query = adapter.hooks.useQueryList({
            condition: buildTagQueryByProgIdParam({
                progId: opt.progId,
                lang: opt.lang,
                pageSize: opt.pageSize,
            }),
            deps,
            apiInstance: opt.apiInstance,
        });

        const map = useMemo<Record<string, string>>(() =>
        {
            const rows = query.data ?? [];
            return rows.reduce((acc, p) =>
            {
                const id = p.TagData?.TagId;
                if (!id) return acc;

                const matched = (p.TagDetail ?? []).find((d: TagDetail) => d.Lang === opt.lang);
                acc[String(id)] = matched?.TagName ?? "";
                return acc;
            }, {} as Record<string, string>);
        }, [query.data, opt.lang]);

        // return
        return { ...query, map };
    };

    // ✅ 關鍵：擴充 hooks 但不展平 adapter（保留 prototype method：useServerActions）
    const extAdapter = adapter as ApiDataAdapter<TagSet, TagService> & {
        hooks: typeof adapter.hooks & { useMapByProgId: typeof useMapByProgId; };
    };

    extAdapter.hooks = {
        ...adapter.hooks,
        useMapByProgId,
    };

    // return：仍是 ApiDataAdapter instance（保留 prototype method：useServerActions）
    return extAdapter;
};

/** 純格式化：把 "1,2,3" 轉成 "標籤A、標籤B"（先放同檔案外層，後續你再抽） */
export const formatTagsName = (content: string, tagData: TagSet[], lang: Lang): string =>
{
    // 宣告變數
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";

    // return
    return raw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(tagId =>
            tagData?.find(s => String(s.TagData?.TagId) === tagId)
                ?.TagDetail?.find(d => d.Lang === lang)
                ?.TagName
        )
        .filter((x): x is string => Boolean(x))
        .join("、");
};
