import { useId } from "react";
import type { ILibTextBoxProp } from "./LibTextBox_Data";

interface LibTextBoxWithParentClassProp extends ILibTextBoxProp
{
    parentClass?: string; // 新增
    onBlur?: (e: string) => void;
}

const LibTextBox = (prop: LibTextBoxWithParentClassProp) =>
{
    const inputId = useId();
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    {
        const v = e.target.value ?? "";
        prop.onBlur?.(v);
    };
    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <input
                    id={inputId}
                    type="text"
                    className={prop.Style.InputStyle}
                    placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}
                    value={prop.InputValue ?? ""}
                    disabled={prop.disabled ?? false}
                    onChange={(e) => prop.OnChange?.(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>
        </>
    );
};

export default LibTextBox;
