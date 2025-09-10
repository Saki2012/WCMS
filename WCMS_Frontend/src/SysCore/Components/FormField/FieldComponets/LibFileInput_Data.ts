export interface ILibFileInputStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}

export interface ILibFileInputProp
{
    Style: ILibFileInputStyle;
    ColumnDisplayName: string;
    DefaultInputDisplay: string;
    InputValue: string; // 目前 internalId（受控）
    OnChange: (internalId: string | null, fileName?: string | null) => void;
    // 進階
    accept?: string; // e.g. "image/*,.pdf"
    disabled?: boolean;
}
