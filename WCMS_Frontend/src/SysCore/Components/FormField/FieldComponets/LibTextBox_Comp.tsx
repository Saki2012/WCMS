
import { useId } from 'react';
import type {ILibTextBoxProp} from "./LibTextBox_Data"

const LibTextBox=(prop:ILibTextBoxProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <input id={inputId} type="text" className={prop.Style.InputStyle} 
                    placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`} value={prop.InputValue??""}
                    onChange={(e)=>prop.OnChange(e.target.value)}
                    />
            </div>
        </>
    );
}

export default LibTextBox;