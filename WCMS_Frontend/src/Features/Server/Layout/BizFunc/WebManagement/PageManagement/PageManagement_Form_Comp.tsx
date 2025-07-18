import { useEffect,useState } from "react";
import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import {DividerComp} from "../../../../../../SysCore/Components/Divider/Divider_Comp"
import {Toolbar_EditPage} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp"
import type {ToolbarItemsProp, ToolProp} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import {LibDropList, LibTabs, LibTextBox, LibTinyMCE, } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp,LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetPageFormData,useCreatePageFormData, useDeletePageForm } from "./PageManagement_Hook";
import { useParams } from 'react-router-dom';
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler"
import  type { components } from "../../../../../../types/api";
type PageManagementSet = components["schemas"]["PageManagement"]

/** 頁面表單
 * @returns 
 */
export const PageFormComp = ({theme}:{theme:IBETheme}) => {
    return (
      <div className="Form-Main-Content">
        <div className="row">
            <div className="col-sm-12">
                <div className="card">
                    <div className="card-header">
                        <h3><i className="fas fa-braille me-2"></i>新增頁面</h3>
                    </div>
                    <FormBodyComp theme={theme}></FormBodyComp>
                </div>
            </div>
        </div>
    </div>
  );
}

const FormBodyComp=({theme}:{theme:IBETheme})=>{
    const {data:categoryOpts, loading:categoryLoading, error:categoryErr} = useGetCategoryListByProgId("PageManagement","zh-TW")

    const { id } = useParams();//獲取Form資料
    const { data, isLoading, error } = useGetPageFormData( id ?? "");
    const { createData } = useCreatePageFormData();
    const { delData } = useDeletePageForm();
    const [formData, setFormData] = useState<PageManagementSet>();

    // if (!data?.PageManagement) { return <div>查無資料，請確認 UID 是否正確</div>; }

    // const tools:ToolProp[]=[
    //     {
    //         Title="儲存送出",
    //         onClick:()=>createData(formData),
    //     },
    // ];

    const toolbar_EditProp:ToolbarItemsProp={
        Items:[
            {
                Title:"儲存送出",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
            {
                Title:"取消返回",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
            {
                Title:"預覽畫面",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
        ]
    };
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
        InputValue:''
    }
    const libTinyMCEProp:LibTinyMCEProp={
        Style:theme.TinyMCE,
        ColumnDisplayName:"內容-編輯器",
    }

    return (
        <LoadingErrorHandler loadingList={[categoryLoading]} errorList={[categoryErr]} >
            <div className="card-body">
                <div className="row">
                    <div className="col-sm-12">
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
                                                                <LibDropList style={theme.DropList} colDisplayName="類別選擇" options={categoryOpts} ></LibDropList>
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
                                <DividerComp></DividerComp>
                                <Toolbar_EditPage {...toolbar_EditProp}></Toolbar_EditPage>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LoadingErrorHandler>
    )
}

