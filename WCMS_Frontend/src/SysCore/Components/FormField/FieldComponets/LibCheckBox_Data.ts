export interface ILibCheckBoxStyle{
    Labelstyle:string,
    SelectStyle:string,
    OptionsStyle:string,
    
}

export interface ILibCheckItemProp{

}

export interface ILibCheckBoxProp{
  style: ILibCheckBoxStyle;
  colDisplayName: string;
  options: Record<string, string>;
  InputValue: string; 
  onChange: (val: string) => void;
  Items:ILibCheckItemProp[];
};

