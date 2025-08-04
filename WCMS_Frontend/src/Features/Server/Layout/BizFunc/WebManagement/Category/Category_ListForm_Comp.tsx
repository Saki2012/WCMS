import type {IBETheme} from "../../../Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "../../../Scaffold/Content/FormList_Comp";
import type { FormListCompProp } from "../../../Scaffold/Content/Content_Data"
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useGetCategoryListByProgId } from "./Category_Hook";
import { useParams } from "react-router-dom";
import type { components } from "../../../../../../types/api";
import CategoryProvider from "./Category_Api";
import { useFetchFormData } from "../../../../../../SysCore/Utils/FetchFormData";
import { LibTextBox } from "../../../../../../SysCore/Components/FormField/LibFormField";
type CategoryDataSet = components["schemas"]["CategoryDataSet"]
const emptyData:CategoryDataSet={
    Category:{},
    CategoryDetail:[]
}
/** 頁面清單
 * @returns 
 */
export const CategoryListComp = ({progId,title,theme}:{progId:string;title:string;theme:IBETheme}) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Category$/, `/Category`);
    const useToolbar = useListToolbarActions(dirUrl)
    const useCategoryList = useGetCategoryListByProgId(progId,'zh-tw',10)
    const formData = useFetchFormData<CategoryDataSet>(CategoryProvider(), internalId, emptyData)
    
    //*需要itmes動態化
    const LibTabsPropB={
            item:{"zh-tw":"繁體中文","en":"English",}
    }

    const components: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as CategoryDataSet,formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );



    const isLoading=[useCategoryList.isLoading,formData.isLoading];
    const errors=[useCategoryList.error,formData.error];
    const prop:FormListCompProp={ Title:title,SubTitle:title, Theme:theme, LoadingList:isLoading, ErrorList:errors, FormToolbar:useToolbar.toolbarActions }
    
    return (
            <FormListComp prop={prop}></FormListComp>
    );
}





const generateLangFields = ( lang: string, label: string, theme: IBETheme, 
    formData:CategoryDataSet,  setFormData: React.Dispatch<React.SetStateAction<CategoryDataSet | null>>
    ): React.ReactNode[] => 
    {
    const details = formData?.CategoryDetail ?? [];
    const getLangData = (): CategoryDataSet["CategoryDetail"][number] => details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "", SubTitle: "", Content: "", Url: "" };
    const updateLangData = (key: "Title" | "SubTitle" | "Content" | "Url", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.Title?.trim() ?? "") === "" && (newItem.Content?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, CategoryDetail: nextDetails });
    };
    const data = getLangData();
  return [
    <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`類別名稱（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Title ?? ""} OnChange={(val) => updateLangData("Title", val)} />,
  ];
};