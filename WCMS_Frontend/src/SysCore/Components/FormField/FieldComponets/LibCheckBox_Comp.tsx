
import { useId,useMemo } from 'react';
import type {ILibCheckBoxProp} from "./LibCheckBox_Data"

const LibCheckBox=(prop:ILibCheckBoxProp)=>{
    const inputId = useId();
    const uidList = useMemo(() => {
        return prop.Items.map(() => crypto.randomUUID());
    }, [prop.Items]);
    return(
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.colDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                {prop.Items.map((item, idx) => {
                    const uid = uidList[idx];
                    return (
                        <div key={uid} className="col-sm-3 col-6 float-left p-0">
                            <div className="custom-control form-check">
                                <input className="form-check-input" type="checkbox" value={item.value} id={uid} />
                                <label className="form-check-label" htmlFor={uid}>
                                    <span className="check-txt">{item.Label}</span>
                                </label>
                            </div>
                        </div>
                    );
                    })}
            </div>
        </>
    );
}

export default LibCheckBox;



            
