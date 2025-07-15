


import { useId } from 'react';
import { TinyMCE } from "../../TinyMCE/TinyMCE_Comp"
import { useState } from "react";
import type {LibTinyMCEProp} from "./LibTinyMCE_Data"

const LibTinyMCE=(prop:LibTinyMCEProp)=>{
    const inputId = useId();
    const [content, setContent] = useState('');
    return(
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <TinyMCE Id={inputId} value={content} onChange={setContent} />
            </div>
        </>
    );
}

export default LibTinyMCE;