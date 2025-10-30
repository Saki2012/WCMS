import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
export interface FormCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Actions: UseActionsResult;
}

/** 標籤/類別使用 */
