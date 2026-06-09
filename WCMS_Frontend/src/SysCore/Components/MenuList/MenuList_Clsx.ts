// #region Property
export interface IMenu_Style
{
    isUl: boolean;
    ul(lv: number): string;
    ulStyle?: React.CSSProperties;
    li: (lv: number, isFirst: boolean, hasMenu: boolean, isExpanded: boolean) => string;
}
// #endregion
