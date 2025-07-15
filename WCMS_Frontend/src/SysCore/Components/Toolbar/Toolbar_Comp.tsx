import type{ToolbarProp,ToolbarItemsProp} from "./Toolbar_Data"
import { Link } from 'react-router-dom';

export const Toolbar=(prop:ToolbarProp)=>{
    /** 目前只有新增頁面 */
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                {/* className="mr-2 mb-2 btn btn-custom btn-rounded btn-sm" 再試試看是否可行，就移除button了*/}
                <Link className="mr-2 mb-2" to={prop.Url} type="button" role="button" target="_self" title={prop.Title}>
                    <button type="button" className="btn btn-custom btn-rounded btn-sm">{prop.Title}</button>
                </Link>
            </div>
        </div>
    );
}

export const Toolbar_EditPage=(prop:ToolbarItemsProp)=>{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">
                        {prop.Items.map((btn)=>(
                            <Link key={btn.Title} className="mr-2 mb-2" to={btn.Url} type="button" role="button" target="_self" title={btn.Title}>
                                <button type="button" className="btn btn-custom btn-rounded btn-sm">{btn.Title}</button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


