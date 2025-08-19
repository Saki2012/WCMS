
export interface ILibTextAreaStyle{
    Labelstyle:string,
    SelectStyle:string,
    InputStyle:string,
}

export interface ILibTextAreaStyle2{
    Labelstyle:string,
    SelectStyle:string,
    InputStyle:string,
}

export interface ILibTextAreaProp{
    Style:ILibTextAreaStyle,
    ColumnDisplayName:string,
    DefaultInputDisplay:string,
    InputValue?:string|null|undefined,
    OnChange?: (value: string) => void
}
