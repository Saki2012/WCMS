export interface ILibCheckBoxSingleStyle
{
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: string;
}

export interface ILibCheckItemSingleProp
{
    itemId: string; // 對應欄位值
    itemDisplayName: string; // 顯示用名稱
}

export interface ILibCheckBoxSingleProp
{
    style?: ILibCheckBoxSingleStyle; // 樣式，可選
    // colDisplayName: string;                // 左側顯示欄位名稱
    checkboxStyle: "checkbox" | "radio" | string;
    options?: ILibCheckItemSingleProp[]; // 選項清單
    value?: string[]; // 當前選中的 value 陣列（通常是 string[]）
    onChange?: (val: string[]) => void; // 勾選變更時的 callback
    name?: string;
}
