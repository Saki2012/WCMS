import type { ILibBaseComponentsProp } from "./LibBaseData";

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
    // 進階
    accept?: string;
    disabled?: boolean;
}
