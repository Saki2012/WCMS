import {LibCheckBox, LibTextBox ,LibCalendar,LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp,LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";


/** 相簿表單
 * @returns 
 */
export const GalleryFormComp = ({theme}:{theme:IBETheme}) => {
    const { uid } = useParams()

    const isLoading:boolean[]=[]
    const errors:(string | null | undefined)[]=[]
    const prop:FormCompProp={ Title:"新增相簿", Theme:theme, LoadingList:isLoading, ErrorList:errors, }
    const LibTabsPropA:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Basic":"基本",
            "Status":"狀態",
            "Tags":"標籤",
        }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox colDisplayName="類別"></LibCheckBox>,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>,
            <LibCalendar colDisplayName="上架日期"></LibCalendar>
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"></LibCheckBox>
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"></LibCheckBox>
        ]
    }
    const LibTabsPropB:LibTabsProp={
        Style:theme.Tabs,
        item:{
            "Chinese":"繁體中文",
            "English":"English",
        }
    }
    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme);
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

const generateLangFields = ( lang: string, label: string, theme: IBETheme): React.ReactNode[] =>     
    {
    return [
    <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入"/>,
    <LibTinyMCE key={`${lang}-Content`} Style={theme.TinyMCE} ColumnDisplayName={`內容編輯器（${label}）`}/>
    ];
};

