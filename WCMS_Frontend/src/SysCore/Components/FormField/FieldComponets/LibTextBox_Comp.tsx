
import { useId } from 'react';
import type {LibTextBoxProp} from "./LibTextBox_Data"

const LibOptionBox=(prop:LibTextBoxProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <input id={inputId} type="text" className={prop.Style.InputStyle} placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}/>
            </div>
        </>
    );
}

export default LibOptionBox;