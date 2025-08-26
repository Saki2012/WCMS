import type { IBETheme } from "../../../Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "../../../Scaffold/Content/FormList_Comp";
import type { FormListCompProp } from "../../../Scaffold/Content/Content_Data"
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useCategoryListData, useGetCategoryListByProgId } from "./Category_Hook";
import { useParams } from "react-router-dom";
import type { components } from "../../../../../../types/api";
import CategoryProvider from "./Category_Api";
import { useFetchFormData } from "../../../../../../SysCore/Utils/API/FetchFormData";
import { LibTextBox } from "../../../../../../SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
import { map } from "jquery";
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type CategoryDetail = components["schemas"]["CategoryDetail_DTO"]

const emptyData: CategoryDataSet = {
    Category: {},
    CategoryDetail: []
}
/** 頁面清單
 * @returns 
 */
export const CategoryListFormComp = ({ progId, title, theme }: { progId: string; title: string; theme: IBETheme }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Category$/, `/Category`);
    const useToolbar = useListToolbarActions(dirUrl)
    const useCategoryList = useCategoryListData(progId, 'zh-tw')
    const formData = useFetchFormData<CategoryDataSet>(CategoryProvider(), internalId, emptyData)
    // formData.data?.Category?.ProgId=progId??"";
    //*需要itmes動態化
    const LibTabsPropB = {
        item: { "zh-tw": "繁體中文", "en": "English", }
    }

    const components: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as CategoryDataSet, formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );

    const gridItems: React.ReactNode[] = useCategoryList.rawData.map(
        (item) => CategoryListItem(item.Category?.InternalId ?? "", item.CategoryDetail?.find(i => i.Lang === 'zh-tw')?.CategoryName ?? "")
    );


    const isLoading = [useCategoryList.isLoading, formData.isLoading];
    const errors = [useCategoryList.error, formData.error];
    const prop: FormListCompProp = { Title: title, SubTitle: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, InputControl: [components['zh-tw'], components['en']], GridItems: gridItems, FormToolbar: useToolbar.toolbarActions }

    return (
        <FormListComp prop={prop}></FormListComp>
    );
}


const CategoryListItem = (internalId: string, displayName: string) => {
    const basePath = useLocation().pathname.split('/Category')[0];
    const dirPath = `${basePath}/Category/${internalId}`;
    return (
        <>
            <div className="checkboxDIV my-2">
                <div className="custom-control form-check">
                    <Link to={dirPath} className="form-check-label" aria-label={`前往 ${displayName} 詳細頁`}>
                        <span className="check-txt">{displayName}</span>
                    </Link>
                </div>
            </div>
        </>
    )
}


const generateLangFields = (lang: string, label: string, theme: IBETheme,
    formData: CategoryDataSet, setFormData: React.Dispatch<React.SetStateAction<CategoryDataSet | null>>
): React.ReactNode[] => {
    const details = formData?.CategoryDetail ?? [];
    const getLangData = (): CategoryDetail => details.find(d => d.Lang === lang) ?? { Lang: lang, CategoryName: "" };
    const updateLangData = (key: "Title" | "SubTitle" | "Content" | "Url", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.CategoryName?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, CategoryDetail: nextDetails });
    };
    const data = getLangData();
    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`類別名稱（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.CategoryName ?? ""} OnChange={(val) => updateLangData("Title", val)} />,
    ];
};