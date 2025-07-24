import { useId } from 'react';
import type { ILibDropListProp  } from "./LibDropList_Data"

const LibDropList=(prop:ILibDropListProp )=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={prop.style.Labelstyle}>{prop.colDisplayName}</label>
            <div className={prop.style.SelectStyle}>
                <select id={inputId} className={prop.style.OptionsStyle} value={prop.InputValue} onChange={(e) => prop.onChange(e.target.value)}>
                    {prop.options && Object.entries(prop.options).map(([key, label]) => {
                        if (key === "") { return ( <option selected>{label}</option> );} 
                        else { return ( <option key={key} value={key}>{label}</option> ); }
                    })}
                </select>
            </div>
        </>
    );
}

export default LibDropList;