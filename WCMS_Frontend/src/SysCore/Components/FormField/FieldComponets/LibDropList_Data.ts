export interface ILibDropListStyle{
    Labelstyle:string,
    SelectStyle:string,
    OptionsStyle:string,
}

export interface LibDropListProp{
    Style:ILibDropListStyle,
    ColumnDisplayName:string,
    Options:Record<string, string>
}