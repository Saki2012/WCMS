import type { ILibBaseComponentsProp } from "./LibBaseData";

export interface ILibTinyMCEStyle
{
    Labelstyle: string;
    SelectStyle: string;
}

export interface ILibTinyMCEProp extends ILibBaseComponentsProp
{
    Style: ILibTinyMCEStyle;
    ColumnDisplayName: string;
    InputValue: string | null | undefined;
    OnChange: (value: string) => void;
}
