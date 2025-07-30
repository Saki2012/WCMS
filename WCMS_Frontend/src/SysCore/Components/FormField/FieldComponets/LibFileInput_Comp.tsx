import { useId } from 'react';
import type { ILibFileProp } from './LibFile_Data';

const LibFileInput=(prop:ILibFileProp)=>{
    const inputTextId = useId();
    const inputFileId = useId();
    return(
        <>                                                                            
            <label htmlFor={inputFileId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.ColumnDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <div className="input-group search-box">
                    <input type="text" className="form-control mb-1" id={inputTextId} placeholder="請輸入檔案名稱 ..."/>
                    <button data-repeater-delete="" type="button" className="btn btn-custom mb-1" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除附加檔案">
                        <i className="far fa-times"></i>
                    </button>
                </div>
                <input type="file" className="form-control" id={inputFileId} placeholder="附加檔案 ..."/>
            </div>
        </>
    );
}

export default LibFileInput;