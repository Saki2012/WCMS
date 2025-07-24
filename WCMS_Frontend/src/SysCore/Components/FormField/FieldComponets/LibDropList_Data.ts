export interface ILibDropListStyle{
    Labelstyle:string,
    SelectStyle:string,
    OptionsStyle:string,
}

export interface ILibDropListProp{
  style: ILibDropListStyle;
  colDisplayName: string;
  options: Record<string, string>;
  InputValue: string; 
  onChange: (val: string) => void;
};


