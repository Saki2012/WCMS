import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibDropList, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { SiteMenu_Item_UrlFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { type Dispatch, type SetStateAction, useEffect, useMemo } from "react";
import type { SiteMenuItem } from "../../SiteMenu_Hook";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];
type MenuUrlType = components["schemas"]["MenuUrlType"];

interface HyperlinkSettingTabProps
{
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem | null;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
    navType: MenuUrlType;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    siteMenuItems: SiteMenuItem[];
    menuUrlType: Record<string, string>;
    lang: Lang;
    setNavType: Dispatch<SetStateAction<MenuUrlType>>;
}

/** 超連結設定頁籤：外部連結 / 內部連結切換與綁定 */
export const HyperlinkSettingTab = (prop: HyperlinkSettingTabProps) =>
{
    const selectedMenuItem = useSelectedMenuItem(prop.formData.data, prop.selectedItemEdit);
    const siteIndex = selectedMenuItem?.SiteIndex;
    const rowId = selectedMenuItem?.RowId;

    const curRowKeys = useMemo(() =>
    {
        return { [SiteMenu_Item_UrlFields.SiteIndex]: siteIndex, [SiteMenu_Item_UrlFields.ItemRowId]: rowId };
    }, [siteIndex, rowId]);

    const internalUrlOptions = useMemo(() =>
    {
        return buildInternalUrlOptions(prop.siteMenuItems, Number(rowId ?? 0));
    }, [prop.siteMenuItems, rowId]);

    /** 確保目前選取項目一定有對應的 Url 設定列 */
    useEffect(() =>
    {
        if (siteIndex == null || rowId == null) return;
        const exists = (prop.formData.data.SiteMenu_Item_Url ?? []).some((item) =>
            item.SiteIndex === siteIndex && Number(item.ItemRowId) === Number(rowId)
        );
        if (!exists)
        {
            prop.formData.setFormData((prev) =>
            {
                const data = (prev ?? {}) as SiteMenuSet;
                const list = [...(data.SiteMenu_Item_Url ?? [])];
                return {
                    ...data,
                    SiteMenu_Item_Url: [
                        ...list,
                        {
                            SiteIndex: siteIndex,
                            ItemRowId: Number(rowId),
                            RedirectType: 1,
                            RedirectUrl: "",
                        } as SiteMenu_Item_Url,
                    ],
                };
            });
        }
        prop.setNavType(1 as MenuUrlType);
    }, [siteIndex, rowId]);
    useEffect(() =>
    {
        if (siteIndex == null || rowId == null) return;
        const row = (prop.formData.data.SiteMenu_Item_Url ?? []).find(x =>
        {
            return x.SiteIndex === siteIndex && Number(x.ItemRowId) === Number(rowId);
        });
        prop.setNavType(Number(row?.RedirectType ?? 1) as MenuUrlType);
    }, [siteIndex, rowId, prop.formData.data.SiteMenu_Item_Url, prop.setNavType]);
    const redirectTypeBind = prop.setField(
        SiteMenuSetFields.SiteMenu_Item_Url,
        SiteMenu_Item_UrlFields.RedirectType,
        "number",
        curRowKeys,
    );
    const effectiveNavType = useMemo(() =>
    {
        const raw = redirectTypeBind.InputValue;
        const value = Number(raw === "" || raw == null ? prop.navType ?? 1 : raw);
        return (Number.isFinite(value) && value > 0 ? value : 1).toString();
    }, [redirectTypeBind.InputValue, prop.navType]);
    const redirectUrlBind = prop.setField(
        SiteMenuSetFields.SiteMenu_Item_Url,
        SiteMenu_Item_UrlFields.RedirectUrl,
        "string",
        curRowKeys,
    );

    return (
        <>
            <LibCheckBox
                options={prop.menuUrlType}
                Style={prop.theme.RadioBox}
                ColumnDisplayName={redirectTypeBind.ColumnDisplayName}
                InputValue={effectiveNavType}
                onChange={(v) =>
                {
                    redirectTypeBind.onChange?.(v);
                    prop.setNavType(Number(v) as MenuUrlType);
                }}
            />
            {effectiveNavType === "1"
                ? (
                    <LibTextBox
                        Style={prop.theme.TextBox}
                        DefaultInputDisplay="請輸入數字或英文，不可使用空白的"
                        {...redirectUrlBind}
                    />
                )
                : (
                    <LibDropList
                        Style={prop.theme.DropList}
                        Options={internalUrlOptions}
                        AutoDefaultFirst={false}
                        {...redirectUrlBind}
                    />
                )}
        </>
    );
};

/** 取得目前選取的最新 SiteMenu_Item */
const useSelectedMenuItem = (data: SiteMenuSet, selected?: SiteMenuItem | null): SiteMenu_Item | null =>
{
    return useMemo(() =>
    {
        const selectedRowId = Number(selected?.id ?? selected?.menuItem?.RowId ?? 0);
        if (!selectedRowId) return null;

        const current = (data.SiteMenu_Item ?? []).find(x => Number(x.RowId) === selectedRowId);
        return current ?? selected?.menuItem ?? null;
    }, [data.SiteMenu_Item, selected]);
};

/** 建立內部連結下拉選單 */
const buildInternalUrlOptions = (items: SiteMenuItem[], currentRowId: number | null): Map<string, string> =>
{
    const options = new Map<string, string>();
    const thinSpace = "\u2009";

    const walk = (nodes: SiteMenuItem[] | undefined, depth: number) =>
    {
        if (!nodes?.length) return;

        for (const node of nodes)
        {
            const fullUrl = String(node.menuItem?.FullUrl ?? "").trim();
            const redirectType = Number(node.menuItem?._SiteMenu_Item_Url?.RedirectType ?? 0);
            const isExternal = redirectType === 1;
            const isCurrentItem = Number(node.menuItem?.RowId ?? 0) === Number(currentRowId ?? 0);
            const isDraft = Number(node.menuItem?.RowId ?? node.id) <= 0;

            if (fullUrl && !isExternal && !isCurrentItem && !isDraft)
            {
                const indent = depth > 0 ? thinSpace.repeat(depth * 2) : "";
                options.set(fullUrl, `${indent}${node.name}`);
            }

            walk(node.children, depth + 1);
        }
    };

    walk(items, 0);
    return options;
};
