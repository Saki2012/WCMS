import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang } from "@/SysCore/i18n/lang";
import { useState } from "react";
import "react-nestable/dist/styles/index.css";
import { type SiteMenuEditTarget, useSiteMenuFetchData } from "./SiteMenu_Hook";
import { RenderLeftBox } from "./SubComponents/RenderLeftBox_Comp";
import { RenderRightBox } from "./SubComponents/RenderRightBox_Comp";

// #region Public
export const SiteMenu_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const getData = useSiteMenuFetchData({ lang: prop.lang });
    const [selectedItemEdit, setSelectedItemEdit] = useState<SiteMenuEditTarget>(null);
    const formProp: FormCompProp = {
        Title: "網站功能",
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };
    return (
        <FormComp prop={formProp}>
            <div className="row">
                <RenderLeftBox
                    setSelectedItemEdit={setSelectedItemEdit}
                    siteMenuItems={getData.rawData.siteMenuItems}
                    lang={prop.lang}
                    formData={getData.rawData.formData}
                    action={getData.rawData.actions}
                />
                <RenderRightBox
                    theme={prop.theme}
                    selectedItemEdit={selectedItemEdit}
                    formData={getData.rawData.formData}
                    siteMenuItems={getData.rawData.siteMenuItems}
                    windowTarget={getData.rawData.windowTarget}
                    menuUrlType={getData.rawData.menuUrlType}
                    modulePageType={getData.rawData.modulePageType}
                    bannerDict={getData.rawData.bannerDict}
                    moduleDisplayStyle={getData.rawData.moduleDisplayStyle}
                    categorySets={getData.rawData.categorySets}
                    timelineMap={getData.rawData.timelineMap}
                    surveyMap={getData.rawData.surveyMap}
                    tagSets={getData.rawData.tagSets}
                    pageSets={getData.rawData.pageSets}
                    action={getData.rawData.actions}
                />
            </div>
        </FormComp>
    );
};
// #endregion
