import { LibTabs } from "@/SysCore/Components/FormField/LibFormField"
import { useId, type ReactNode } from "react"
import { clsx } from "clsx"
import React from 'react';
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";

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
                                <div className="row justify-content-center-start">
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

const TabContentComp = (props: { tabInfos: LibTabsProp; components: Record<string, React.ReactNode[]>; }) => {
    const uid = useId();
    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form">
                    <div className="row mx-0">
                        <LibTabs {...props.tabInfos}></LibTabs>
                        <div className="tab-content px-0" id={uid}>
                            {Object.keys(props.tabInfos.item).map((key, idx) => {
                                const isFirst = idx === 0;
                                if (!props.components.hasOwnProperty(key)) { return (<Content key={key} tabId={key} components={[<div>Key:{key}尚未提供內容</div>]} isFirst={isFirst} />); }
                                return (<Content key={key} tabId={key} components={props.components[key]} isFirst={isFirst} />);
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TabContentComp