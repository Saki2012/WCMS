


import { useId } from 'react';
import { TinyMCE } from "../../TinyMCE/TinyMCE_Comp"
import type {ILibTinyMCEProp} from "./LibTinyMCE_Data"

const LibTinyMCE=(prop:ILibTinyMCEProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <TinyMCE Id={inputId} value={prop.InputValue as string} onChange={prop.OnChange} />
            </div>
        </>
    );
}

export default LibTinyMCE;