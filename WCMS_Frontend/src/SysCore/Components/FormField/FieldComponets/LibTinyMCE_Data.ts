export interface ILibTinyMCEStyle{
    Labelstyle:string,
    SelectStyle:string,
}

export interface ILibTinyMCEProp{
    Style:ILibTinyMCEStyle,
    ColumnDisplayName:string,
    InputValue?:string|null|undefined,
    OnChange: (value: string) => void
}