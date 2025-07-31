import type {IBETheme} from "../../../Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "../../../Scaffold/Content/FormList_Comp";
import type { FormListCompProp } from "../../../Scaffold/Content/Content_Data"
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useGetCategoryListByProgId } from "./Category_Hook";

/** 頁面清單
 * @returns 
 */
export const CategoryListComp = ({progId,title,theme}:{progId:string;title:string;theme:IBETheme}) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useToolbar = useListToolbarActions(dirUrl)
    const useCategoryList = useGetCategoryListByProgId(progId,'zh-tw',10)
    const isLoading=[useCategoryList.isLoading];
    const errors=[useCategoryList.error];
    const prop:FormListCompProp={ Title:title,SubTitle:title, Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.toolbarActions }
    
    return (
            <FormListComp prop={prop}></FormListComp>
    );
}
