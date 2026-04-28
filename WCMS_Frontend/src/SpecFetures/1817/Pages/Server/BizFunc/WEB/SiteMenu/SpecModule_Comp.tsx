import type { SiteMenuItem } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField } from "@/SysCore/Components/FormField/useSetTableField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

interface ModuleOptionsJson
{
    PageId: string;
    Category: string;
    Tag: string;
    Style: number;
}

const moduleOptionsDefaults: ModuleOptionsJson = { PageId: "", Category: "", Tag: "", Style: 1 };

export const Module_SpecMusical_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
    },
): React.ReactNode =>
{
    const curRowKeys = {
        [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex,
        [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId,
    };
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const catBind = binder.bind("Category", "string");
    const cateDic = useGetCategoryDict(PGID.SpecMusical, prop.lang, prop.categorySets);
    return (
        <LibDropList
            Style={prop.theme.DropList}
            ColumnDisplayName="類別"
            Options={cateDic}
            InputValue={catBind.value}
            onChange={catBind.onChange}
            AutoDefaultFirst={false}
        />
    );
};

const useGetCategoryDict = (progId: PGID, lang: Lang, categorySets: CategorySet[]) =>
{
    const cateDic = useMemo<Map<string, string>>(() =>
    {
        const src = categorySets.filter(p => p.Category?.ProgId === progId) ?? [];
        return src.reduce<Map<string, string>>((acc, item: CategorySet) =>
        {
            const key = item.Category?.CategoryId?.toString?.();
            if (!key) return acc;
            acc.set(key, item.CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [progId, lang, categorySets]);
    return cateDic;
};
