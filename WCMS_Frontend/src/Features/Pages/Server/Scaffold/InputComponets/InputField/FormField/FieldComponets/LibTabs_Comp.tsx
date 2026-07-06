import { clsx } from "clsx";
import { type KeyboardEvent, useEffect, useId, useState } from "react";

// #region Property
export interface ILibTabsStyle
{
    UlStyle: string;
    LiStyle: string;
    BtnStyle: string;
    RemoveBtnStyle?: string;
}


export interface LibTabsProp
{
    Style: ILibTabsStyle;
    item: Record<string, string>;
    onAddTab?: () => void;
    onRemoveTab?: (key: string) => void;
    isRemovable?: (key: string) => boolean;
    activeKey?: string;
    onActiveKeyChange?: (key: string) => void;
    tabIdPrefix?: string;
}
// #endregion

// #region Private
/** 取得目前可切換的 tab key 清單。 */
const getTabKeys = (item: Record<string, string>): string[] => Object.keys(item);


/** 依鍵盤操作取得下一個 tab key。 */
const getNextKey = (keys: string[], activeKey: string, action: "prev" | "next" | "first" | "last"): string =>
{
    if (keys.length === 0) return activeKey;
    if (action === "first") return keys[0];
    if (action === "last") return keys[keys.length - 1];

    const index = Math.max(keys.indexOf(activeKey), 0);
    const nextIndex = action === "next" ? (index + 1) % keys.length : (index - 1 + keys.length) % keys.length;
    return keys[nextIndex];
};


export const LibTabs = (prop: LibTabsProp) =>
{
    const uid = useId();
    const tabIdPrefix = prop.tabIdPrefix ?? "Tab_TWEN";
    const entries = Object.entries(prop.item);
    const [innerActiveKey, setInnerActiveKey] = useState(entries[0]?.[0] ?? "");
    const activeKey = prop.activeKey ?? innerActiveKey;

    useEffect(() =>
    {
        if (activeKey && prop.item[activeKey]) return;
        setInnerActiveKey(entries[0]?.[0] ?? "");
    }, [activeKey, entries, prop.item]);

    /** 切換目前作用中的 tab，改由 React 控制，不依賴 Bootstrap JS。 */
    const changeTab = (key: string) =>
    {
        if (!key || key === activeKey) return;
        if (prop.activeKey === undefined) setInnerActiveKey(key);
        prop.onActiveKeyChange?.(key);
    };

    /** 補齊 AA 鍵盤操作：左右鍵、Home、End。 */
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: string) =>
    {
        const actionMap: Record<string, "prev" | "next" | "first" | "last" | undefined> = {
            ArrowLeft: "prev",
            ArrowUp: "prev",
            ArrowRight: "next",
            ArrowDown: "next",
            Home: "first",
            End: "last",
        };

        const action = actionMap[e.key];
        if (!action) return;

        e.preventDefault();
        const nextKey = getNextKey(getTabKeys(prop.item), key, action);
        changeTab(nextKey);
        document.getElementById(`${tabIdPrefix}_tab_${nextKey}`)?.focus();
    };

    return (
        <ul className={prop.Style.UlStyle} id={uid} role="tablist">
            {entries.map(([key, label]) =>
            {
                const isActive = key === activeKey;
                return (
                    <li key={key} className={prop.Style.LiStyle} role="presentation">
                        <button
                            id={`${tabIdPrefix}_tab_${key}`}
                            className={clsx(prop.Style.BtnStyle, isActive && "active")}
                            type="button"
                            role="tab"
                            aria-selected={isActive ? "true" : "false"}
                            aria-controls={`${tabIdPrefix}_${key}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => changeTab(key)}
                            onKeyDown={(e) => handleKeyDown(e, key)}
                        >
                            <h4 className="tab-name">{label}</h4>
                        </button>

                        {prop.onRemoveTab && (!prop.isRemovable || prop.isRemovable(key)) && (
                            <button
                                type="button"
                                className={clsx("btn-remove-tab", prop.Style.RemoveBtnStyle)}
                                title="移除"
                                aria-label={`移除「${String(label)}」分頁`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prop.onRemoveTab?.(key); }}
                                onKeyDown={(e) =>
                                {
                                    if (e.key !== "Enter" && e.key !== " ") return;
                                    e.preventDefault();
                                    prop.onRemoveTab?.(key);
                                }}
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </li>
                );
            })}
            {prop.onAddTab && (
                <li className={prop.Style.LiStyle} role="presentation">
                    <button type="button" className={clsx(prop.Style.BtnStyle, "btn-add-tab")} onClick={prop.onAddTab}>＋</button>
                </li>
            )}
        </ul>
    );
};
// #endregion
