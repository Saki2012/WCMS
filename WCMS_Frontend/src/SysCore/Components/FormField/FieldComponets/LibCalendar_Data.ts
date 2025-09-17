export interface ILibCalendarStyle
{
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}

export interface ILibCalendarProp
{
    // style: ILibCalendarStyle;
    ColumnDisplayName: string;
    InputValue?: string;
    onChange?: (val: string) => void;
}
