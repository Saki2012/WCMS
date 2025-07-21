import {LibDropList, LibTabs, LibTextBox, LibTinyMCE, } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp,LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import PageManagementProvider from "./PageManagement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import { emptyData } from "./PageManagement_Data";




/** 頁面表單
 * @returns 
 */
export const PageFormComp = ({theme}:{theme:IBETheme}) => {
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
                                                    <LibDropList style={theme.DropList} colDisplayName="類別選擇" options={categories} ></LibDropList>
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

