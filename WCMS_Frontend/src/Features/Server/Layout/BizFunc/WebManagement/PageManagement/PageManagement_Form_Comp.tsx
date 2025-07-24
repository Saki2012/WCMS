import {LibDropList, LibTabs, LibTextBox, LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import PageManagementProvider from "./PageManagement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import { useGetPageFormData } from "./PageManagement_Hook";
import type { components } from "../../../../../../types/api";
import type { ILibDropListProp } from "../../../../../../SysCore/Components/FormField/FieldComponets/LibDropList_Data";
import { emptyData } from "./PageManagement_Data";
type PageManagementSet = components["schemas"]["PageManagementSet"]
import { useEffect } from "react";
/** 頁面表單
 * @returns 
 */
export const PageFormComp = ({theme}:{theme:IBETheme}) => {
    const { internalId } = useParams()
    const useCategory = useGetCategoryListByProgId("PageManagement","zh-tw")
    const usePageFormData = useGetPageFormData(internalId as string);
    const useToolbar = useFormToolbarActions(PageManagementProvider(), usePageFormData.data ?? emptyData as PageManagementSet,internalId as string)

    const isLoading=[useCategory.isLoading,usePageFormData.isLoading]
    const errors=[useCategory.error,usePageFormData.error]

    useEffect(() => {if (usePageFormData.data) {useToolbar.setFormData(usePageFormData.data);}}, [usePageFormData.data]);


    const prop:FormCompProp={ Title:"新增頁面", Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.action }
    const LibTabsPropA:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Basic":"基本",
        }
    }
    const LibTabsPropB:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "zh-tw":"繁體中文",
            "en":"English",
        }
    }

    const libDropListProp:ILibDropListProp={
        style:theme.DropList,
        colDisplayName:"類別選擇",
        options:useCategory.data,
        InputValue:useToolbar.formData?.PageManagement?.CategoryId ?? '',
        onChange:(val) => {useToolbar.setFormData({...useToolbar.formData,PageManagement: {...useToolbar.formData?.PageManagement,CategoryId: val}});}
    }


    


    return (
        <FormComp prop={prop}>
            <div className="panel">
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <LibTabs {...LibTabsPropA}></LibTabs>
                            <div className="tab-content px-0" id="myTabContent_Setup">
                                <div className="tab-pane fade show active" role="tabpanel" id="Tab_Setup1">
                                    <div className="form">
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <LibDropList {...libDropListProp}></LibDropList>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="panel">
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <LibTabs {...LibTabsPropB}></LibTabs>
                            <div className="tab-content px-0" id="myTabContent_TWEN">
                                <div className="tab-pane fade show active" role="tabpanel" id="Tab_TWEN1">
                                    <div className="form">
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <LibTextBox {...libTextBoxProp}/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <LibTinyMCE {...libTinyMCEProp}></LibTinyMCE>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    )
}

const DynamicRenderContentControl=({theme}:{theme:IBETheme})=>{


    const libTextBoxProp:LibTextBoxProp={
        Style:theme.TextBox,
        ColumnDisplayName:"中文標題",
        DefaultInputDisplay:"請輸入",
        InputValue:useToolbar.formData?.PageManagementDetail?.[0]?.Title,
        OnChange:(val) => useToolbar.setFormData({ ...useToolbar.formData, PageManagementDetail: useToolbar.formData.PageManagementDetail?.map((item, idx) => item.Lang === "zh-tw" ? { ...item, Title: val } : item) ?? []}),
    }
    const libTinyMCEProp:LibTinyMCEProp={
        Style:theme.TinyMCE,
        ColumnDisplayName:"內容-編輯器",
        InputValue:useToolbar.formData?.PageManagementDetail?.[0]?.Content,
        OnChange:(val)=>useToolbar.setFormData({...useToolbar.formData,
            PageManagementDetail: useToolbar.formData.PageManagementDetail?.map((item, idx) =>
            item.Lang === "zh-tw" ? { ...item, Content: val } : item
            ) ?? [],
        }),
    }



    return(
        <>
            <div className="tab-pane fade show active" role="tabpanel" id="Tab_TWEN1">
                <div className="form">
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                                <LibTextBox {...libTextBoxProp}/>
                            </div>
                        </div>
                    </div>
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                                <LibTinyMCE {...libTinyMCEProp}></LibTinyMCE>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}