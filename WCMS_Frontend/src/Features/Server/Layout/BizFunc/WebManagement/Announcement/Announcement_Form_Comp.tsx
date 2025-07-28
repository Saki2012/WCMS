import {LibDropList, LibTabs, LibTextBox, LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import AnnouncementProvider from "./Announcement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import { useGetAnnouncementFormData } from "./Announcement_Hook";
import type { components } from "../../../../../../types/api";
import type { ILibDropListProp } from "../../../../../../SysCore/Components/FormField/FieldComponets/LibDropList_Data";
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { useEffect } from "react";
import { useMessage } from "../../../../../../SysCore/Components/Message/Dialog/Dialog_Comp";
/** 頁面表單
 * @returns 
 */
export const AnnouncementFormComp = ({theme}:{theme:IBETheme}) => {
    const { internalId } = useParams()
    const useCategory = useGetCategoryListByProgId("Announcement","zh-tw")
    const useTag = useGetCategoryListByProgId("Announcement","zh-tw")


    const usePageFormData = useGetAnnouncementFormData(internalId as string);


    const useToolbar = useFormToolbarActions(AnnouncementProvider(), usePageFormData.data ?? emptyData as AnnouncementSet, internalId as string)
    const isLoading=[useCategory.isLoading,usePageFormData.isLoading]
    const errors=[useCategory.error,usePageFormData.error]
    useEffect(() => {if (usePageFormData.data) {useToolbar.setFormData(usePageFormData.data);}}, [usePageFormData.data]);

    const prop:FormCompProp={ Title:"新增頁面", Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.action }
    const LibTabsPropA:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Basic":"基本",
            "Status":"狀態",
            "Tabs":"標籤",
            "Pic":"圖片",
        }
    }
    const LibTabsPropB:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "zh-tw":"繁體中文",
            "en":"English",
        }
    }
    const libDropListProp:ILibDropListProp={
        style:theme.DropList,
        colDisplayName:"類別選擇",
        options:useCategory.data,
        InputValue:useToolbar.formData?.Announcement?.CategoryId ?? '',
        onChange:(val) => {useToolbar.setFormData({...useToolbar.formData,PageManagement: {...useToolbar.formData?.Announcement,CategoryId: val}});}
    }

    return (
        <FormComp prop={prop}>
            <div className="panel">
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <LibTabs {...LibTabsPropA}></LibTabs>
                            <div className="tab-content px-0" id="myTabContent_Setup">
                                <div className="tab-pane fade show active" role="tabpanel" id="Tab_Setup1">
                                    <div className="form">
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <LibDropList {...libDropListProp}></LibDropList>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="panel">
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <LibTabs {...LibTabsPropB}></LibTabs>
                            <div className="tab-content px-0" id="myTabContent_TWEN">
                                <DynamicRenderContentControl theme={theme} libTabsProp={LibTabsPropB} useToolbar={useToolbar}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    )
}

const DynamicRenderContentControl = ({theme,libTabsProp,useToolbar,}: {theme: IBETheme;libTabsProp: LibTabsProp;useToolbar: ReturnType<typeof useFormToolbarActions<AnnouncementSet>>;}) => {
    const details = useToolbar.formData.AnnouncementDetail ?? [];
    const tabEntries = Object.entries(libTabsProp.item ?? []);
    const getLangData = (lang: string) => details.find((d) => d.Lang === lang) ?? { Lang: lang, Title: "", Content: "" };

  const updateLangData = (lang: string, key: "Title" | "Content", val: string) => {
    const currentData = getLangData(lang);
    const newItem = { ...currentData, [key]: val };

    // 是否兩個欄位都為空，則視為不儲存
    const isEmpty = (newItem.Title?.trim() ?? "") === "" && (newItem.Content?.trim() ?? "") === "";

    const nextDetails = isEmpty
      ? details.filter((d) => d.Lang !== lang) // 移除
      : details.some((d) => d.Lang === lang)
        ? details.map((d) => (d.Lang === lang ? newItem : d)) // 更新
        : [...details, newItem]; // 新增

    useToolbar.setFormData({
      ...useToolbar.formData,
      AnnouncementDetail: nextDetails,
    });
  };

  return (
    <>
        {tabEntries.map(([lang, label], idx) => {
        const isActive = idx === 0;
        const data = getLangData(lang);

        const libTextBoxProp: LibTextBoxProp = {
            Style: theme.TextBox,
            ColumnDisplayName: `標題（${lang}）`,
            DefaultInputDisplay: "請輸入",
            InputValue: data.Title ?? "",
            OnChange: (val) => updateLangData(lang, "Title", val),
        };

        const libTinyMCEProp: LibTinyMCEProp = {
            Style: theme.TinyMCE,
            ColumnDisplayName: `內容編輯器（${lang}）`,
            InputValue: data.Content ?? "",
            OnChange: (val) => updateLangData(lang, "Content", val),
        };

        return (
            <div key={lang} className={`tab-pane fade ${isActive ? "show active" : ""}`} role="tabpanel" id={`Tab_TWEN_${lang}`}>
                <div className="form">
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                            <LibTextBox {...libTextBoxProp} />
                            </div>
                        </div>
                    </div>
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                            <LibTinyMCE {...libTinyMCEProp} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
        })}
    </>
  );
};
