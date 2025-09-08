
export interface ILibUserCardStyle{
    Bgstyle:string,
}

export interface ILibUserCardProp{
    Style?:ILibUserCardStyle,
    DisplayNameEN:string,
    DisplayNameTW:string,
    DisplayRole:string,
    PicSrc:string,
    dirUrl?: string
}
