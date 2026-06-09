import type { IPageManagementOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";

// #region Property
interface IPageManagementProps
{
    lang: string;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}
// #endregion

// #region Public
export const PageManagementFormComp = (props: IPageManagementProps) =>
{
    return <></>;
};
// #endregion
