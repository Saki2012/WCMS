
import { useEffect,useState } from "react";
import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import PageManagementProvider from "./PageManagement_Api"
import {DividerComp} from "../../../../../../SysCore/Components/Divider/Divider_Comp"
import {Toolbar_EditPage} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp"
import type {ToolbarItemsProp} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import {LibDropList, LibTabs, LibTextBox, LibTinyMCE, } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibDropListProp,LibTextBoxProp,LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { Classic_LibTabs } from "../../../Scaffold/FormFields/FormFields_Clsx"
import {Classic_BETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"


/** 頁面表單
 * @returns 
 */
export const PageFormComp = () => {
    return (
      <div className="Form-Main-Content">
        <div className="row">
            <div className="col-sm-12">
                <div className="card">
                    <div className="card-header">
                        <h3><i className="fas fa-braille me-2"></i>新增頁面</h3>
                    </div>
                    <FormBodyComp></FormBodyComp>
                </div>
            </div>
        </div>
    </div>
  );
}

const FormBodyComp=()=>{
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
        Style:Classic_BETheme.Tabs,
        item:{
            "Basic":"基本",
        }
    }
    const LibTabsPropB:LibTabsProp={
        Style:Classic_BETheme.Tabs,
        item:{
            "Chinese":"繁體中文",
            "English":"English",
        }
    }
    const LibDropListProp:LibDropListProp={
        Style:Classic_BETheme.DropList,
        ColumnDisplayName:"類別選擇",
        Options:{
            "":"請選擇",
            "1":"請選擇01",
            "2":"請選擇02",
            "3":"請選擇03",
        }
    }
    const libTextBoxProp:LibTextBoxProp={
        Style:Classic_BETheme.TextBox,
        ColumnDisplayName:"中文標題",
        DefaultInputDisplay:"請輸入",
    }
    const libTinyMCEProp:LibTinyMCEProp={
        Style:Classic_BETheme.TinyMCE,
        ColumnDisplayName:"內容-編輯器",
    }
    return (
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
                                                            <LibDropList {...LibDropListProp}></LibDropList>
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
    )
}


