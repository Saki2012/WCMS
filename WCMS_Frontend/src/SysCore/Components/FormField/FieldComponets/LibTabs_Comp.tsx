import type {LibTabsProp} from "./LibTabs_Data"

const LibTabs=(prop:LibTabsProp)=>{
    return(
        <ul className={prop.Style.UlStyle} id="Main_Tab" role="tablist">
            {Object.entries(prop.item).map(([key, label]) => {
                return (
                <li key={key} className={prop.Style.LiStyle} role="presentation">
                    <button className={prop.Style.BtnStyle} data-bs-toggle="tab" data-bs-target="#Tab_TWEN1" type="button" role="tab" aria-selected="true">
                        <h4 className="tab-name">{label}</h4>
                    </button>
                </li>
                )
            })}
        </ul>
    );
}

export default LibTabs;