/** checkbox / radio 欄位，保留原本外層 DOM，只將 input 換成 AAInputControlItem。 無使用AAInputFieldItem 20260630*/
import { useId, useMemo } from "react";
import type { ChangeEvent } from "react";
import type { ILibCheckBoxProp } from "./LibCheckBox_Data";
import { AAInputControlItem } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Public
export const LibCheckBox = (prop: ILibCheckBoxProp) =>
{
    const groupId = useId();
    const entries = useMemo(() => Object.entries(prop.options ?? {}), [prop.options]);
    const isRadio = prop.Style?.OptionsStyle === "radio";
    const inputType = isRadio ? "radio" : "checkbox";
    const isSingleCheckbox = !isRadio && entries.length === 1
        && (typeof prop.InputValue === "boolean" || prop.InputValue === undefined || prop.InputValue === null);
    const selectedList: string[] = Array.isArray(prop.InputValue)
        ? prop.InputValue.map(String)
        : (typeof prop.InputValue === "string" ? String(prop.InputValue).split(",").filter(Boolean) : []);
    const selectedBool = typeof prop.InputValue === "boolean" ? prop.InputValue : undefined;
    const selectedScalar = prop.InputValue == null ? "" : String(prop.InputValue);

    /** 處理 checkbox / radio 欄位變更。 */
    const handleChange = (
        event: ChangeEvent<HTMLInputElement>,
        itemId: string,
    ) =>
    {
        if (isRadio)
        {
            prop.onChange?.(String(itemId));
            return;
        }

        if (isSingleCheckbox)
        {
            prop.onChange?.(event.target.checked);
            return;
        }

        const exists = selectedList.includes(String(itemId));
        const next = event.target.checked
            ? (exists ? selectedList : [...selectedList, String(itemId)])
            : selectedList.filter(v => v !== String(itemId));

        prop.onChange?.(next);
    };

    return (
        <>
            <label className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                {prop.ColumnDisplayName}
                {prop.ColumnHint && <small className="text-muted ms-1">{prop.ColumnHint}</small>}
            </label>
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
                                <AAInputControlItem
                                    id={uid}
                                    name={isRadio ? groupId : undefined}
                                    className="form-check-input aa-input-control-item"
                                    type={inputType}
                                    value={itemId}
                                    checked={checked}
                                    aaLabel={`${prop.ColumnDisplayName} ${itemDisplayName}`}
                                    onChange={(event) => handleChange(event, itemId)}
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
// #endregion
