// Server_SpecCategory_ListForm_Comp.tsx
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSpecCategoryListFormFetchData } from "./Server_SpecCategory_ListForm_Hook";

// #region Property
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
// #endregion

// #region Public
/** 類別（SpecCategory）List/Form 主頁（抽離 FetchData 到 Hook） */
export const Server_SpecCategoryListFormComp = (prop: { progId: SchemaFields.PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const { pathname } = useLocation();

    // 執行 function
    let dirUrl = pathname.replace(/\/SpecCategory$/, `/SpecCategory`);
    const pathParts = pathname.split("/");
    if (pathParts[pathParts.length - 1] !== "SpecCategory")
    {
        dirUrl = location.pathname.split("/").slice(0, -1).join("/");
    }

    const emptyData = useMemo(() => buildEmptySet(String(prop.progId)), [prop.progId]);

    const getData = useSpecCategoryListFormFetchData({ dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });

    useEnsureLangDetails(getData.rawData.editForm, {
        headerName: SchemaFields.SpecCategorySetFields.SpecCategory,
        detailName: SchemaFields.SpecCategorySetFields.SpecCategoryDetail,
        parentKeys: [SchemaFields.SpecCategoryDetailModelFields.CategoryId],
        preferFirstLang: prop.lang,
    });

    const tagEditNode = useMemo(
        () => getData.rawData.editForm ? <SpecCateEditComp theme={prop.theme} formData={getData.rawData.editForm} showCols={getData.rawData.showCols} /> : null,
        [prop.theme, getData.rawData.editForm, getData.rawData.showCols],
    );

    const tagListNode = useMemo(
        () =>
            getData.rawData.list
                ? <SpecCateListComp theme={prop.theme} SpecCateSets={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />
                : null,
        [prop.theme, getData.rawData.list, prop.lang, getData.rawData.actions],
    );

    // return（DOM 結構維持不變）
    return (
        <FormListComp
            Title={prop.title}
            SubTitle={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            InputControl={tagEditNode}
            GridItems={tagListNode}
            Actions={getData.rawData.actions}
        >
        </FormListComp>
    );
};
// #endregion

// #region Section
/** 編輯區塊（多語系 Tab + 欄位控制） */
const SpecCateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecCategorySet>; showCols: Record<string, string>; }) =>
{
    // 宣告變數
    const setField = useSetTableField<SpecCategorySet>(props.formData);
    const rawDetails = props.formData.data?.SpecCategoryDetail ?? [];

    // 執行 function
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibText.Merge("_", true, info.CategoryId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };

    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibText.Merge("_", true, info.CategoryId, info.RowId, info.Lang);
        const rowKeys = {
            [SchemaFields.SpecCategoryDetailModelFields.CategoryId]: info.CategoryId,
            [SchemaFields.SpecCategoryDetailModelFields.RowId]: info.RowId,
        };

        compMap[langKey] = [
            <LibTextBox
                Style={props.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SchemaFields.SpecCategorySetFields.SpecCategoryDetail, SchemaFields.SpecCategoryDetailModelFields.CategoryName, "string", rowKeys)}
            />,
            <LibCheckBox
                Style={props.theme.CheckBox}
                options={props.showCols}
                {...setField(SchemaFields.SpecCategorySetFields.SpecCategory, SchemaFields.SpecCategoryModelFields.ShowColumnItems, "string", undefined, "csv")}
            >
            </LibCheckBox>,
        ];

        return compMap;
    }, {});

    // return
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 清單區塊（維持原 UL/LI 結構） */
const SpecCateListComp = (prop: { theme: IBETheme; SpecCateSets: SpecCategorySet[]; lang: Lang; actions: UseActionsResult; }) =>
{
    // 宣告變數
    const basePath = useLocation().pathname.split("/SpecCategory")[0];
    const dirPath = `${basePath}/SpecCategory`;

    // return
    return (
        <ul className="list-group p-0">
            {prop.SpecCateSets.map((item) =>
            {
                const internalId = item.SpecCategory?.InternalId ?? "";
                return (
                    <li
                        className="list-group-item"
                        key={`${item.SpecCategory?.InternalId}-${item.SpecCategoryDetail?.find((p) => p.Lang === prop.lang)?.RowId}`}
                    >
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <LangLink
                                    to={`${dirPath}/${item.SpecCategory?.InternalId}`}
                                    className="form-check-label"
                                    aria-label={`前往 ${item.SpecCategoryDetail?.find((p) => p.Lang === prop.lang)?.CategoryName} 詳細頁`}
                                >
                                    <span className="check-txt">{item.SpecCategoryDetail?.find((p) => p.Lang === prop.lang)?.CategoryName}</span>
                                </LangLink>
                            </div>
                        </div>
                        <div className="form-check form-switch my-2">
                            <GridCol_Toolbar key={internalId} action={prop.actions} internalId={internalId} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
// #endregion

// #region Protected
/** 建立空資料（新增模式用） */
const buildEmptySet = (progId: string): SpecCategorySet => ({ SpecCategory: { ProgId: progId }, SpecCategoryDetail: [] });
// #endregion
