import type { SiteMenuItem } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { LibCheckBox, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField } from "@/SysCore/Components/FormField/useSetTableField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

type TagSet = components["schemas"]["TagSet_DTO"];


interface ModuleOptionsJson
{
    Category: string;
    Tag: string;
}


interface SpecModuleProps
{
    theme: IBETheme;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    selectedItemEdit: SiteMenuItem | null;
    lang: Lang;
    tagSets: TagSet[];
}


interface SpecModuleBaseProps extends SpecModuleProps
{
    progId: PGID;
    categoryTitle: string;
    tagTitle: string;
}


const moduleOptionsDefaults: ModuleOptionsJson = { Category: "", Tag: "" };
// #endregion

// #region Public
/** 研究計畫模型參數 */
export const Module_SpecResearch_Comp = (prop: SpecModuleProps): React.ReactNode =>
{
    // return
    return <Module_SpecBase_Comp {...prop} progId={PGID.SpecResearch} categoryTitle="研究計畫類別" tagTitle="研究計畫標籤" />;
};


/** 計畫成果模型參數 */
export const Module_SpecUSR_Comp = (prop: SpecModuleProps): React.ReactNode =>
{
    // return
    return <Module_SpecBase_Comp {...prop} progId={PGID.SpecUSR} categoryTitle="計畫成果類別" tagTitle="計畫成果標籤" />;
};
// #endregion

// #region Section
/** 1810 Spec 模型共用參數 */
const Module_SpecBase_Comp = (prop: SpecModuleBaseProps): React.ReactNode =>
{
    // 宣告變數
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );

    const categoryBind = binder.bind("Category", "string");
    const tagBind = binder.bind("Tag", "csv");
    const categoryOptions = useGetSpecCategoryOptions(prop.progId, prop.lang);
    const tagOptions = useGetTagDict(prop.progId, prop.lang, prop.tagSets);

    // return
    return (
        <>
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName={prop.categoryTitle}
                Options={categoryOptions}
                InputValue={categoryBind.value}
                onChange={categoryBind.onChange}
                AutoDefaultFirst={false}
            />

            <LibCheckBox
                Style={prop.theme.CheckBox}
                ColumnDisplayName={prop.tagTitle}
                options={tagOptions}
                InputValue={tagBind.value}
                onChange={tagBind.onChange}
            />
        </>
    );
};
// #endregion

// #region Private
/** 取得目前選取項目的 Module row key */
const getModuleRowKeys = (selectedItemEdit: SiteMenuItem | null) =>
{
    // return
    return {
        [SiteMenu_Item_ModuleFields.SiteIndex]: selectedItemEdit?.menuItem.SiteIndex,
        [SiteMenu_Item_ModuleFields.ItemRowId]: selectedItemEdit?.menuItem.RowId,
    };
};


/** 依 ProgId 取得 1810 SpecCategory 下拉資料 */
const useGetSpecCategoryOptions = (progId: PGID, lang: Lang): Map<string, string> =>
{
    // 宣告變數
    const adapter = useMemo(() => SpecCategoryAdapter(), []);
    const query = adapter.hooks.useMapByProgId({ progId, lang });

    const options = useMemo<Map<string, string>>(() =>
    {
        // return
        return (query.data ?? []).reduce<Map<string, string>>((acc, item: SpecCategorySet) =>
        {
            const key = item.SpecCategory?.CategoryId;
            if (!key) return acc;

            const text = item.SpecCategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? key;
            acc.set(String(key), text);
            return acc;
        }, new Map<string, string>());
    }, [query.data, lang]);

    // return
    return options;
};


/** 依 ProgId 取得共用 Tag 勾選資料 */
const useGetTagDict = (progId: PGID, lang: Lang, tagSets: TagSet[]): Record<string, string> =>
{
    const tagDic = useMemo<Record<string, string>>(() =>
    {
        // 宣告變數
        const src = tagSets.filter(p => p.TagData?.ProgId === progId) ?? [];

        // return
        return src.reduce<Record<string, string>>((acc, item) =>
        {
            const key = item.TagData?.TagId?.toString?.();
            if (!key) return acc;

            acc[key] = item.TagDetail?.find(p => p.Lang === lang)?.TagName ?? key;
            return acc;
        }, {});
    }, [progId, lang, tagSets]);

    // return
    return tagDic;
};
// #endregion
