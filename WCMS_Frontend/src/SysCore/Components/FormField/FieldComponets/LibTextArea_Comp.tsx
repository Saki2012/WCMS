import { useId } from "react";
import type { ILibTextAreaProp } from "./LibTextArea_Data";

// #region Private
/** 富文本 */
const LibTextArea = (prop: ILibTextAreaProp) =>
{
    const inputId = useId();
    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <textarea
                    id={inputId}
                    className={prop.Style.InputStyle}
                    placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}
                    value={prop.InputValue ?? ""}
                    onChange={(e) => prop.OnChange?.(e.target.value)}
                />
            </div>
        </>
    );
};


export default LibTextArea;
// #endregion
