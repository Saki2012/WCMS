import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTabs } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { clsx } from "clsx";
import React, { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

// #region Property
const AnimationMs = 150;


type ContentProps = { tabIdPrefix: string; tabId: string; components: ReactNode[]; isActive: boolean; isVisible: boolean; };
// #endregion

// #region Section
export const TabContentComp = (props: { tabInfos: LibTabsProp; components: Record<string, React.ReactNode[]>; }) =>
{
    const uid = useId().replace(/:/g, "");
    const tabIdPrefix = `Tab_TWEN_${uid}`;
    const keys = useMemo(() => Object.keys(props.tabInfos.item), [props.tabInfos.item]);
    const [currentKey, setCurrentKey] = useState(() => props.tabInfos.activeKey ?? resolveInitialKey(props.tabInfos.item));
    const [visibleKey, setVisibleKey] = useState(currentKey);
    const [activeKeys, setActiveKeys] = useState<string[]>(currentKey ? [currentKey] : []);
    const timerRef = useRef<number | null>(null);

    /** 切換 tab 並保留 Bootstrap fade 動畫。 */
    const changeTab = (nextKey: string) =>
    {
        if (!nextKey || nextKey === currentKey) return;

        const prevKey = currentKey;
        if (timerRef.current) window.clearTimeout(timerRef.current);

        props.tabInfos.onActiveKeyChange?.(nextKey);
        setCurrentKey(nextKey);
        setActiveKeys([prevKey, nextKey].filter(Boolean));
        setVisibleKey("");

        window.requestAnimationFrame(() =>
        {
            setVisibleKey(nextKey);
            timerRef.current = window.setTimeout(() => setActiveKeys([nextKey]), AnimationMs);
        });
    };

    useEffect(() =>
    {
        if (keys.includes(currentKey)) return;
        const nextKey = props.tabInfos.activeKey ?? keys[0] ?? "";
        setCurrentKey(nextKey);
        setVisibleKey(nextKey);
        setActiveKeys(nextKey ? [nextKey] : []);
    }, [keys, currentKey, props.tabInfos.activeKey]);

    useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form">
                    <div className="row mx-0">
                        <LibTabs {...props.tabInfos} activeKey={currentKey} onActiveKeyChange={changeTab} tabIdPrefix={tabIdPrefix} />
                        <div className="tab-content px-0" id={tabIdPrefix}>
                            {keys.map((key) =>
                            {
                                const components = props.components.hasOwnProperty(key) ? props.components[key] : [<div>Key:{key}尚未提供內容</div>];
                                return <Content key={key} tabIdPrefix={tabIdPrefix} tabId={key} components={components} isActive={activeKeys.includes(key)} isVisible={visibleKey === key} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
const Content = ({ tabIdPrefix, tabId, components, isActive, isVisible }: ContentProps) =>
{
    return (
        <div className={clsx("tab-pane fade", { active: isActive, show: isVisible })} role="tabpanel" id={`${tabIdPrefix}_${tabId}`} aria-labelledby={`${tabIdPrefix}_tab_${tabId}`}>
            <div className="form row px-3">
                {components.map((ComponentNode, idx) =>
                {
                    const className = React.isValidElement(ComponentNode) && ComponentNode.props.parentClass ? ComponentNode.props.parentClass : "col-12";

                    return (
                        <div className={className} key={idx}>
                            <div className="form-group">
                                <div className="row justify-content-center-start">{ComponentNode}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


/** 取得目前 tab 初始 key。 */
const resolveInitialKey = (items: Record<string, string>): string => Object.keys(items)[0] ?? "";
// #endregion
