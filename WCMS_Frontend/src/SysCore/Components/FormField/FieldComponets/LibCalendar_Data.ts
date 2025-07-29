export interface ILibCalendarStyle{
  Labelstyle:string,
  SelectStyle:string,
  OptionsStyle:string,
}

export interface ILibCalendarProp{
  style: ILibCalendarStyle;
  colDisplayName: string;
  InputValue: string; 
  onChange: (val: string) => void;
};

