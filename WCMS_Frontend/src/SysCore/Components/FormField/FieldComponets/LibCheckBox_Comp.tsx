
import { useId, useMemo } from 'react';
import type { ILibCheckBoxProp } from "./LibCheckBox_Data"

const LibCheckBox = (prop: ILibCheckBoxProp) => {
  const inputId = useId();
  const uidList = useMemo(() => { return prop.options?.map(opt => `checkbox-${opt.itemId}`); }, [prop.options]);

  return (
    <>
      <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.colDisplayName}</label>
      <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
        {prop.options?.map((item, idx) => {
          const uid = uidList?.[idx];
          const isChecked = prop.value.includes(item.itemId);
          return (
            <div key={uid} className="col-sm-3 col-6 float-left p-0">
              <div className="custom-control form-check">
                <input className="form-check-input" type={prop.checkboxStyle ?? "checkbox"} id={uid} value={item.itemId} checked={isChecked} onChange={(e) => {
                  const newVal = e.target.checked ? [...prop.value, item.itemId] : prop.value.filter((v) => v !== item.itemId);
                  prop.onChange(newVal);
                }} />
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

export default LibCheckBox;