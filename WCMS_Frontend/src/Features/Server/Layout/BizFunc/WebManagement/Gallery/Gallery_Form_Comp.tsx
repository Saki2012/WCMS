import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { ILibCheckItemSingleProp, LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import { useId } from 'react';

import * as React from "react";


/** 相簿表單
 * @returns 
 */
export const GalleryFormComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const { uid } = useParams();

    // const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增相簿", Theme: theme, LoadingList: isLoading, ErrorList: errors, }


    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Basic": "基本",
            "Status": "狀態",
            "Tags": "標籤",
        }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox colDisplayName="類別"></LibCheckBox>,
            <LibCalendar colDisplayName="上架日期"></LibCalendar>,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"></LibCheckBox>
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"></LibCheckBox>
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

    const LibTabsPropW: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Album": "相簿",
            "Photo": "相片",
        }
    }

    // JSX 中使用
    const c: ILibCheckItemSingleProp[] = [{ itemId: "1", itemDisplayName: "選擇封面" }]
    const str: string[] = ["value"]
    const componentsW: Record<string, React.ReactNode[]> = {
        Album: [
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>,
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        ],
        Photo: [
            <LibModal prop={{ ModalName: "上傳圖片", BtnName1: "關閉", BtnName2: "儲存並上傳" }}>
                <div className="row">
                    {/* 選擇上傳的圖片(多選) */}
                    <div className="col-12">
                        <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片(多選)`} Multiple={true}></LibFile>
                    </div>
                    {/* 預覽剛剛上傳的圖片 */}
                    <div className="col-12">
                        <div className="mt-4">
                            {/* 標頭 */}
                            <div className="col-12 float-md-left float-sm-none col-form-label bg-secondary mb-1">
                                {`預覽上傳圖片`}
                            </div>
                            {/* 圖片 */}
                            <div className="col-12">
                                {/* 需代入選擇上傳的圖片 */}
                                <LibPicturePreview ColumnDisplayName={`圖片名稱`} PicSrc={`https://picsum.photos/seed/picsum/200/200`} PicDescription={`圖片描述`} />
                            </div>
                        </div>
                    </div>
                </div>
            </LibModal>,

            <LibPicture
                key={"idx"}
                prop={{
                    ColumnDisplayName: "測試",
                    PicSrc: "https://picsum.photos/seed/picsum/500/500",
                    PicDescription: "文字"
                }}
            >
                <div className="row">
                    <div className="col-6">
                        <LibCheckBoxSingle value={str} options={c} checkboxStyle="radio" />
                    </div>
                    <div className="col-6">
                        <LibCheckBoxSingle value={str} options={c} checkboxStyle="checkbox" />
                    </div>
                </div>
                <LibTextBox
                    Style={theme.TextBox2}
                    ColumnDisplayName={"繁體中文"}
                    DefaultInputDisplay={"請輸入"}
                />
                <LibTextBox
                    Style={theme.TextBox2}
                    ColumnDisplayName={"English"}
                    DefaultInputDisplay={"請輸入"}
                />
                <LibTextBox
                    Style={theme.TextBox2}
                    ColumnDisplayName={"排序編號"}
                    DefaultInputDisplay={"請輸入"}
                />
            </LibPicture>
        ],
    }

    return (
        <FormComp prop={prop}>
            <TabContentComp libTabsProp={LibTabsPropW} components={componentsW}></TabContentComp>
        </FormComp>
    )
}

const generateLangFields = (lang: string, label: string, theme: IBETheme): React.ReactNode[] => {
    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTinyMCE key={`${lang}-Content`} Style={theme.TinyMCE} ColumnDisplayName={`內容編輯器（${label}）`} />
    ];
};

