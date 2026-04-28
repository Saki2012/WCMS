import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    CategoryDataSetFields,
    CategoryFields,
    MatCategoryDataSetFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    type PGID,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CategorySharedEditorComp } from "../../COMM/Category/Server_CategorySharedEditor_Comp";
import { useMatCategoryFormFetchData } from "./Server_MatCategory_Form_Hook";

type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];
type MatCategoryInfoField = components["schemas"]["MatCategoryInfoField_DTO"];
type MatCategoryInfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay_DTO"];

const buildEmptyData = (progId: string): MatCategorySet =>
{
    // return
    return { Category: { ProgId: progId }, CategoryDetail: [], MatCategoryInfoField: [], MatCategoryInfoFieldDisplay: [] };
};

const getCategoryLangs = (data: MatCategorySet | null | undefined, preferFirstLang: Lang): Lang[] =>
{
    // 宣告變數
    const langs = (data?.CategoryDetail ?? []).map(p => p.Lang as Lang).filter(Boolean);

    // return
    return langs.length > 0 ? Array.from(new Set(langs)) : [preferFirstLang];
};

const getNextFieldRowId = (rows: MatCategoryInfoField[]): number =>
{
    // 宣告變數
    const max = rows.reduce((m, item) => Math.max(m, item.RowId ?? 0), 0);

    // return
    return max + 1;
};

const getNextDisplayRowId = (rows: MatCategoryInfoFieldDisplay[]): number =>
{
    // 宣告變數
    const max = rows.reduce((m, item) => Math.max(m, item.RowId ?? 0), 0);

    // return
    return max + 1;
};

const buildFieldLangTabKey = (item: MatCategoryInfoFieldDisplay): string =>
{
    // return
    return LibMerge("_", true, item.CategoryId, item.ParentRowId, item.RowId, item.Lang);
};

const buildFieldLangTabInfo = (theme: IBETheme, rows: MatCategoryInfoFieldDisplay[]): LibTabsProp =>
{
    // return
    return {
        Style: theme.Tabs,
        item: rows.reduce<Record<string, string>>((map, item) =>
        {
            map[buildFieldLangTabKey(item)] = LangLabelMap[item.Lang as Lang] ?? item.Lang ?? "Unknown";
            return map;
        }, {}),
    };
};

const sortDisplaysByLang = (rows: MatCategoryInfoFieldDisplay[], langs: Lang[]): MatCategoryInfoFieldDisplay[] =>
{
    // return
    return [...rows].sort((a, b) => langs.indexOf(a.Lang as Lang) - langs.indexOf(b.Lang as Lang));
};

const useEnsureMatInfoFieldDisplays = (formData: UseFetchFormDataResult<MatCategorySet>, preferFirstLang: Lang): void =>
{
    useEffect(() =>
    {
        // 宣告變數
        const data = formData.data;
        if (!data) return;

        const categoryId = data.Category?.CategoryId ?? "";
        const langs = getCategoryLangs(data, preferFirstLang);
        const fields = data.MatCategoryInfoField ?? [];
        const displays = data.MatCategoryInfoFieldDisplay ?? [];
        let nextDisplayRowId = getNextDisplayRowId(displays);
        let isChanged = false;

        const nextFields = fields.map(item =>
        {
            if ((item.CategoryId ?? "") === categoryId) return item;
            isChanged = true;
            return { ...item, CategoryId: categoryId };
        });

        const nextDisplays = displays.map(item =>
        {
            if ((item.CategoryId ?? "") === categoryId) return item;
            isChanged = true;
            return { ...item, CategoryId: categoryId };
        });

        for (const field of nextFields)
        {
            for (const lang of langs)
            {
                const hasRow = nextDisplays.some(p => p.ParentRowId === field.RowId && p.Lang === lang);
                if (hasRow) continue;

                nextDisplays.push({ CategoryId: categoryId, ParentRowId: field.RowId, RowId: nextDisplayRowId, Lang: lang, FieldDisplayName: "" });
                nextDisplayRowId += 1;
                isChanged = true;
            }
        }

        if (!isChanged) return;

        formData.setFormData(prev =>
        {
            // 宣告變數
            const base = prev ?? buildEmptyData(data.Category?.ProgId ?? "");

            // return
            return { ...base, MatCategoryInfoField: nextFields, MatCategoryInfoFieldDisplay: nextDisplays };
        });
    }, [formData, preferFirstLang]);
};

const addInfoField = (formData: UseFetchFormDataResult<MatCategorySet>, preferFirstLang: Lang): void =>
{
    // 宣告變數
    const data = formData.data ?? buildEmptyData("");
    const categoryId = data.Category?.CategoryId ?? "";
    const fields = data.MatCategoryInfoField ?? [];
    const displays = data.MatCategoryInfoFieldDisplay ?? [];
    const langs = getCategoryLangs(data, preferFirstLang);
    const nextFieldRowId = getNextFieldRowId(fields);
    let nextDisplayRowId = getNextDisplayRowId(displays);

    const newField: MatCategoryInfoField = { CategoryId: categoryId, RowId: nextFieldRowId, Field: "" };

    const newDisplays = langs.map(lang =>
    {
        const row: MatCategoryInfoFieldDisplay = {
            CategoryId: categoryId,
            ParentRowId: nextFieldRowId,
            RowId: nextDisplayRowId,
            Lang: lang,
            FieldDisplayName: "",
        };
        nextDisplayRowId += 1;
        return row;
    });

    // 執行 function
    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData(data.Category?.ProgId ?? "");
        return {
            ...base,
            MatCategoryInfoField: [...(base.MatCategoryInfoField ?? []), newField],
            MatCategoryInfoFieldDisplay: [...(base.MatCategoryInfoFieldDisplay ?? []), ...newDisplays],
        };
    });
};

