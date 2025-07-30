import { LibTabs } from "../FormField/LibFormField"
import{ useId, type ReactNode } from "react"
import type{ LibTabsProp } from "../FormField/LibFormField"
import { clsx } from "clsx"

const Content=({tabId,components,isFirst}:{tabId:string;components:ReactNode[];isFirst:boolean})=>{
    return(
        <div className={clsx("tab-pane", "fade", {active: isFirst,show: isFirst})} role="tabpanel" id={`Tab_TWEN_${tabId}`}>
            <div className="form">
            {components.map((ComponentNode, idx) => (
                <div className="row mx-0" key={idx}>
                    <div className="col form-group">
                    <div className="row mx-0">
                        {ComponentNode}
                    </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    )
}

const TabContentComp=({libTabsProp,components}:{libTabsProp: LibTabsProp;components: Record<string, React.ReactNode[]>;}) => {
    const uid=useId();
    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form"> 
                    <div className="row mx-0">
                        <LibTabs {...libTabsProp}></LibTabs>
                        <div className="tab-content px-0" id={uid}>

                           {Object.keys(libTabsProp.item).map((key,idx) => {
                                const isFirst=idx===0;
                                if (!components.hasOwnProperty(key)) { return ( <Content key={key} tabId={key} components={[<div>Key:{key}尚未提供內容</div>]}  isFirst={isFirst}/> );}
                                return ( <Content key={key} tabId={key} components={components[key]} isFirst={isFirst} />);
                            })}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TabContentComp