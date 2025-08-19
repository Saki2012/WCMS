export interface ILibDropListStyle{
    Labelstyle:string,
    SelectStyle:string,
    OptionsStyle:string,
}

export interface ILibDropListProp{
  Style: ILibDropListStyle;
  ColumnDisplayName: string;
  Options?: Record<string, string>;
  InputValue?: string; 
  onChange?: (val: string) => void;
};


