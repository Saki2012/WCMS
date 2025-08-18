import { useId } from 'react';
import type { ILibFileInputProp } from './LibFileInput_Data';


const LibFileInput=(prop:ILibFileInputProp)=>{
    const inputTextId = useId();
    const inputFileId = useId();
    return(
        <>                                                                            
            <label htmlFor={inputFileId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <div className="input-group search-box">
                    <input type="text" className={prop.Style.InputStyle} id={inputTextId} placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}/>
                    <button data-repeater-delete="" type="button" className="btn btn-custom mb-1" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除附加檔案">
                        <i className="far fa-times"></i>
                    </button>
                </div>
                <input type="file" className={prop.Style.InputStyle} id={inputFileId} placeholder="附加檔案 ..."/>
            </div>
        </>
    );
}

export default LibFileInput;
