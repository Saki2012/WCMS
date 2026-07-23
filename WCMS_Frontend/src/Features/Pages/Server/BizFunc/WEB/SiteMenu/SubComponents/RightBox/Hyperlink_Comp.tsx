import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibDropList, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { SiteMenu_ItemFields, SiteMenu_Item_UrlFields } from "@/types/SchemaFields";
import { type Dispatch, type SetStateAction, useEffect, useMemo } from "react";
import type { SiteMenuItem } from "../../SiteMenu_Hook";
import { type SiteMenuFormModel, type SiteMenuGraphField, type SiteMenuItemModel, type SiteMenuItemUrl } from "../../SiteMenu_FormModel_Hook";

// #region Property
type MenuUrlType = components["schemas"]["MenuUrlType"];


interface HyperlinkSettingTabProps
{
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem | null;
    setField: SiteMenuGraphField;
    navType: MenuUrlType;
    formData: UseFetchFormDataResult<SiteMenuFormModel>;
    siteMenuItems: SiteMenuItem[];
    menuUrlType: Record<string, string>;
    lang: Lang;
    setNavType: Dispatch<SetStateAction<MenuUrlType>>;
}


const URL_REDIRECT_TYPE: MenuUrlType = 1;

const MODULE_REDIRECT_TYPE: MenuUrlType = 2;
// #endregion

// #region Public
/** 超連結設定頁籤：外部連結 / 內部連結切換與綁定 */
export const HyperlinkSettingTab = (prop: HyperlinkSettingTabProps) =>
{
    const selectedMenuItem = useSelectedMenuItem(prop.formData.data, prop.selectedItemEdit);
    const siteIndex = selectedMenuItem?.SiteIndex;
    const rowId = selectedMenuItem?.RowId;
    const curRowKeys = useMemo<Record<string, string | number> | null>(() =>
    {
        if (siteIndex == null || rowId == null) return null;
        return { [SiteMenu_Item_UrlFields.SiteIndex]: siteIndex, [SiteMenu_Item_UrlFields.ItemRowId]: Number(rowId) };
    }, [siteIndex, rowId]);

    const internalUrlOptions = useMemo(() =>
    {
        return buildInternalUrlOptions(prop.siteMenuItems, Number(rowId ?? 0));
    }, [prop.siteMenuItems, rowId]);
    /** 確保目前選取項目一定有 Url 設定列，並修正 RedirectType = 0 */
    useEffect(() =>
    {
        ensureSelectedUrlRow(prop.formData, siteIndex, rowId);
    }, [prop.formData, siteIndex, rowId]);
    /** 同步目前選取項目的 RedirectType 到右側 UI 狀態 */
    useEffect(() =>
    {
        syncSelectedNavType(prop.formData.data, siteIndex, rowId, prop.setNavType);
    }, [prop.formData.data, siteIndex, rowId, prop.setNavType]);
    if (!curRowKeys) return null;
    const redirectTypeBind = prop.setField(
        SiteMenu_ItemFields._SiteMenu_Item_Url,
        SiteMenu_Item_UrlFields.RedirectType,
        "number",
        curRowKeys,
    );
    const effectiveNavType = useMemo(() =>
    {
        return normalizeRedirectType(redirectTypeBind.InputValue ?? prop.navType).toString();
    }, [redirectTypeBind.InputValue, prop.navType]);

    const redirectUrlBind = prop.setField(SiteMenu_ItemFields._SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys);
    return (
        <>
            <LibCheckBox
                options={prop.menuUrlType}
                Style={prop.theme.RadioBox}
                ColumnDisplayName={redirectTypeBind.ColumnDisplayName}
                InputValue={effectiveNavType}
                onChange={(v) =>
                {
                    const type = normalizeRedirectType(v);
                    redirectTypeBind.onChange?.(type);
                    prop.setNavType(type);
                }}
            />
            {effectiveNavType === URL_REDIRECT_TYPE.toString()
                ? <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的" {...redirectUrlBind} />
                : <LibDropList Style={prop.theme.DropList} Options={internalUrlOptions} AutoDefaultFirst={false} {...redirectUrlBind} />}
        </>
    );
};
// #endregion

