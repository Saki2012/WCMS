import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useBannerSliderListGridTemplate } from "./Server_BannerSlider_List_Hook";

// #region Public
/** 廣告輪播列表 */
export const BannerSliderListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useBannerSliderListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={BannerSliderSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染廣告輪播列表搜尋列 */
const BannerSliderSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="廣告輪播列表搜尋"
        />
    );
};
// #endregion
