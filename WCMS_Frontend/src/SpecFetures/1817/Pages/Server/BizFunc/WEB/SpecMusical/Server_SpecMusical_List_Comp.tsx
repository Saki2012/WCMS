import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { ReactNode } from "react";
import {
    type SpecMusicalListRenderers,
    type SpecMusicalSet,
    useSpecMusicalListGridTemplate,
} from "./Server_SpecMusical_List_Hook";

// #region Property
const coverImageStyle = { width: "80px", height: "80px", objectFit: "cover" } as const;
// #endregion

// #region Public
/** 後台樂器列表 */
export const Server_SpecMusical_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useSpecMusicalListGridTemplate({ lang: prop.lang, renderers: specMusicalListRenderers });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={SpecMusicalSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染樂器列表搜尋列 */
const SpecMusicalSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="樂器列表搜尋"
        />
    );
};
// #endregion

// #region Protected
/** 渲染樂器封面圖 */
const buildSpecMusicalCoverContentNode = (set: SpecMusicalSet): ReactNode =>
{
    const fileId = set.SpecMusical?.CoverPicId;
    if (!fileId) return "";

    const musicalName = set.SpecMusical?.MusicalName ?? "樂器";
    return <img src={FileManagementAPI.get_Server_Preview_Url(fileId)} style={coverImageStyle} alt={`${musicalName}封面圖`} />;
};
// #endregion

// #region Private
/** 建立列表自定義欄位節點產生器 */
const specMusicalListRenderers: SpecMusicalListRenderers = {
    buildCoverContentNode: buildSpecMusicalCoverContentNode,
};
// #endregion
