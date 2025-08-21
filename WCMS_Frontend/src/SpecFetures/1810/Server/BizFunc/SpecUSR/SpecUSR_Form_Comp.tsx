import { LibCheckBox, LibTextBox, LibTextArea, LibFileInput, LibFile, LibTinyMCE, LibDropList,LibPicture } from "../../../../../SysCore/Components/FormField/LibFormField";

import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "../../../../../Features/Server/Layout/Theme/ITheme";
import { FormComp } from "../../../../../Features/Server/Layout/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../../../Features/Server/Layout/Scaffold/Content/Content_Data";
import { useState } from "react";


/** 網路資源表單
 * @returns 
 */
export const USRProjFormComp = ({ theme }: { theme: IBETheme }) => {
    const { uid } = useParams()

    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增USR計畫", Theme: theme, LoadingList: isLoading, ErrorList: errors, }

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
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false} parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12" onChange={handleFileChange}>
                <LibPicture
                    key="preview"
                    ColumnDisplayName={selectedFile?.name ?? ""}
                    PicSrc={previewUrl || "https://dummyimage.com/800x550/555/fff.png"}
                    PicDescription={`選中的圖片 ${selectedFile?.name ?? ""}`}
                />
            </LibFile>,
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
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Year`} Style={theme.TextBox2} ColumnDisplayName={`年度（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-AcademicYear`} Style={theme.TextBox2} ColumnDisplayName={`學年度（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Courses`} Style={theme.TextBox} ColumnDisplayName={`活動/課程名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-PracticeField`} Style={theme.TextBox} ColumnDisplayName={`實踐場域（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ProjectName`} Style={theme.TextBox} ColumnDisplayName={`計畫名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ExternalCooperationUnit`} Style={theme.TextBox2} ColumnDisplayName={`外部合作單位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-CooperationDepartment`} Style={theme.TextBox2} ColumnDisplayName={`本校合作系所/單位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-DuringExecution`} Style={theme.TextBox2} ColumnDisplayName={`執行期間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-PlanAmount`} Style={theme.TextBox2} ColumnDisplayName={`計畫金額（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-ExecutionStrategy`} Style={theme.TextArea} ColumnDisplayName={`執行策略（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-PlanContent`} Style={theme.TextArea} ColumnDisplayName={`計畫內容簡介（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-ProjectConcept`} Style={theme.TextArea} ColumnDisplayName={`計畫理念（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-ProjectHighlights`} Style={theme.TextArea} ColumnDisplayName={`計畫亮點（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ProjectLeader`} Style={theme.TextBox} ColumnDisplayName={`計畫主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Cohost1`} Style={theme.TextBox2} ColumnDisplayName={`共同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Cohost2`} Style={theme.TextBox2} ColumnDisplayName={`協同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Commissioned`} Style={theme.TextBox} ColumnDisplayName={`委辦/補助單位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-Remark`} Style={theme.TextArea} ColumnDisplayName={`備註（${label}）`} DefaultInputDisplay="請輸入" />,
    ];
};



