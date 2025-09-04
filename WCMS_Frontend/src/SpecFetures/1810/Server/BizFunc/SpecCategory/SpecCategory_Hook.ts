import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import type { components } from "../../../../../types/api";
import SpecCategoryProvider from "./SpecCategory_Api";
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
import * as SchemaFields from "../../../../../types/SchemaFields";

export const useGetShowColumnItems = (categoryId: string) =>
{
    const provider = SpecCategoryProvider();
    return useFetchGridListData<SpecCategorySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.SpecCategoryModelFields.InternalId,
                SchemaFields.SpecCategoryModelFields.CategoryId,
                SchemaFields.SpecCategoryModelFields.ProgId,
                SchemaFields.SpecCategoryModelFields.ShowColumnItems,
            ],
            Condition: `${SchemaFields.SpecCategoryModelFields.CategoryId} = ${categoryId}`,
            OrderBy: [{ Col: SchemaFields.SpecCategoryModelFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [categoryId],
    });
};
