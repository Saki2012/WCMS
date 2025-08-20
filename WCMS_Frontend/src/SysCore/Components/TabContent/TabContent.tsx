import { LibTabs } from "../FormField/LibFormField"
import { useId, type ReactNode } from "react"
import type { LibTabsProp } from "../FormField/LibFormField"
import { clsx } from "clsx"

import React from 'react';

const Content = ({ tabId, components, isFirst }: { tabId: string; components: ReactNode[]; isFirst: boolean }) => {
    return (
        <div className={clsx("tab-pane fade", { active: isFirst, show: isFirst })} role="tabpanel" id={`Tab_TWEN_${tabId}`}>
            <div className="form row px-3">
                {components.map((ComponentNode, idx) => {
                    const className = React.isValidElement(ComponentNode) && ComponentNode.props.parentClass
                        ? ComponentNode.props.parentClass
                        : "col-12";

                    return (
                        <div className={className} key={idx}>
                            <div className="form-group">
                                <div className="row justify-content-center">
                                    {ComponentNode}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


// const Content = ({ tabId, components, isFirst }: { tabId: string; components: ReactNode[]; isFirst: boolean }) => {
//     return (
//         <div className={clsx("tab-pane", "fade", { active: isFirst, show: isFirst })} role="tabpanel" id={`Tab_TWEN_${tabId}`}>
//             <div className="form row">
//                 {components.map((ComponentNode, idx) => (
//                     // <div className="col-12 mx-0" key={idx}>
//                     <div className="w-50 form-group" key={idx}>
//                         {/* <div className="row mx-0"> */}
//                         {ComponentNode}
//                         {/* </div> */}
//                     </div>
//                     // </div>
//                 ))}
//             </div>
//         </div>
//     )
// }


const TabContentComp = ({ libTabsProp, components }: { libTabsProp: LibTabsProp; components: Record<string, React.ReactNode[]>; }) => {
    const uid = useId();
    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form">
                    <div className="row mx-0">
                        <LibTabs {...libTabsProp}></LibTabs>
                        <div className="tab-content px-0" id={uid}>

                            {Object.keys(libTabsProp.item).map((key, idx) => {
                                const isFirst = idx === 0;
                                if (!components.hasOwnProperty(key)) { return (<Content key={key} tabId={key} components={[<div>Key:{key}尚未提供內容</div>]} isFirst={isFirst} />); }
                                return (<Content key={key} tabId={key} components={components[key]} isFirst={isFirst} />);
                            })}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TabContentComp