import { useId } from 'react';
import type { ILibFileProp } from './LibFile_Data';

const LibFile=(prop:ILibFileProp)=>{
    const inputId = useId();
    return(
        <>                                                                            
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <input type="file" className={prop.Style.InputStyle} id={inputId} multiple={prop.Multiple} />
            </div>
        </>
    );
}

export default LibFile;