const removeInfoField = (formData: UseFetchFormDataResult<MatCategorySet>, rowId: number | null | undefined): void =>
{
    // 宣告變數
    if (rowId == null) return;

    // 執行 function
    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData("");
        return {
            ...base,
            MatCategoryInfoField: (base.MatCategoryInfoField ?? []).filter(p => p.RowId !== rowId),
            MatCategoryInfoFieldDisplay: (base.MatCategoryInfoFieldDisplay ?? []).filter(p => p.ParentRowId !== rowId),
        };
    });
};

export const Server_MatCategory_Form_Comp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const emptyData = useMemo(() => buildEmptyData(prop.progId), [prop.progId]);

    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const getData = useMatCategoryFormFetchData({ lang: prop.lang, internalId: internalId ?? "", emptyData, actionsOpt });

    // 執行 function
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: CategoryDataSetFields.Category,
        detailName: CategoryDataSetFields.CategoryDetail,
        parentKeys: [CategoryFields.CategoryId],
        preferFirstLang: prop.lang,
    });
    useEnsureMatInfoFieldDisplays(getData.rawData.formData, prop.lang);

    const propForm: FormCompProp = {
        Title: internalId ? `修改${prop.title}` : `新增${prop.title}`,
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    // return
    return (
        <FormComp prop={propForm}>
            <MatCategoryBodyComp theme={prop.theme} formData={getData.rawData.formData} lang={prop.lang} />
        </FormComp>
    );
};

const MatCategoryBodyComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<MatCategorySet>; lang: Lang; }) =>
{
    // 宣告變數
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Category: "基本類別資料", MatField: "物件欄位設定", System: "系統資訊" } };

    const tabContent: Record<string, React.ReactNode[]> = {
        Category: [<CategorySharedEditorComp<MatCategorySet> key="CategorySharedEditor" theme={prop.theme} formData={prop.formData} />],
        MatField: [<MatCategoryInfoFieldEditorComp key="MatCategoryInfoFieldEditor" theme={prop.theme} formData={prop.formData} lang={prop.lang} />],
        System: [<SystemInfoTabComp key="SystemInfo" theme={prop.theme} formData={prop.formData} setKey={CategoryDataSetFields.Category} />],
    };

    // return
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

const MatCategoryInfoFieldEditorComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<MatCategorySet>; lang: Lang; }) =>
{
    // 宣告變數
    const setField = useSetTableField<MatCategorySet>(prop.formData);
    const data = prop.formData.data ?? buildEmptyData("");
    const langs = getCategoryLangs(data, prop.lang);
    const rawFields = [...(data.MatCategoryInfoField ?? [])].sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    const rawDisplays = data.MatCategoryInfoFieldDisplay ?? [];

    // return
    return (
        <>
            <div>
                <button type="button" className="btn btn-outline-primary" onClick={() => addInfoField(prop.formData, prop.lang)} aria-label="新增物件欄位">
                    新增物件欄位
                </button>
            </div>

            {rawFields.map(field =>
            {
                const rowKeys = { [MatCategoryInfoFieldFields.CategoryId]: field.CategoryId, [MatCategoryInfoFieldFields.RowId]: field.RowId };
                const displays = sortDisplaysByLang(rawDisplays.filter(p => p.ParentRowId === field.RowId), langs);

                return (
                    <div key={`Field_${field.RowId}`} className="card">
                        <div className="row g-3">
                            <div className="d-flex justify-content-between align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeInfoField(prop.formData, field.RowId)}
                                    aria-label={`刪除欄位 ${field.RowId}`}
                                >
                                    刪除
                                </button>
                            </div>

                            <LibTextBox
                                Style={prop.theme.TextBox}
                                DefaultInputDisplay="請輸入"
                                {...setField(MatCategoryDataSetFields.MatCategoryInfoField, MatCategoryInfoFieldFields.Field, "string", rowKeys)}
                            />

                            <MatCategoryInfoFieldDisplayEditorComp theme={prop.theme} formData={prop.formData} displayRows={displays} />
                        </div>
                    </div>
                );
            })}
        </>
    );
};

const MatCategoryInfoFieldDisplayEditorComp = (
    prop: { theme: IBETheme; formData: UseFetchFormDataResult<MatCategorySet>; displayRows: MatCategoryInfoFieldDisplay[]; },
) =>
{
    // 宣告變數
    const setField = useSetTableField<MatCategorySet>(prop.formData);
    const tabInfo = useMemo(() => buildFieldLangTabInfo(prop.theme, prop.displayRows), [prop.theme, prop.displayRows]);

    const tabContent = useMemo(() =>
    {
        return prop.displayRows.reduce<Record<string, React.ReactNode[]>>((map, item) =>
        {
            const key = buildFieldLangTabKey(item);
            const rowKeys = {
                [MatCategoryInfoFieldDisplayFields.CategoryId]: item.CategoryId,
                [MatCategoryInfoFieldDisplayFields.ParentRowId]: item.ParentRowId,
                [MatCategoryInfoFieldDisplayFields.RowId]: item.RowId,
            };

            map[key] = [
                <LibTextBox
                    key={`${key}_FieldDisplayName`}
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(MatCategoryDataSetFields.MatCategoryInfoFieldDisplay, MatCategoryInfoFieldDisplayFields.FieldDisplayName, "string", rowKeys)}
                />,
            ];
            return map;
        }, {});
    }, [prop.displayRows, prop.formData, prop.theme, setField]);

    // return
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};
