import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SiteMenu_IndexFields, SiteMenu_Item_TitleFields, SiteMenu_ItemFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { SiteMenuItem } from "../../SiteMenu_Hook";
import {
    getSiteMenuItemTitleRows,
    type SiteMenuFormModel,
    type SiteMenuGraphField,
    type SiteMenuItemModel,
    type SiteMenuItemTitle,
} from "../../SiteMenu_FormModel_Hook";

// #region Property
type MenuUrlType = components["schemas"]["MenuUrlType"];

interface BasicSettingTab_Props
{
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem | null;
    formData: UseFetchFormDataResult<SiteMenuFormModel>;
    setField: SiteMenuGraphField;
    itemType: Record<string, string>;
    windowTarget: Record<string, string>;
    setLinkType: React.Dispatch<React.SetStateAction<MenuUrlType>>;
}

type MenuTitleCompProps = BasicSettingTab_Props & { selectedMenuItem?: SiteMenuItemModel | null; };
// #endregion

// #region Public
/** 基本設定頁籤：綁定選單資訊與各語系標題。 */
export const BasicSettingTab = (prop: BasicSettingTab_Props) =>
{
    const selectedMenuItem = useSelectedMenuItem(prop.formData.data, prop.selectedItemEdit);
    const curRowKeys = useMemo(() =>
    {
        return { [SiteMenu_ItemFields.SiteIndex]: selectedMenuItem?.SiteIndex, [SiteMenu_ItemFields.RowId]: selectedMenuItem?.RowId };
    }, [selectedMenuItem?.RowId, selectedMenuItem?.SiteIndex]);

    const itemTypeBind = prop.setField(SiteMenu_IndexFields._SiteMenu_Item, SiteMenu_ItemFields.ItemType, "number", curRowKeys);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入數字或英文，不可使用空白的"
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_Item, SiteMenu_ItemFields.ItemSiteUrl, "string", curRowKeys)}
            />
            <LibTextBox
                disabled={true}
                Style={prop.theme.TextBox}
                DefaultInputDisplay=""
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_Item, SiteMenu_ItemFields.FullUrl, "string", curRowKeys)}
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
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_Item, SiteMenu_ItemFields.WindowTarget, "number", curRowKeys)}
            />
            <MenuTitle_Comp {...prop} selectedMenuItem={selectedMenuItem} />
        </>
    );
};
// #endregion

// #region Section
/** 選單多語系標題與顯示設定。 */
const MenuTitle_Comp = (prop: MenuTitleCompProps) =>
{
    const titleDetails = useMemo(() =>
    {
        return getSelectedTitleRows(prop.formData.data, prop.selectedMenuItem);
    }, [prop.formData.data, prop.selectedMenuItem]);

    const tabInfo = useMemo<LibTabsProp>(() =>
    {
        return {
            Style: prop.theme.Tabs,
            item: titleDetails.reduce<Record<string, string>>((tabItems, info) =>
            {
                const langKey = buildTitleTabKey(info);
                tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
                return tabItems;
            }, {}),
        };
    }, [prop.theme.Tabs, titleDetails]);

    const tabContent = useMemo<Record<string, React.ReactNode[]>>(() =>
    {
        return titleDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
        {
            const langKey = buildTitleTabKey(info);
            const rowKeys = {
                [SiteMenu_Item_TitleFields.ItemRowId]: prop.selectedMenuItem?.RowId,
                [SiteMenu_Item_TitleFields.RowId]: info.RowId,
                [SiteMenu_Item_TitleFields.Lang]: info.Lang,
            };

            compMap[langKey] = [
                <LibTextBox
                    key={`${langKey}_title`}
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...prop.setField(SiteMenu_ItemFields._SiteMenu_Item_Title, SiteMenu_Item_TitleFields.Title, "string", rowKeys)}
                />,
                <LibCheckBox
                    key={`${langKey}_show`}
                    Style={prop.theme.CheckBox}
                    options={{ [SiteMenu_Item_TitleFields.IsShowOnMenu]: "" }}
                    {...prop.setField(SiteMenu_ItemFields._SiteMenu_Item_Title, SiteMenu_Item_TitleFields.IsShowOnMenu, "boolean", rowKeys)}
                />,
            ];

            return compMap;
        }, {});
    }, [prop.selectedMenuItem?.RowId, prop.setField, prop.theme.CheckBox, prop.theme.TextBox, titleDetails]);

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};
// #endregion

// #region Protected
/** 建立多語頁籤 key */
const buildTitleTabKey = (info: SiteMenuItemTitle): string =>
{
    return LibText.Merge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang);
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

/** 取得目前選取 item 的多語標題列 */
const getSelectedTitleRows = (data: SiteMenuFormModel, selected?: SiteMenuItemModel | null): SiteMenuItemTitle[] =>
{
    const itemRowId = Number(selected?.RowId ?? 0);
    if (!itemRowId) return [];
    return dedupeTitleRows(getSiteMenuItemTitleRows(data, itemRowId));
};

/** 同語系重複時優先使用已有標題內容的資料列。 */
const dedupeTitleRows = (rows: SiteMenuItemTitle[]): SiteMenuItemTitle[] =>
{
    const rowMap = new Map<string, SiteMenuItemTitle>();
    for (const row of rows)
    {
        const langKey = String(row.Lang ?? "").toLowerCase();
        const current = rowMap.get(langKey);
        rowMap.set(langKey, preferTitleRow(current, row));
    }
    return Array.from(rowMap.values());
};

/** 空白標題資料列不得取代同語系已有內容的資料列。 */
const preferTitleRow = (current: SiteMenuItemTitle | undefined, candidate: SiteMenuItemTitle): SiteMenuItemTitle =>
{
    if (!current) return candidate;
    const currentHasTitle = Boolean(String(current.Title ?? "").trim());
    const candidateHasTitle = Boolean(String(candidate.Title ?? "").trim());
    return !currentHasTitle && candidateHasTitle ? candidate : current;
};
// #endregion
