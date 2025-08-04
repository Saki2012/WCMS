import type {IBETheme} from "../../../Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "../../../Scaffold/Content/FormList_Comp";
import type { FormListCompProp } from "../../../Scaffold/Content/Content_Data"
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useGetCategoryListByProgId } from "../Category/Category_Hook";
import { useParams } from "react-router-dom";
import type { components } from "../../../../../../types/api";
import { useFetchFormData } from "../../../../../../SysCore/Utils/FetchFormData";
import TagProvider from "./Tag_Api";


type TagSet = components["schemas"]["TagSet"]
const emptyData:TagSet={
    TagData:{},
    TagDetail:[]
}
/** 頁面清單
 * @returns 
 */
export const TagListComp = ({progId,title,theme}:{progId:string;title:string;theme:IBETheme}) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/List`);
    const useToolbar = useListToolbarActions(dirUrl)
    const formData = useFetchFormData<TagSet>(TagProvider(), internalId, emptyData)
    const useCategoryList = useGetCategoryListByProgId(progId,'zh-tw',10)


    const isLoading=[useCategoryList.isLoading,formData.isLoading];
    const errors=[useCategoryList.error,formData.error];
    const prop:FormListCompProp={ Title:title,SubTitle:title, Theme:theme, LoadingList:isLoading, ErrorList:errors, FormToolbar:useToolbar.toolbarActions }
    return (
            <FormListComp prop={prop}></FormListComp>
    );
}
