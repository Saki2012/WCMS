import { useId, useMemo } from "react";
import type { ILibSwitchProp } from "./LibSwitch_Data";

// #region Public
/** 切換選項欄位，支援 checkbox / switch 類型的多選值。 */
export const LibSwitch = (prop: ILibSwitchProp) =>
{
    const inputId = useId();
    const selectedValues = prop.value ?? [];

    const uidList = useMemo(() =>
    {
        return (prop.options ?? []).map(opt => `checkbox-${opt.itemId}`);
    }, [prop.options]);

    return (
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.colDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                {prop.options?.map((item, idx) =>
                {
                    const uid = uidList[idx] ?? `${inputId}-${idx}`;
                    const isChecked = selectedValues.includes(item.itemId);

                    /** 更新目前切換欄位的選取值。 */
                    const handleChange = (checked: boolean) =>
                    {
                        const newVal = checked ? [...selectedValues, item.itemId] : selectedValues.filter(v => v !== item.itemId);
                        prop.onChange?.(newVal);
                    };

                    return (
                        <div key={uid} className="col-12 float-left p-0">
                            <div className="custom-control form-check form-switch">
                                <input
                                    className="form-check-input"
                                    role="switch"
                                    type={prop.checkboxStyle}
                                    id={uid}
                                    value={item.itemId}
                                    checked={isChecked}
                                    onChange={(e) => handleChange(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor={uid}>
                                    <span className="check-txt">
                                        ( <span className="Iicon off"></span>關閉 / <span className="Iicon on"></span>啟用 )
                                    </span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
// #endregion
