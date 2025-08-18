import { LibCheckBox, LibTextBox, LibFileInput, LibFile, LibTinyMCE } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp, LibTextBoxProp, LibTinyMCEProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import { DividerComp } from "../../../../../../SysCore/Components/Divider/Divider_Comp";
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";


/** 網路資源表單
 * @returns 
 */
export const WebResourceFormComp = ({ theme }: { theme: IBETheme }) => {
    const { uid } = useParams()

    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增網路資源", Theme: theme, LoadingList: isLoading, ErrorList: errors, }
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
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}></LibFile>,
            <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`圖片說明`} DefaultInputDisplay="請輸入" />
        ]
    }
    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Basic": "基本",
            "Status": "狀態",
            "Tags": "標籤",
            "Img": "圖片",
        }
    }
    const componentsB: Record<string, React.ReactNode[]> = {
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
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}></LibFile>,
            <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`圖片說明`} DefaultInputDisplay="請輸入" />
        ]
    }


    return (
        <FormComp prop={prop}>
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        </FormComp>
    )
}

const generateLangFields = (lang: string, label: string, theme: IBETheme): React.ReactNode[] => {
    // 先放標題
    const fields: React.ReactNode[] = [
        <LibTextBox
            key={`${lang}-Title`}
            Style={theme.TextBox}
            ColumnDisplayName={`標題（${label}）`}
            DefaultInputDisplay="請輸入"
        />
    ];

    // 再重複 10 次檔案名稱 + 上傳檔案
    Array.from({ length: 10 }, (_, index) => {
        const num = index + 1;
        fields.push(
            <hr
                key={`hr-${num}`}
                style={{ border: "1px solid #ccc", margin: "10px 0" }}
            />,
            <LibFileInput
                key={`${lang}-Content-${num}`}
                Style={theme.FileInput}
                ColumnDisplayName={`上傳檔案 - ${num} 名稱`}
                DefaultInputDisplay="請輸入"
            />,
        );
    });

    return fields;
};



