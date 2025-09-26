import { extend } from "jquery";
import type { ILibBaseComponentsProp } from "./LibBaseData";

export interface ILibCheckBoxStyle
{
    Labelstyle: string;
    SelectStyle: string;
    OptionsStyle: "checkbox" | "radio";
}
type CheckValue = string | string[] | boolean;

export interface ILibCheckBoxProp extends ILibBaseComponentsProp
{
    Style: ILibCheckBoxStyle | undefined; // 樣式，可選
    options: Record<string, string>; // 選項清單
    InputValue: CheckValue; // 當前選中的 value 陣列（通常是 string[]）
    onChange?: (val: CheckValue) => void; // 勾選變更時的 callback
}
