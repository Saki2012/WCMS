import { useId, useMemo } from "react";
import type { ILibCheckBoxProp } from "./LibCheckBox_Data";

// #region Private
const LibCheckBox = (prop: ILibCheckBoxProp) =>
{
    const groupId = useId();
    const entries = useMemo(() => Object.entries(prop.options ?? {}), [prop.options]);

    const isRadio = prop.Style?.OptionsStyle === "radio";
    const isSingleCheckbox = !isRadio && entries.length === 1
        && (typeof prop.InputValue === "boolean" || prop.InputValue === undefined || prop.InputValue === null);

    // 供多選使用
    const selectedList: string[] = Array.isArray(prop.InputValue)
        ? prop.InputValue.map(String)
        : (typeof prop.InputValue === "string" ? String(prop.InputValue).split(",").filter(Boolean) : []);

    // 供布林單選使用
    const selectedBool = (typeof prop.InputValue === "boolean") ? prop.InputValue : undefined;

    // 供 radio 使用
    const selectedScalar = (prop.InputValue == null) ? "" : String(prop.InputValue);

    return (
        <>
            <label className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.ColumnDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                {entries.map(([itemId, itemDisplayName], idx) =>
                {
                    const uid = `${groupId}-${itemId}-${idx}`;
                    let checked = false;

                    if (isRadio)
                    {
                        checked = selectedScalar === String(itemId);
                    } else if (isSingleCheckbox)
                    {
                        checked = !!selectedBool;
                    } else
                    {
                        checked = selectedList.includes(String(itemId));
                    }

                    return (
                        <div key={uid} className="col-sm-4 col-6 float-left p-0">
                            <div className="custom-control form-check">
                                <input
                                    id={uid}
                                    name={isRadio ? groupId : undefined}
                                    className="form-check-input"
                                    type={prop.Style?.OptionsStyle}
                                    value={itemId}
                                    checked={checked}
                                    onChange={(e) =>
                                    {
                                        if (isRadio)
                                        {
                                            // 🟢 單選回傳「字串」
                                            prop.onChange?.(String(itemId));
                                            return;
                                        }
                                        if (isSingleCheckbox)
                                        {
                                            // 🟢 單一 checkbox（布林）回傳「boolean」
                                            prop.onChange?.(e.target.checked);
                                            return;
                                        }
                                        // 🟢 多選回傳「string[]」
                                        const exists = selectedList.includes(String(itemId));
                                        const next = e.target.checked
                                            ? (exists ? selectedList : [...selectedList, String(itemId)])
                                            : selectedList.filter(v => v !== String(itemId));
                                        prop.onChange?.(next);
                                    }}
                                />
                                <label className="form-check-label" htmlFor={uid}>
                                    <span className="check-txt">{itemDisplayName}</span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};


export default LibCheckBox;
// #endregion
