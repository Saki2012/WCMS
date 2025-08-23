import { LibDropList, LibTextBox, LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import PageManagementProvider from "./PageManagement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";

import { useFetchFormData } from "../../../../../../SysCore/Utils/API/FetchFormData";

import type { components } from "../../../../../../types/api";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
type PageManagementDetail = components["schemas"]["PageManagementDetail_DTO"]
import { useEffect } from "react";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";


const emptyData: PageManagementSet = {
    PageManagement: {},
    PageManagementDetail: []
}

/** 頁面表單
 * @returns 
 */
export const PageFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams()
    const useCategory = useGetCategoryListByProgId("PageManagement", "zh-tw")
    const formData = useFetchFormData<PageManagementSet>(PageManagementProvider(), internalId, emptyData);

    const useToolbar = useFormToolbarActions(PageManagementProvider(), formData.data as PageManagementSet, internalId as string, () => formData.refetch())

    // const useToolbar = useFormToolbarActions(AnnouncementProvider(), formData.data as AnnouncementSet, internalId ,() => formData.refetch())


    const isLoading = [useCategory.isLoading, formData.isLoading]
    const errors = [useCategory.error, formData.error]
    useEffect(() => { if (formData.data) { formData.setFormData(formData.data); } }, [formData.data]);

    const prop: FormCompProp = { Title: "新增頁面", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Basic": "基本",
        }
    }

    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibDropList Style={theme.DropList} ColumnDisplayName="類別選擇" Options={useCategory.data}
            InputValue={formData.data?.PageManagement?.CategoryId ?? ''}
            onChange={(val) => {
                formData.setFormData({
                    ...formData.data,
                    PageManagement: { ...formData.data?.PageManagement, CategoryId: val }
                });
            }} />,
        ],
    }

    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "zh-tw": "繁體中文",
            "en": "English",
        }
    }

    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as PageManagementSet, formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );


    return (
        <FormComp prop={prop}>
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        </FormComp>
    )
}

const generateLangFields = (lang: string, label: string, theme: IBETheme,
    formData: PageManagementSet, setFormData: React.Dispatch<React.SetStateAction<PageManagementSet | null>>
): React.ReactNode[] => {
    const details: PageManagementDetail[] = (formData?.PageManagementDetail ?? []) as PageManagementDetail[];
    const getLangData = (): PageManagementDetail => details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "", Content: "" };
    const updateLangData = (key: "Title" | "SubTitle" | "Content" | "Url", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.Title?.trim() ?? "") === "" && (newItem.Content?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, PageManagementDetail: nextDetails });
    };
    const data = getLangData();
    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Title ?? ""} OnChange={(val) => updateLangData("Title", val)} />,
        <LibTinyMCE key={`${lang}-Content`} Style={theme.TinyMCE} ColumnDisplayName={`內容編輯器（${label}）`} InputValue={data.Content ?? ""} OnChange={(val) => updateLangData("Content", val)} />,
    ];
};