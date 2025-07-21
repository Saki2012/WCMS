
export interface ILibTextBoxStyle{
    
    Labelstyle:string,
    SelectStyle:string,
    InputStyle:string,
}

export interface LibTextBoxProp{
    Style:ILibTextBoxStyle,
    ColumnDisplayName:string,
    DefaultInputDisplay:string,
    InputValue?:string|null|undefined,
    OnChange: (value: string) => void
}
