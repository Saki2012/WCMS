export interface ILibTabsStyle
{
    UlStyle: string;
    LiStyle: string;
    BtnStyle: string;
}

export interface LibTabsProp
{
    Style: ILibTabsStyle;
    item: Record<string, string>;
    onAddTab?: () => void;
}
