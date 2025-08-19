import { LibCheckBox, LibTextBox, LibTextArea, LibFileInput, LibFile, LibTinyMCE, LibDropList } from "../../../../../SysCore/Components/FormField/LibFormField";

import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "../../../../../Features/Server/Layout/Theme/ITheme";
import { FormComp } from "../../../../../Features/Server/Layout/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../../../Features/Server/Layout/Scaffold/Content/Content_Data";


/** 網路資源表單
 * @returns 
 */
export const USRProjFormComp = ({ theme }: { theme: IBETheme }) => {
    const { uid } = useParams()

    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增研究計畫", Theme: theme, LoadingList: isLoading, ErrorList: errors, }
    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Basic": "基本",
            "Status": "狀態",
            "Tags": "標籤",
            "Img": "圖片",
        }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibDropList Style={theme.DropList} ColumnDisplayName="類別" />,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>,
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"></LibCheckBox>
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"></LibCheckBox>
        ],
        Img: [
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}></LibFile>,
            <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`圖片說明`} DefaultInputDisplay="請輸入" />
        ]
    }
    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Chinese": "繁體中文",
            "English": "English",
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

const generateLangFields = (lang: string, label: string, theme: IBETheme): React.ReactNode[] => {
    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-Content`} Style={theme.TextArea} ColumnDisplayName={`內容（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Url`} Style={theme.TextBox} ColumnDisplayName={`網址（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibDropList key={`${lang}-Target`} Style={theme.DropList} ColumnDisplayName={`開啟方式（${label}）`} />
    ];
};



