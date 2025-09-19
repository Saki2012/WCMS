import { DividerComp } from "../../../../../SysCore/Components/Divider/Divider_Comp";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";
import { Form_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";
import type { FormCompProp } from "./Content_Data";


export const FormComp = ({ prop, children }: { prop: FormCompProp; children: React.ReactNode }) => {

    return (
        <div className="Form-Main-Content">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{prop.Title}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-12">
                                    <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                        {children}
                                        <DividerComp></DividerComp>
                                        <Form_Toolbar items={prop.Toolbar}></Form_Toolbar>
                                    </LoadingErrorHandler>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}