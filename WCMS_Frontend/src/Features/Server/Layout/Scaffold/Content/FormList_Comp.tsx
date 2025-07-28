import type { FormListCompProp } from "./Content_Data";
import { DividerComp } from "../../../../../SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../SysCore/Components/Paginator/Paginator_Comp";
import { LibTextBox } from "../../../../../SysCore/Components/FormField/LibFormField";
import { FormList_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";
import MenuListComp from "../../../../../SysCore/Components/MenuList/MenuList_Comp";
/**類別/標籤使用 */
export const FormListComp = ({prop}:{prop:FormListCompProp;}) => {
    return (
      <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{prop.Title}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="panel">
                                        <div className="panel-body">
                                            <div className="form"> 

                                                <div className="row mx-0">
		                                            <div className="col form-group">
                                                        {/* 塞多語系欄位名稱 */}
                                                        {/* <LibTextBox prop={prop.}></LibTextBox> */}
                                                    </div>                         
                                                </div>

                                                <DividerComp></DividerComp>
                                                
                                                {/* <div className="row mx-0">
                                                    <div className="text-center mb-2">                                            
                                                        <a className="mr-2 mb-2" href="javascript:void(0" type="button" role="button" target="_self" title="清除取消">
                                                            <button type="button" className="btn btn-custom btn-rounded btn-sm">清除取消</button>
                                                        </a>
                                                        <a className="mr-2 mb-2" href="javascript:void(0" type="button" role="button" target="_self" title="確認送出">
                                                            <button type="button" className="btn btn-custom btn-rounded btn-sm">確認送出</button>
                                                        </a>
                                                    </div>
                                                </div> */}
                                                {/* <FormList_Toolbar></FormList_Toolbar> */}

                                                <DividerComp></DividerComp>
                                                <List_Toolbar items={prop.Toolbar} ></List_Toolbar>
                                                <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                                    <div className="row mx-0"> 
                                                        <div className="col-sm-12">
                                                            <div className="panel">
                                                                <div className="panel-body">
                                                                    <div className="panel-header bg-secondary text-white">
                                                                        <h4 className="fw-bold text-white">{prop.SubTitle}</h4>
                                                                    </div>
                                                                    <div className="panel-ContentBox">
                                                                        <div className="row align-items-center justify-content-center">
                                                                            <div className="col-12">
                                                                                <div className="list-group-wrapper">

                                                                                    {/* <MenuListComp items={} Style={prop.Theme.CategoryTagList}></MenuListComp> */}
                                                                                    <ul className="list-group p-0">
                                                                                        <li className="list-group-item">

                                                                                            <div className="checkboxDIV my-2">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_01">
                                                                                                        <span className="check-txt">公告標籤 01</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>
                                                                                            
                                                                                            <div className="form-check form-switch my-2">
                                                                                                <input className="form-check-input" type="checkbox" role="switch" id="switch_01"/>
                                                                                                <label className="form-check-label" htmlFor="switch_01">
                                                                                                    <span className="check-txt">( <span className="Iicon off"></span>關閉 / <span className="Iicon on"></span>啟用 )</span>
                                                                                                </label>
                                                                                            </div>																							
                                                                                        </li>
                                                                                    </ul>

                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div> 
                                                                    {/* <Paginator></Paginator> */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </LoadingErrorHandler>
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
    );
}