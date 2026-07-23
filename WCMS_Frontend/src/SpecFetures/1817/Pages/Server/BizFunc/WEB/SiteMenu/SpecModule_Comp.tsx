import { type SiteMenuFormModel, useSiteMenuModuleJsonField } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_FormModel_Hook";
import type { SiteMenuItem } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_Hook";
import { LibDropList } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type CategorySet = components["schemas"]["Category"];

interface ModuleOptionsJson
{
    PageId: string;
    Category: string;
    Tag: string;
    Style: number;
}

const moduleOptionsDefaults: ModuleOptionsJson = { PageId: "", Category: "", Tag: "", Style: 1 };
// #endregion

// #region Public
export const Module_SpecMusical_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuFormModel>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
    },
): React.ReactNode =>
{
    const binder = useSiteMenuModuleJsonField<ModuleOptionsJson>(
        prop.formData,
        Number(prop.selectedItemEdit?.menuItem.RowId ?? prop.selectedItemEdit?.id ?? 0),
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
// #endregion

// #region Private
const useGetCategoryDict = (progId: PGID, lang: Lang, categorySets: CategorySet[]) =>
{
    const cateDic = useMemo<Map<string, string>>(() =>
    {
        const src = categorySets.filter(p => p.ProgId === progId) ?? [];
        return src.reduce<Map<string, string>>((acc, item: CategorySet) =>
        {
            const key = item.CategoryId?.toString?.();
            if (!key) return acc;
            acc.set(key, item._CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [progId, lang, categorySets]);
    return cateDic;
};
// #endregion
