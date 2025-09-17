import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { ILibCheckItemSingleProp, LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import { useState } from 'react';
import * as React from "react";


/** 相簿表單
 * @returns 
 */
export const GalleryFormComp = ({ theme }: { theme: IBETheme }) => {
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
            <LibCalendar ColumnDisplayName="上架日期"></LibCalendar>,
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
    const c: ILibCheckItemSingleProp[] = [{ itemId: "1", itemDisplayName: "選擇封面" }];
    const str: string[] = ["value"];
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    // 當 LibFile 選擇檔案時的回呼
    const handleFileChange = (files: File[]) => {
        setSelectedFiles(files);
    };
    const componentsW: Record<string, React.ReactNode[]> = {
        Album: [
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>,
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        ],
        Photo: [
            <LibModal ModalName="上傳圖片" BtnName1="關閉" BtnName2="儲存並上傳">
                <div className="row mx-0">
                    {/* 選擇欲上傳的圖片(多選) */}
                    <div className="col-12">
                        <div className="row">
                            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片(多選)`} Multiple={true} onChange={(files) => handleFileChange(files)}>
                            </LibFile>
                        </div>
                    </div>
                    {/* 顯示「預覽圖片」標題 + 預覽圖片 */}
                    {selectedFiles.length > 0 && (
                        <div className="col-12">
                            <div className="row mt-3 mx-0">
                                <div className="col-12 float-md-left float-sm-none col-form-label bg-secondary mb-1">
                                    預覽圖片
                                </div>
                                {selectedFiles.map((file, index) => {
                                    const url = URL.createObjectURL(file); // 將 file 轉成可用的 URL
                                    return (
                                        <div className="col-12 border-bottom">
                                            <div className="d-flex align-items-center">
                                                {/* <div className="all-btn me-2">
                                                    <a id="trash" className="icon" href="#" OnClick={(e) => { e.preventDefault();}} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                                                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                                            <i className="far fa-trash-alt"></i>
                                                        </button>
                                                    </a>
                                                </div> */}
                                                <LibPicturePreview
                                                    key={index}
                                                    ColumnDisplayName={file.name}
                                                    PicSrc={url}
                                                    PicDescription={`選中的圖片 ${file.name}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </LibModal>,

            <LibPicture
                key={"idx"}
                parentClass="col-xl-3 col-md-4 col-12"
                ColumnDisplayName="測試"
                PicSrc="https://images.pexels.com/photos/32734920/pexels-photo-32734920.jpeg"
                PicDescription="文字"
            >
                <div className="row">
                    <div className="col-6">
                        <LibCheckBoxSingle value={str} options={c} checkboxStyle="radio" />
                    </div>
                    <div className="col-6 d-flex justify-content-end">
                        <div className="all-btn">
                            <a id="trash" className="icon" href="#" onClick={(e) => { e.preventDefault(); }} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                                <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                    <i className="far fa-trash-alt"></i>
                                </button>
                            </a>
                        </div>
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

