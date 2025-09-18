import type { FormListCompProp } from "./Content_Data";
import { DividerComp } from "../../../../../SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../SysCore/Components/Paginator/Paginator_Comp";
import { LibTextBox } from "../../../../../SysCore/Components/FormField/LibFormField";
import MenuListComp from "../../../../../SysCore/Components/MenuList/MenuList_Comp";
import { FormList_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";

/**類別/標籤使用 */
export const FormListComp = ({ prop }: { prop: FormListCompProp; }) => {
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
                                                <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                                    <div className="row mx-0">
                                                        <div className="col form-group">

                                                            {prop.InputControl.map((item, idx) => (
                                                                <div key={idx} className="col-md-6 col-sm-12 float-md-left float-sm-none">
                                                                    <div className="row mx-0"> {item} </div>
                                                                </div>
                                                            ))}

                                                        </div>
                                                    </div>
                                                    <FormList_Toolbar items={prop.FormToolbar}></FormList_Toolbar>
                                                    <DividerComp></DividerComp>
                                                    <List_Toolbar items={prop.FormToolbar}></List_Toolbar>{/* Form_Toolbar */}
                                                    <DividerComp></DividerComp>
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

                                                                                    {/* <MenuListComp ></MenuListComp> */}
                                                                                    {/* <MenuListComp items={} Style={prop.Theme.CategoryTagList}></MenuListComp> */}
                                                                                    {/* li 內容要有:1. label 2. 點下去可以直接連結到對應的internalId 3. 刪除按鈕 4. 頁籤*/}
                                                                                    <ul className="list-group p-0">
                                                                                        {prop.GridItems.map((item) => (
                                                                                            <li className="list-group-item">
                                                                                                {item}

                                                                                            </li>
                                                                                        ))}


                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
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