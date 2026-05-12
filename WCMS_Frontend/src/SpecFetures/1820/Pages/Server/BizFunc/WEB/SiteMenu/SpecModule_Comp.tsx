import type { SiteMenuItem } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField } from "@/SysCore/Components/FormField/useSetTableField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type PageSet = components["schemas"]["PageManagementSet_DTO"];

export interface Module_SpecProduction_OptionsJson
{
    CategoryId: string;
    TagIds: string;
    PageId: string;
}

const moduleOptionsDefaults: Module_SpecProduction_OptionsJson = { CategoryId: "", TagIds: "", PageId: "" };

export const Module_SpecProduction_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
        pageSets: PageSet[];
    },
): React.ReactNode =>
{
    const curRowKeys = {
        [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex,
        [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId,
    };

    const binder = useSetJsonField<SiteMenuSet, Module_SpecProduction_OptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );

    const categoryBind = binder.bind("CategoryId", "string");
    const tagBind = binder.bind("TagIds", "csv");
    const pageBind = binder.bind("PageId", "string");
    const categoryOptions = useGetCategoryDict(PGID.Material, prop.lang, prop.categorySets);
    const tagOptions = useGetTagDict(PGID.Material, prop.lang, prop.tagSets);
    const pageOpts = useMemo(() => buildPageMapByProgId(prop.pageSets, PGID.Material, prop.lang), [prop.pageSets, prop.lang]);
    return (
        <>
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="物件類別"
                Options={categoryOptions}
                InputValue={categoryBind.value}
                onChange={categoryBind.onChange}
                AutoDefaultFirst={false}
            />

            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤條件" options={tagOptions} InputValue={tagBind.value} onChange={tagBind.onChange} />

            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="介紹頁面"
                Options={pageOpts}
                InputValue={pageBind.value}
                onChange={pageBind.onChange}
                AutoDefaultFirst={false}
            />
        </>
    );
};

/** 取得物件類別下拉選單 */
const useGetCategoryDict = (progId: PGID, lang: Lang, categorySets: CategorySet[]) =>
{
    const cateDic = useMemo<Map<string, string>>(() =>
    {
        const src = categorySets.filter(p => p.Category?.ProgId === progId) ?? [];

        return src.reduce<Map<string, string>>((acc, item) =>
        {
            const key = item.Category?.CategoryId?.toString?.();
            if (!key) return acc;

            acc.set(key, item.CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [progId, lang, categorySets]);

    return cateDic;
};

const useGetTagDict = (progId: PGID, lang: Lang, tagSets: TagSet[]) =>
{
    const tagDic = useMemo<Record<string, string>>(() =>
    {
        const src = tagSets.filter(p => p.TagData?.ProgId === progId) ?? [];

        return src.reduce<Record<string, string>>((acc, item) =>
        {
            const key = item.TagData?.TagId?.toString?.();
            if (!key) return acc;

            acc[key] = item.TagDetail?.find(p => p.Lang === lang)?.TagName ?? "";
            return acc;
        }, {});
    }, [progId, lang, tagSets]);

    return tagDic;
};

const buildPageMapByProgId = (pageSets: PageSet[], progId: PGID, lang: Lang): Map<string, string> =>
{
    const targetProgId = String(progId ?? "");
    return pageSets.reduce<Map<string, string>>((acc, item) =>
    {
        const page = item.PageManagement;
        if (!page?.InternalId) return acc;
        if (String(page.ProgId ?? "") !== targetProgId) return acc;
        const title = item.PageManagementDetail?.find(p => p.Lang === lang)?.Title ?? "";
        acc.set(String(page.InternalId), title);
        return acc;
    }, new Map<string, string>());
};
