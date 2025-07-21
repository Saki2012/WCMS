import {LibDropList, LibTabs, LibTextBox, LibTinyMCE, } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp,LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import PageManagementProvider from "./PageManagement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import type { FormCompProp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import { emptyData } from "./PageManagement_Data";




/** 相簿表單
 * @returns 
 */
export const GalleryFormComp = ({theme}:{theme:IBETheme}) => {
    const { uid } = useParams()
    const { result:categories, loading:categoryLoading, error:categoryErr} = useGetCategoryListByProgId("PageManagement","zh-TW")
    const { formData, setFormData, isSuccess,isLoading, errors, toolbarActions } = useFormToolbarActions(PageManagementProvider(),emptyData)

    const prop:FormCompProp={ Title:"新增頁面", Theme:theme, LoadingList:[categoryLoading], ErrorList:[categoryErr], Toolbar:toolbarActions }
    const LibTabsPropA:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Basic":"基本",
        }
    }
    const LibTabsPropB:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Chinese":"繁體中文",
            "English":"English",
        }
    }
    const libTextBoxProp:LibTextBoxProp={
        Style:theme.TextBox,
        ColumnDisplayName:"中文標題",
        DefaultInputDisplay:"請輸入",
        InputValue:formData.PageManagementDetail?.[0]?.Title,
        OnChange:(val) => setFormData({ ...formData, PageManagementDetail: formData.PageManagementDetail?.map((item, idx) => idx === 0 ? { ...item, Title: val } : item) ?? []}),
    }
    const libTinyMCEProp:LibTinyMCEProp={
        Style:theme.TinyMCE,
        ColumnDisplayName:"內容-編輯器",
    }

    return (
        <FormComp prop={prop}>
            <></>
        </FormComp>
    )
}

