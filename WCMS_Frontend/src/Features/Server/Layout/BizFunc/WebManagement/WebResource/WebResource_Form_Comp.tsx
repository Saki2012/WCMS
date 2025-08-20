import { LibCheckBox, LibTextBox, LibTextArea, LibFileInput, LibFile, LibTinyMCE, LibDropList, LibPicture } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import { DividerComp } from "../../../../../../SysCore/Components/Divider/Divider_Comp";
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import { useState } from "react";


/** 網路資源表單
 * @returns 
 */
export const WebResourceFormComp = ({ theme }: { theme: IBETheme }) => {
    const { uid } = useParams()

    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增網路資源", Theme: theme, LoadingList: isLoading, ErrorList: errors, }

    // state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    // 當 LibFile onChange 回傳 File[]
    const handleFileChange = (files: File[]) => {
        if (files && files.length > 0) {
            const file = files[0];   // 只取第一個
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl("");
        }
    };

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
            <LibCheckBox colDisplayName="類別"></LibCheckBox>,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>,
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"></LibCheckBox>
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"></LibCheckBox>
        ],
        Img: [
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false} parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12" onChange={handleFileChange}>
                <LibPicture
                    key="preview"
                    ColumnDisplayName={selectedFile?.name ?? ""}
                    PicSrc={previewUrl || "https://dummyimage.com/1920x550/555/fff.png"}
                    PicDescription={`選中的圖片 ${selectedFile?.name ?? ""}`}
                />
            </LibFile>,
            <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`圖片說明`} DefaultInputDisplay="請輸入" />,
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



