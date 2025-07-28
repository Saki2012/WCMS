export interface IMenu_Style {
    isUl:boolean;
    ul(lv:number): string;
    ulStyle?:React.CSSProperties;
    li:(isFirst:boolean,hasMenu:boolean,isExpanded:boolean)=> string;
}
