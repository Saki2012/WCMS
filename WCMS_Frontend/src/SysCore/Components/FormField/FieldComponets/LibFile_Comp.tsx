import { useId } from 'react';
import type { ILibFileProp } from './LibFile_Data';

const LibFile=(prop:ILibFileProp)=>{
    const inputId = useId();
    return(
        <>                                                                            
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.ColumnDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <input type="file" className="form-control" id={inputId}/>
            </div>
        </>
    );
}

export default LibFile;