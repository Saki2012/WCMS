import { useId } from "react";
import type { LibTabsProp } from "./LibTabs_Data"
import { clsx } from "clsx";
const LibTabs = (prop: LibTabsProp) => {
    const uid = useId();
    return (
        <ul className={prop.Style.UlStyle} id={uid} role="tablist">
            {Object.entries(prop.item).map(([key, label], idx) => {
                const isActive = idx === 0;
                return (
                    <li key={key} className={prop.Style.LiStyle} role="presentation">
                        <button className={clsx(prop.Style.BtnStyle, isActive && "active")} data-bs-toggle="tab" data-bs-target={`#Tab_TWEN_${key}`}
                            type="button" role="tab" aria-selected={isActive ? "true" : "false"}>
                            <h4 className="tab-name">{label}</h4>
                        </button>
                    </li>
                )
            })}
            {/* 固定在最後的 + 按鈕 */}
            {prop.onAddTab && (
                <li className={prop.Style.LiStyle} role="presentation">
                    <button type="button" className={clsx(prop.Style.BtnStyle, "btn-add-tab")} onClick={prop.onAddTab}>＋</button>
                </li>
            )}
        </ul>
    );
}

export default LibTabs;