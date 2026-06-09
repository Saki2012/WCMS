// #region Property
export interface ILibSwitchStyle
{
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}


export interface ILibSwitchItemProp
{
    itemId: string; // 對應欄位值
    itemDisplayName: string; // 顯示用名稱
}


export interface ILibSwitchProp
{
    style?: ILibSwitchStyle; // 樣式，可選
    colDisplayName: string; // 左側顯示欄位名稱
    checkboxStyle: "checkbox" | "radio" | string;
    options?: ILibSwitchItemProp[]; // 選項清單
    value?: string[]; // 當前選中的 value 陣列（通常是 string[]）
    onChange?: (val: string[]) => void; // 勾選變更時的 callback
}
// #endregion
