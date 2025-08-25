export interface ILibTextBoxStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}

export interface ILibTextBoxStyle2
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}
export interface ILibTextBoxStyle3
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}

export interface ILibTextBoxProp
{
    Style: ILibTextBoxStyle;
    ColumnDisplayName: string;
    DefaultInputDisplay: string;
    InputValue?: string | number | null | undefined;
    OnChange?: (value: string) => void;
}
