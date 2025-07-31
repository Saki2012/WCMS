import dayjs from "dayjs";

/** 動態根據輸入的內容得到是Enum的值或是Value*/
export function EnumMap<T extends Record<string, string|number>>(map: T) {
  const reverseMap = Object.entries(map).reduce((acc, [key, value]) => {
    acc[value] = key as keyof T;
    return acc;
  }, {} as Record<string, keyof T>);

  return {
    getValue: (key: string|number,defaultValue?: T[keyof T]): T[keyof T] => {return map[key as keyof T] ?? defaultValue!;},
    getKey: (val: string): keyof T | null => reverseMap[val] ?? null,
  };
}
// getValue 的函式型別
export type EnumGetValueFunc<T extends Record<string, string | number>> = (key: string | number,defaultValue?: T[keyof T]) => T[keyof T];
// getKey 的函式型別
export type EnumGetKeyFunc<T extends Record<string, string | number>> = (val: string) => keyof T | null;


export const FormatDateTime = (value: string | null | undefined): string => {
  if (!value) return "";
  return dayjs(value).format("YYYY/MM/DD  HH:mm:ss");
};

export const FormatDate = (value: string | null | undefined): string => {
  if (!value) return "";
  return dayjs(value).format("YYYY/MM/DD");
};