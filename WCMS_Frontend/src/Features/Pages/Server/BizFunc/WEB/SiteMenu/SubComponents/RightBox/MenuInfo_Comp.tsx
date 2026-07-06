import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SiteMenu_Item_TitleFields, SiteMenu_ItemFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { SiteMenuItem } from "../../SiteMenu_Hook";

// #region Property
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];

type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"];

type MenuUrlType = components["schemas"]["MenuUrlType"];

interface BasicSettingTab_Props
{
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem | null;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
    itemType: Record<string, string>;
    windowTarget: Record<string, string>;
    setLinkType: React.Dispatch<React.SetStateAction<MenuUrlType>>;
}

type MenuTitleCompProps = BasicSettingTab_Props & { selectedMenuItem?: SiteMenu_Item | null; };
// #endregion

// #region Public
export const BasicSettingTab = (prop: BasicSettingTab_Props) =>
{
    const selectedMenuItem = useSelectedMenuItem(prop.formData.data, prop.selectedItemEdit);
    const curRowKeys = useMemo(() =>
    {
        return { [SiteMenu_ItemFields.SiteIndex]: selectedMenuItem?.SiteIndex, [SiteMenu_ItemFields.RowId]: selectedMenuItem?.RowId };
    }, [selectedMenuItem?.RowId, selectedMenuItem?.SiteIndex]);

    const itemTypeBind = prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemType, "number", curRowKeys);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入數字或英文，不可使用空白的"
                {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemSiteUrl, "string", curRowKeys)}
            />
            <LibTextBox
                disabled={true}
                Style={prop.theme.TextBox}
                DefaultInputDisplay=""
                {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.FullUrl, "string", curRowKeys)}
            />
            <LibCheckBox
                Style={prop.theme.RadioBox}
                options={prop.itemType}
                ColumnDisplayName={itemTypeBind.ColumnDisplayName}
                InputValue={itemTypeBind.InputValue}
                onChange={(v) =>
                {
                    itemTypeBind.onChange?.(v);
                    prop.setLinkType(Number(v) as MenuUrlType);
                }}
            />
            <LibCheckBox
                Style={prop.theme.RadioBox}
                options={prop.windowTarget}
                {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.WindowTarget, "number", curRowKeys)}
            />
            <MenuTitle_Comp {...prop} selectedMenuItem={selectedMenuItem} />
        </>
    );
};
// #endregion

// #region Section
const MenuTitle_Comp = (prop: MenuTitleCompProps) =>
{
    const rawDetails = useMemo(() =>
    {
        return getSelectedTitleRows(prop.formData.data, prop.selectedMenuItem);
    }, [prop.formData.data, prop.selectedMenuItem]);

    const dedupDetails = useMemo(() =>
    {
        const seen = new Set<string>();
        const out: SiteMenu_Item_Title[] = [];

        for (const d of rawDetails)
        {
            const langKey = String(d?.Lang ?? "").toLowerCase();
            if (seen.has(langKey)) continue;
            seen.add(langKey);
            out.push(d);
        }

        return out;
    }, [rawDetails]);

    const tabInfo = useMemo<LibTabsProp>(() =>
    {
        return {
            Style: prop.theme.Tabs,
            item: dedupDetails.reduce<Record<string, string>>((tabItems, info) =>
            {
                const langKey = buildTitleTabKey(info);
                tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
                return tabItems;
            }, {}),
        };
    }, [dedupDetails, prop.theme.Tabs]);

    const tabContent = useMemo<Record<string, React.ReactNode[]>>(() =>
    {
        return dedupDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
        {
            const langKey = buildTitleTabKey(info);
            const rowKeys = {
                [SiteMenu_Item_TitleFields.SiteIndex]: info.SiteIndex,
                [SiteMenu_Item_TitleFields.ItemRowId]: info.ItemRowId,
                [SiteMenu_Item_TitleFields.RowId]: info.RowId,
            };

            compMap[langKey] = [
                <LibTextBox
                    key={`${langKey}_title`}
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...prop.setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.Title, "string", rowKeys)}
                />,
                <LibCheckBox
                    key={`${langKey}_show`}
                    Style={prop.theme.CheckBox}
                    options={{ [SiteMenu_Item_TitleFields.IsShowOnMenu]: "" }}
                    {...prop.setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.IsShowOnMenu, "boolean", rowKeys)}
                />,
            ];

            return compMap;
        }, {});
    }, [dedupDetails, prop]);

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};
// #endregion

// #region Protected
/** 建立多語頁籤 key */
const buildTitleTabKey = (info: SiteMenu_Item_Title): string =>
{
    return LibText.Merge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang);
};
// #endregion

// #region Private
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

/** 取得目前選取 item 的多語標題列 */
const getSelectedTitleRows = (data: SiteMenuSet, selected?: SiteMenu_Item | null): SiteMenu_Item_Title[] =>
{
    const siteIndex = selected?.SiteIndex ?? "";
    const itemRowId = Number(selected?.RowId ?? 0);
    if (!itemRowId) return [];

    return (data.SiteMenu_Item_Title ?? []).filter((p) =>
    {
        return p.SiteIndex === siteIndex && Number(p.ItemRowId) === itemRowId;
    });
};
// #endregion
