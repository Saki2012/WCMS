import { useId, useMemo } from "react";
import type { ILibCheckBoxSingleProp } from "./LibCheckBoxSingle_Data";

// #region Private
const LibCheckBoxSingle = (prop: ILibCheckBoxSingleProp) =>
{
    const inputId = useId();
    const uidList = useMemo(() => prop.options?.map((opt, i) => `checkbox-${opt.itemId ?? i}-${inputId}`), [prop.options, inputId]);
    const groupName = prop.name ?? "lib-radio-group"; // ★ 同組名稱（radio 需要）
    const isRadio = prop.checkboxStyle === "radio";
    return (
        <>
            <div className="col-12 float-md-left float-sm-none">
                {prop.options?.map((item, idx) =>
                {
                    const uid = uidList?.[idx];
                    const isChecked = prop.value?.includes(item.itemId);
                    return (
                        <div key={uid} className="col-12 float-left p-0">
                            <div className="custom-control form-check">
                                <input
                                    className="form-check-input"
                                    name={groupName}
                                    type={prop.checkboxStyle}
                                    id={uid}
                                    value={item.itemId}
                                    checked={isChecked}
                                    onChange={(e) =>
                                    {
                                        if (!prop.onChange)
                                        {
                                            return;
                                        }
                                        if (isRadio)
                                        {
                                            // radio：只能選一個；不能清空 → 只有 checked 才回寫
                                            if (e.target.checked)
                                            {
                                                prop.onChange([item.itemId]); // ★ 單值陣列
                                            }
                                            return;
                                        }
                                        // checkbox：多選
                                        const base = Array.isArray(prop.value) ? prop.value : [];
                                        const newVal = e.target.checked ? [...base, item.itemId] : base.filter((v) => v !== item.itemId);
                                        prop.onChange(newVal);
                                    }}
                                />
                                <label className="form-check-label" htmlFor={uid}>
                                    <span className="check-txt">{item.itemDisplayName}</span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};


export default LibCheckBoxSingle;
// #endregion
