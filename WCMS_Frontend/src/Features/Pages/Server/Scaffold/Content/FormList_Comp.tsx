import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { FormList_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ReactNode } from "react";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";


interface FormListCompProp {
    Title: string;
    SubTitle: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    InputControl: ReactNode;
    GridItems: ReactNode;
    Actions: UseActionsResult;
}



/**類別/標籤使用 */
export const FormListComp = (prop: FormListCompProp) => {
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
                                                <LoadingErrorHandler isLoading={prop.LoadingList} errorList={prop.ErrorList} >
                                                    <div className="row mx-0">
                                                        <div className="col form-group">
                                                            {prop.InputControl}
                                                        </div>
                                                    </div>
                                                    <FormList_Toolbar action={prop.Actions}></FormList_Toolbar>
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
                                                                                    {prop.GridItems}
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