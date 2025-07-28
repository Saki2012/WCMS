import { Link } from 'react-router-dom';
import type { ToolbarAction } from './Toolbar_Data';


export const FormList_Toolbar=({items}:{items:ToolbarAction[]})=>{
    return (
        <div className="row mx-0">
            <div className="text-center mb-2">
                {items && items.map((btn, idx) => {
                if (btn.Type === 'link') { return (
                    <Link key={idx} to={btn.Url as string} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={btn.Title} target='_self'>
                        {btn.Title}
                    </Link>
                    );
                }
                return (
                    <button key={idx} type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={btn.Title} onClick={() => {
                        if (!btn.Confirm || window.confirm(btn.Confirm)) { btn.OnClick?.();} }}>
                            {btn.Title}
                    </button>
                );
                })}
            </div>
        </div>
    );
}


export const List_Toolbar=({items}:{items:ToolbarAction[]})=>{
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                
                {items && items.map((btn, idx) => {
                if (btn.Type === 'link') { return (
                    <Link key={idx} to={btn.Url as string} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={btn.Title}>
                        {btn.Title}
                    </Link>
                    );
                }
                return (
                    <button key={idx} type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={btn.Title} onClick={() => {
                        if (!btn.Confirm || window.confirm(btn.Confirm)) { btn.OnClick?.();} }}>
                            {btn.Title}
                    </button>
                );
                })}
            </div>
        </div>
    );
}

export const Form_Toolbar=({items}:{items:ToolbarAction[]})=>{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">

                        {items && items.map((btn, idx) => (btn.Type === 'link' ? (
                            <a key={idx} href={btn.Url} target="_self" className="btn btn-custom btn-sm m-2" title={btn.Title}>
                            {btn.Title}
                            </a>
                        ) : (
                            <button key={idx} type="button" className="btn btn-custom btn-sm m-2" disabled={btn.IsDisabled}
                                onClick={() => { if (!btn.Confirm || window.confirm(btn.Confirm)) { btn.OnClick?.(); } }}>
                            {btn.Title}
                            </button>
                        )
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
}


