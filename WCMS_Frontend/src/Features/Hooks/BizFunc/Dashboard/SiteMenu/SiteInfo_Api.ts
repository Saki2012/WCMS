import { ApiDataAdapter, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

class SiteMenuService extends ApiDataService<SiteMenuSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        // 宣告變數 + 執行 super
        super(PGID.SiteMenu, apiInstance);
    }
}

// #region private Func

export const buildSiteMenuIndexListParam = (): QueryListParam =>
{
    // 宣告變數：只需要 InternalId（拿第一筆）
    const fields: string[] = [
        SchemaFields.SiteMenu_IndexFields.InternalId,
    ];

    // return
    return {
        Fields: fields,
        PageNumber: 0,
        PageSize: 50,
        // Condition/OrderBy 若你原本 GetSiteMenuListOpt 有排序條件，下一步再補上
    };
};

// #endregion

export const SiteMenuAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<SiteMenuSet, SiteMenuService>(
        (api?: AxiosInstance) => new SiteMenuService(api ?? apiInstance),
    );

    const useSiteMenuIndexList = (opt?: {
        apiInstance?: AxiosInstance;
        deps?: EffectDeps;
    }) =>
    {
        // 宣告變數
        const deps = opt?.deps ?? [];

        // return：沿用基底 useQueryList
        return adapter.hooks.useQueryList({
            condition: buildSiteMenuIndexListParam(),
            deps,
            apiInstance: opt?.apiInstance,
        });
    };

    const useFirstSiteMenuInternalId = (opt?: {
        apiInstance?: AxiosInstance;
        deps?: EffectDeps;
    }) =>
    {
        // 宣告變數
        const list = useSiteMenuIndexList({ apiInstance: opt?.apiInstance, deps: opt?.deps });

        const internalId = useMemo<string | null>(() =>
        {
            const rows = list.data ?? [];
            const first = rows.find(x => x?.SiteMenu_Index?.InternalId)?.SiteMenu_Index?.InternalId;
            return first ?? null;
        }, [list.data]);

        // return
        return { internalId, isLoading: list.isLoading };
    };

    // ✅ 關鍵：照 Category 做法擴充 hooks
    const extAdapter = adapter as ApiDataAdapter<SiteMenuSet, SiteMenuService> & {
        hooks: typeof adapter.hooks & {
            useSiteMenuIndexList: typeof useSiteMenuIndexList;
            useFirstSiteMenuInternalId: typeof useFirstSiteMenuInternalId;
        };
    };

    extAdapter.hooks = {
        ...adapter.hooks,
        useSiteMenuIndexList,
        useFirstSiteMenuInternalId,
    };

    // return
    return extAdapter;
};
