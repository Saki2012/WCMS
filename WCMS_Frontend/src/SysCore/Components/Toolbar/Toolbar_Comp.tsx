import { Link } from 'react-router-dom';
import type { ToolbarAction } from './Toolbar_Data';

export const List_Toolbar=({items}:{items:ToolbarAction[]})=>{
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                
                {items && items.map((btn, idx) => (
                    <Link key={idx} to={btn.Url} target="_self" type="button" role="button" className="mr-2 mb-2" title={btn.Title}>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm">{btn.Title}</button>
                    </Link>
                ))}

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


