import type { ILibBaseComponentsProp } from "./LibBaseData";

// #region Property
export interface ILibFileInputStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}


export interface ILibFileInputProp extends ILibBaseComponentsProp
{
    Style: ILibFileInputStyle;
    DefaultInputDisplay: string;
    InputValue: string;
    onChange: (internalId: string | null, fileName?: string | null) => void;
    onDelete: () => void;
    onNameChange?: (name: string) => void;
    // 進階
    accept?: string;
    disabled?: boolean;
}
// #endregion