// #region Protected
/** 建立內部連結下拉選單 */
const buildInternalUrlOptions = (items: SiteMenuItem[], currentRowId: number | null): Map<string, string> =>
{
    const options = new Map<string, string>();
    const thinSpace = "\u2009";

    const walk = (nodes: SiteMenuItem[] | undefined, depth: number): void =>
    {
        if (!nodes?.length) return;

        for (const node of nodes)
        {
            appendInternalUrlOption(options, node, depth, thinSpace, currentRowId);
            walk(node.children, depth + 1);
        }
    };

    walk(items, 0);
    return options;
};
// #endregion

// #region Private
/** 取得目前選取的最新 SiteMenu_Item */
const useSelectedMenuItem = (data: SiteMenuFormModel, selected?: SiteMenuItem | null): SiteMenuItemModel | null =>
{
    return useMemo(() =>
    {
        const selectedRowId = Number(selected?.id ?? selected?.menuItem?.RowId ?? 0);
        if (!selectedRowId) return null;
        const current = (data._SiteMenu_Item ?? []).find(x => Number(x.RowId) === selectedRowId);
        return current ?? selected?.menuItem ?? null;
    }, [data._SiteMenu_Item, selected]);
};


/** 確保目前選取項目有 Url row，並把不合法 RedirectType 修回預設值 */
const ensureSelectedUrlRow = (formData: UseFetchFormDataResult<SiteMenuFormModel>, siteIndex?: string | null, rowId?: number | null): void =>
{
    if (siteIndex == null || rowId == null) return;
    formData.setFormData(prev =>
    {
        const items = (prev._SiteMenu_Item ?? []).map(item =>
        {
            if (Number(item.RowId) !== Number(rowId)) return item;
            const current = item._SiteMenu_Item_Url ?? createDefaultUrlRow(siteIndex, Number(rowId));
            const fixedType = normalizeRedirectType(current.RedirectType);
            if (item._SiteMenu_Item_Url && current.RedirectType === fixedType) return item;
            return { ...item, _SiteMenu_Item_Url: { ...current, RedirectType: fixedType } };
        });
        return { ...prev, _SiteMenu_Item: items };
    });
};

/** 同步目前選取項目的 RedirectType */
const syncSelectedNavType = (
    data: SiteMenuFormModel,
    siteIndex: string | null | undefined,
    rowId: number | null | undefined,
    setNavType: Dispatch<SetStateAction<MenuUrlType>>,
): void =>
{
    if (siteIndex == null || rowId == null) return;
    const item = (data._SiteMenu_Item ?? []).find(row => Number(row.RowId) === Number(rowId));
    setNavType(normalizeRedirectType(item?._SiteMenu_Item_Url?.RedirectType));
};


/** 建立預設超連結設定列 */
const createDefaultUrlRow = (siteIndex: string, rowId: number): SiteMenuItemUrl =>
{
    return { SiteIndex: siteIndex, ItemRowId: rowId, RedirectType: URL_REDIRECT_TYPE, RedirectUrl: "" } as SiteMenuItemUrl;
};


/** RedirectType 只有 1 / 2 合法，0 視為未初始化 */
const normalizeRedirectType = (value?: unknown): MenuUrlType =>
{
    const type = Number(value);
    if (type === MODULE_REDIRECT_TYPE) return MODULE_REDIRECT_TYPE;
    return URL_REDIRECT_TYPE;
};


/** 加入可被內部連結選取的選單項目 */
const appendInternalUrlOption = (options: Map<string, string>, node: SiteMenuItem, depth: number, thinSpace: string, currentRowId: number | null): void =>
{
    const fullUrl = String(node.menuItem?.FullUrl ?? "").trim();
    const redirectType = normalizeRedirectType(node.menuItem?._SiteMenu_Item_Url?.RedirectType);
    const isExternal = redirectType === URL_REDIRECT_TYPE;
    const isCurrentItem = Number(node.menuItem?.RowId ?? 0) === Number(currentRowId ?? 0);
    const isDraft = Number(node.menuItem?.RowId ?? node.id) <= 0;

    if (!fullUrl || isExternal || isCurrentItem || isDraft) return;

    const indent = depth > 0 ? thinSpace.repeat(depth * 2) : "";
    options.set(fullUrl, `${indent}${node.name}`);
};
// #endregion
