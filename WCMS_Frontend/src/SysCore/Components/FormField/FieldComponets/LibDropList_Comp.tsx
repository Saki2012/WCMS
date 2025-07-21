import { useId } from 'react';
import type { ILibDropListStyle } from "./LibDropList_Data"

const LibDropList=({style,colDisplayName,options}:{ style:ILibDropListStyle, colDisplayName:string, options:Record<string, string>})=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className={style.Labelstyle}>{colDisplayName}</label>
            <div className={style.SelectStyle}>
                <select id={inputId} className={style.OptionsStyle}>
                    {options && Object.entries(options).map(([key, label]) => {
                        if (key === "") { return ( <option selected>{label}</option> );} 
                        else { return ( <option key={key} value={key}>{label}</option> ); }
                    })}
                </select>
            </div>
        </>
    );
}

export default LibDropList;