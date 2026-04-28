import { clsx } from "clsx";
import { useId } from "react";

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
    /**（可選）回傳 false 可讓特定 key 不可刪 */
    isRemovable?: (key: string) => boolean;
}

const LibTabs = (prop: LibTabsProp) =>
{
    const uid = useId();
    return (
        <ul className={prop.Style.UlStyle} id={uid} role="tablist">
            {Object.entries(prop.item).map(([key, label], idx) =>
            {
                const isActive = idx === 0;
                return (
                    <li key={key} className={prop.Style.LiStyle} role="presentation">
                        <button
                            className={clsx(prop.Style.BtnStyle, isActive && "active")}
                            data-bs-toggle="tab"
                            data-bs-target={`#Tab_TWEN_${key}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive ? "true" : "false"}
                        >
                            <h4 className="tab-name">{label}</h4>
                        </button>

                        {prop.onRemoveTab && (!prop.isRemovable || prop.isRemovable(key)) && (
                            <button
                                type="button"
                                className={clsx("btn-remove-tab", prop.Style.RemoveBtnStyle)}
                                title="移除"
                                aria-label={`移除「${String(label)}」分頁`}
                                onClick={(e) =>
                                {
                                    // 避免點 X 觸發切換分頁
                                    e.preventDefault();
                                    e.stopPropagation();
                                    prop.onRemoveTab?.(key);
                                }}
                                onKeyDown={(e) =>
                                {
                                    // 鍵盤操作：Enter/Space 也能刪除
                                    if (e.key === "Enter" || e.key === " ")
                                    {
                                        e.preventDefault();
                                        prop.onRemoveTab?.(key);
                                    }
                                }}
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </li>
                );
            })}
            {/* 固定在最後的 + 按鈕 */}
            {prop.onAddTab && (
                <li className={prop.Style.LiStyle} role="presentation">
                    <button type="button" className={clsx(prop.Style.BtnStyle, "btn-add-tab")} onClick={prop.onAddTab}>＋</button>
                </li>
            )}
        </ul>
    );
};

export default LibTabs;
