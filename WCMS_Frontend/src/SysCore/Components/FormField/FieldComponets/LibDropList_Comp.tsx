import { useId } from 'react';
import type { LibDropListProp } from "./LibDropList_Data"

const LibDropList=(prop:LibDropListProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <select id={inputId} className={prop.Style.OptionsStyle}>
                    {Object.entries(prop.Options).map(([key, label]) => {
                        if (key === "") { return ( <option selected>{label}</option> );} 
                        else { return ( <option key={key} value={key}>{label}</option> ); }
                    })}
                </select>
            </div>
        </>
    );
}

export default LibDropList;