
import { useId, useMemo } from 'react';
import type { ILibCheckBoxProp } from "./LibCheckBox_Data"

const LibCheckBox = (prop: ILibCheckBoxProp) => {
  const inputId = useId();
  const entries = useMemo(() => Object.entries(prop.options ?? {}), [prop.options]);

  const selected: string[] = Array.isArray(prop.InputValue)
    ? prop.InputValue
    : typeof prop.InputValue === 'string'
      ? String(prop.InputValue).split(',').filter(Boolean)
      : [];

  return (
    <>
      <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.ColumnDisplayName}</label>
      <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
        {entries.map(([itemId, itemDisplayName], idx) => {
          const uid = `${inputId}-${itemId}-${idx}`; // ← 全頁唯一 id
          const checked = selected.includes(String(itemId));
          return (
            <div key={uid} className="col-sm-3 col-6 float-left p-0">
              <div className="custom-control form-check">
                <input id={uid} className="form-check-input" type={prop.checkboxStyle ?? "checkbox"} value={itemId} checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? (checked ? selected : [...selected, String(itemId)])
                      : selected.filter(v => v !== String(itemId));
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