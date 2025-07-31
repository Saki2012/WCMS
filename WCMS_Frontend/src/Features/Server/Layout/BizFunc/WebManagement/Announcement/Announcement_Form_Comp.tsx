import {LibTextBox, LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import AnnouncementProvider from "./Announcement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { components } from "../../../../../../types/api";
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { useEffect } from "react";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import LibCheckBox from "../../../../../../SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import LibCalendar from "../../../../../../SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";
import { useFetchFormData } from "../../../../../../SysCore/Utils/FetchFormData";


const emptyData:AnnouncementSet={
    Announcement:{},
    AnnouncementDetail:[]
}
/** 頁面表單
 * @returns 
 */
export const AnnouncementFormComp = ({theme}:{theme:IBETheme}) => {
    const { internalId } = useParams();
    const useCategory = useGetCategoryListByProgId("Announcement","zh-tw");
    const useTag = useGetTagListByProgId("Announcement","zh-tw");
    const formData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(),internalId,emptyData)
    const useToolbar = useFormToolbarActions(AnnouncementProvider(), formData.data as AnnouncementSet, internalId ,() => formData.refetch())
    const isLoading=[useTag.isLoading,useCategory.isLoading,formData.isLoading]
    const errors=[useTag.error,useCategory.error,formData.error]
    
    useEffect(() => {if (formData.data) {formData.setFormData(formData.data);}}, [formData.data]);

    const prop:FormCompProp={ Title:"新增公告", Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.action }
    const LibTabsPropA:LibTabsProp={
        Style:theme.Tabs,
        item:{"Basic":"基本","Status":"狀態","Tags":"標籤","Pic":"圖片","Files":"附件",}
    }
    const LibTabsPropB:LibTabsProp={
        Style:theme.Tabs,
        item:{"zh-tw":"繁體中文","en":"English",}
    }

    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox colDisplayName="類別" 
                            options={Object.entries(useCategory.data ?? {}).map(([key, value]) => ({itemId: key,itemDisplayName: value,}))}
                            value={formData.data?.Announcement?.Categories?.split(",") ?? []}
                            onChange={(val) => {const joined = val.join(",");formData.setFormData((prev) => ({...prev,Announcement: {...prev?.Announcement,Categories: joined,},}));}
                            }/>,
                <LibCalendar colDisplayName={"開始時間"}/>,
                <LibCalendar colDisplayName={"結束時間"}/>,
                ],

        Status: [<LibCheckBox colDisplayName="狀態啟用" 
                            options={[ { itemId: "Top", itemDisplayName: "置頂" }, { itemId: "Hot", itemDisplayName: "熱門" },{ itemId: "Hide", itemDisplayName: "隱藏" } ]} 
                            value={["user"]} onChange={(val) => console.log("選中的值:", val)}/>],

        Tags: [<LibCheckBox colDisplayName="標籤" 
                            options={[ { itemId: "admin", itemDisplayName: "管理員" }, { itemId: "user", itemDisplayName: "使用者" }, ]} 
                            value={["user"]} onChange={(val) => console.log("選中的值:", val)}/>,
                ],

        // Pic: [  <LibPicturePreview ColumnDisplayName="圖片預覽"/>,
        //         <LibFile ColumnDisplayName="公告圖片上傳"/>,
        //         <LibTextBox ColumnDisplayName="公告圖片說明"/>,],

        // Files: [<LibFileInput/>,],//動態增加或減少檔案
    };


    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as AnnouncementSet,formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );

    return (
        <FormComp prop={prop}>
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        </FormComp>
    )
}

const generateLangFields = ( lang: string, label: string, theme: IBETheme, 
    formData:AnnouncementSet,  setFormData: React.Dispatch<React.SetStateAction<AnnouncementSet | null>>
    ): React.ReactNode[] => 
    {
    const details = formData?.AnnouncementDetail ?? [];
    const getLangData = (): AnnouncementSet["AnnouncementDetail"][number] => details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "", SubTitle: "", Content: "", Url: "" };
    const updateLangData = (key: "Title" | "SubTitle" | "Content" | "Url", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.Title?.trim() ?? "") === "" && (newItem.Content?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, AnnouncementDetail: nextDetails });
    };
    const data = getLangData();
  return [
    <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Title ?? ""} OnChange={(val) => updateLangData("Title", val)} />,
    <LibTextBox key={`${lang}-SubTitle`} Style={theme.TextBox} ColumnDisplayName={`副標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.SubTitle ?? ""} OnChange={(val) => updateLangData("SubTitle", val)} />,
    <LibTinyMCE key={`${lang}-Content`} Style={theme.TinyMCE} ColumnDisplayName={`內容編輯器（${label}）`} InputValue={data.Content ?? ""} OnChange={(val) => updateLangData("Content", val)} />,
    <LibTextBox key={`${lang}-Url`} Style={theme.TextBox} ColumnDisplayName={`網址（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Url ?? ""} OnChange={(val) => updateLangData("Url", val)} />,
  ];
};