import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle } from "@/SysCore/Components/FormField/LibFormField"
import type { ILibCheckItemSingleProp, LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useState } from 'react';
import * as React from "react";
import * as SchemaFields from "@/types/SchemaFields";
import { useGetCategoryListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_Hook";
import { useGetTagListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFormToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
type GallerySet = components["schemas"]["GallerySet_DTO"]
const emptyData: GallerySet = {
    Gallery: { GalleryId: "", Categories: "", Tags: "" },
    GalleryInfo: [],
    GalleryPhotos: [],
    GalleryPhotosInfo: [],
}
/** 相簿表單
 * @returns 
 */
export const Server_GalleryFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const formData = useFetchFormData<GallerySet>(GalleryProvider(), internalId, emptyData)
    const useCategory = useGetCategoryListByProgId(SchemaFields.GallerySetFields.Gallery, prop.lang);
    const useTag = useGetTagListByProgId(SchemaFields.GallerySetFields.Gallery, prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    useEnsureLangDetails(formData, { headerName: SchemaFields.GallerySetFields.Gallery, detailName: SchemaFields.GallerySetFields.GalleryInfo, parentKeys: [SchemaFields.GalleryInfoFields.GalleryId] });

    const useToolbar = useFormToolbarActions(GalleryProvider(), formData.data, internalId ?? "", () => formData.refetch())

    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增相簿", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Album": "相簿", "Photo": "相片" } }
    const components: Record<string, React.ReactNode[]> = {
        Album: [<AlbumComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={useContentStatus.data} tagOpts={useTag.data} />,
        <AlbumInfo theme={prop.theme} formData={formData} />],
        Photo: [<UploadPicComp theme={prop.theme} />, <PhotoComp theme={prop.theme} />]
    }

    return (
        <FormComp prop={formProp}>
            <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>
        </FormComp>
    )
}

const AlbumComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤" } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Categories, 'string', undefined, 'csv')} />,
        <LibCalendar {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Validate_Start, 'string')} ></LibCalendar>],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Tags, 'string', undefined, 'csv')} />,]
    }
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>)
}
const AlbumInfo = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const rawDetails = prop.formData.data?.GalleryInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.GalleryInfoFields.GalleryId]: info.GalleryId, [SchemaFields.GalleryInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title, "string", rowKeys)} />,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Content, "string", rowKeys)} />
            ]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}
const UploadPicComp = (prop: { theme: IBETheme; }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    // 當 LibFile 選擇檔案時的回呼
    const handleFileChange = (files: File[]) => { setSelectedFiles(files); };
    return (
        <LibModal ModalName="上傳圖片" BtnName1="關閉" BtnName2="儲存並上傳">
            <div className="row mx-0">
                {/* 選擇欲上傳的圖片(多選) */}
                <div className="col-12">
                    <div className="row">
                        <LibFile Style={prop.theme.File} ColumnDisplayName={`選擇圖片(多選)`} Multiple={true} onChange={(files) => handleFileChange(files)}>
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
        </LibModal>
    )
}

const PhotoComp = (prop: { theme: IBETheme; }) => {

    // JSX 中使用
    const c: ILibCheckItemSingleProp[] = [{ itemId: "1", itemDisplayName: "選擇封面" }];
    const str: string[] = ["value"];

    <LibPicture key={"idx"} parentClass="col-xl-3 col-md-4 col-12" ColumnDisplayName="測試" PicSrc="https://images.pexels.com/photos/32734920/pexels-photo-32734920.jpeg" PicDescription="文字">
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
        <PhotoInfo theme={prop.theme} />

    </LibPicture>
    return (<></>)
}

const PhotoInfo = (prop: { theme: IBETheme; }) => {
    return (<>
        <LibTextBox Style={prop.theme.TextBox2} ColumnDisplayName={"排序編號"} DefaultInputDisplay={"請輸入"} />
        <LibTextBox Style={prop.theme.TextBox2} ColumnDisplayName={"繁體中文"} DefaultInputDisplay={"請輸入"} />
        <LibTextBox Style={prop.theme.TextBox2} ColumnDisplayName={"English"} DefaultInputDisplay={"請輸入"} />
    </>)
}



