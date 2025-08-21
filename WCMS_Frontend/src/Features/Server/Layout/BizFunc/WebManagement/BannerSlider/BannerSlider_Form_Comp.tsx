import { LibDropList, LibTextBox, LibFile, LibPicture, LibCalendar, LibTextArea } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import BannerSliderProvider from "./BannerSlider_Api";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { components } from "../../../../../../types/api";
type BannerSet = components["schemas"]["BannerSet"]
import { useEffect, useState } from "react";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import { useFetchFormData } from "../../../../../../SysCore/Utils/API/FetchFormData";

const emptyData: BannerSet = {
    Banner: {},
    BannerDetail: [],
    BannerDetailInfo: []
}

export const BannerSliderFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const useCategory = useGetCategoryListByProgId("Announcement", "zh-tw");
    const useTag = useGetTagListByProgId("Announcement", "zh-tw");
    const formData = useFetchFormData<BannerSet>(BannerSliderProvider(), internalId, emptyData)
    const useToolbar = useFormToolbarActions(BannerSliderProvider(), formData.data as BannerSet, internalId as string, () => formData.refetch())
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error]

    useEffect(() => { if (formData.data) { formData.setFormData(formData.data); } }, [formData.data]);

    const prop: FormCompProp = { Title: "設定輪播", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }

    const data = [
        <LibTextBox key={`${1}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅名稱`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />,
        <LibTextBox key={`${2}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換速度`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />,
        <LibTextBox key={`${3}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅寬度 ( W ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />,
        <LibTextBox key={`${4}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換間隔`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />,
        <LibTextBox key={`${6}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅高度 ( H ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />,
        <LibDropList key={`${5}-Title`} Style={theme.DropList} ColumnDisplayName={`橫幅效果`} InputValue={formData.data?.Banner?.BannerId ?? ""} onChange={(val) => (val)} />
    ]

    const toComponents = (arr?: React.ReactNode[] | null): Record<string, React.ReactNode[]> => {
        if (!arr) return {}; // 防止 null / undefined

        return arr.reduce((acc, value, index) => {
            acc[index.toString()] = [value]; // key 用 index
            return acc;
        },
            {} as Record<string, React.ReactNode[]>);
    };

    const components = toComponents(data);

    // --------------------------------------------------

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
            "Img": "圖片"
        }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCalendar colDisplayName="新增日期"></LibCalendar>,
            <LibCalendar colDisplayName="公告日期"></LibCalendar>,
            <LibCalendar colDisplayName="下架日期"></LibCalendar>,
            <LibDropList key={`${5}-Title`} Style={theme.DropList} ColumnDisplayName={`字體顏色`} InputValue={formData.data?.Banner?.BannerId ?? ""} onChange={(val) => (val)}></LibDropList>,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>
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
            <div>最佳尺寸：1920px X 550px</div>
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
            acc[lang] = generateLangFields(lang, label, theme, formData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );

    return (
        <>
            <FormComp prop={prop}>
                {Object.entries(components).map(([lang, nodes]) => (
                    <div key={lang} className="form-group">
                        <div className="row">
                            {nodes}
                        </div>
                    </div>
                ))}
            </FormComp>
            <FormComp prop={prop}>
                <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
                <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
            </FormComp>
        </>
    )
}


const generateLangFields = (lang: string, label: string, theme: IBETheme, formData: any): React.ReactNode[] => {
    // 先放標題
    const fields: React.ReactNode[] = [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-Content`} Style={theme.TextArea} ColumnDisplayName={`內容（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Url`} Style={theme.TextBox} ColumnDisplayName={`網址（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibDropList key={`${5}-Title`} Style={theme.DropList} ColumnDisplayName={`開啟方式`} InputValue={formData.data?.Banner?.BannerId ?? ""} onChange={(val) => (val)}></LibDropList>,
    ];

    return fields;
};