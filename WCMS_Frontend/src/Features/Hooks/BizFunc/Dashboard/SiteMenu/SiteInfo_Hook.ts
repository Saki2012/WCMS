// SiteMenu_ListOpt.ts
import SiteMenuProvider from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Api";
import type { UseGridListOptions } from "@/SysCore/Utils/API/FetchGridListData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export const GetSiteMenuListOpt = (): UseGridListOptions<SiteMenuSet> =>
{
    const provider = SiteMenuProvider();
    return {
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond: QueryListParam) => provider.fetchList(cond),
        fetchListCount: (cond: QueryListParam) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: (): QueryListParam => ({
            Fields: [
                SchemaFields.SiteMenu_IndexFields.InternalId,
                SchemaFields.SiteMenu_IndexFields.SiteIndex,
            ],
            Condition: "",
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    };
};
