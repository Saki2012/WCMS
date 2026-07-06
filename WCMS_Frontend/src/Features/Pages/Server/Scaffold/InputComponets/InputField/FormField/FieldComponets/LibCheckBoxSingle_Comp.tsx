/** checkbox / radio 單列群組，保留原本外層 DOM，只將 input 換成 AAInputControlItem。 無使用AAInputFieldItem 20260701*/
import { useId, useMemo } from "react";
import type { ChangeEvent } from "react";
import type { ILibCheckBoxSingleProp } from "./LibCheckBoxSingle_Data";
import { AAInputControlItem } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Public
export const LibCheckBoxSingle = (prop: ILibCheckBoxSingleProp) =>
{
    const inputId = useId();
    const uidList = useMemo(() => prop.options?.map((opt, i) => `checkbox-${opt.itemId ?? i}-${inputId}`), [prop.options, inputId]);
    const groupName = prop.name ?? "lib-radio-group";
    const isRadio = prop.checkboxStyle === "radio";
    const inputType = isRadio ? "radio" : "checkbox";

    /** 處理 radio / checkbox 變更並維持原本回傳 string[]。 */
    const handleChange = (
        event: ChangeEvent<HTMLInputElement>,
        itemId: string,
    ) =>
    {
        if (!prop.onChange) return;

        if (isRadio)
        {
            if (event.target.checked) prop.onChange([itemId]);
            return;
        }

        const base = Array.isArray(prop.value) ? prop.value : [];
        const nextValue = event.target.checked
            ? [...base, itemId]
            : base.filter((value) => value !== itemId);

        prop.onChange(nextValue);
    };

    return (
        <>
            <div className="col-12 float-md-left float-sm-none">
                {prop.options?.map((item, idx) =>
                {
                    const uid = uidList?.[idx] ?? `checkbox-${item.itemId ?? idx}-${inputId}`;
                    const isChecked = prop.value?.includes(item.itemId) ?? false;

                    return (
                        <div key={uid} className="col-12 float-left p-0">
                            <div className="custom-control form-check">
                                <AAInputControlItem
                                    className="form-check-input"
                                    name={groupName}
                                    type={inputType}
                                    id={uid}
                                    value={item.itemId}
                                    checked={isChecked}
                                    aaLabel={item.itemDisplayName}
                                    onChange={(event) => handleChange(event, item.itemId)}
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
// #endregion