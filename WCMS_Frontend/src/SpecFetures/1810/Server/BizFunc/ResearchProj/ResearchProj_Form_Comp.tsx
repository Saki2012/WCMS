import { LibCheckBox, LibTextBox, LibTextArea, LibDropList } from "../../../../../SysCore/Components/FormField/LibFormField";
import type { LibTabsProp } from "../../../../../SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "../../../../../Features/Server/Layout/Theme/ITheme";
import { FormComp } from "../../../../../Features/Server/Layout/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "../../../../../SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "../../../../../Features/Server/Layout/Scaffold/Content/Content_Data";


/** 網路資源表單
 * @returns 
 */
export const ResearchProjFormComp = ({ theme }: { theme: IBETheme }) => {
    const { uid } = useParams()

    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "新增研究計畫", Theme: theme, LoadingList: isLoading, ErrorList: errors, }
    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Basic": "基本",
            "Status": "狀態",
            "Tags": "標籤"
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
        <LibTextBox key={`${lang}-Year`} Style={theme.TextBox} ColumnDisplayName={`年度（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-AcademicYear`} Style={theme.TextBox} ColumnDisplayName={`學年度（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Semester`} Style={theme.TextBox} ColumnDisplayName={`學期（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ClassTime`} Style={theme.TextBox} ColumnDisplayName={`上課時間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Courses`} Style={theme.TextBox} ColumnDisplayName={`課程/社團（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-TeachingStaffOfOurSchool`} Style={theme.TextBox} ColumnDisplayName={`本校教學人員（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ProjectLeader`} Style={theme.TextBox} ColumnDisplayName={`計畫主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-PlanAmount`} Style={theme.TextBox} ColumnDisplayName={`計畫金額（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ProjectName`} Style={theme.TextBox} ColumnDisplayName={`計畫名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-PlanContent`} Style={theme.TextArea} ColumnDisplayName={`計畫內容簡介（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Commissioned`} Style={theme.TextBox} ColumnDisplayName={`委辦/補助單位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Cohost1`} Style={theme.TextBox} ColumnDisplayName={`共同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Cohost2`} Style={theme.TextBox} ColumnDisplayName={`協同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ApprovalNumber`} Style={theme.TextBox} ColumnDisplayName={`核定編號（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ApprovedAmount`} Style={theme.TextBox} ColumnDisplayName={`核定金額（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-DuringExecution`} Style={theme.TextBox} ColumnDisplayName={`執行期間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ContractPeriod`} Style={theme.TextBox} ColumnDisplayName={`合約期間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-College`} Style={theme.TextBox} ColumnDisplayName={`學院（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Department`} Style={theme.TextBox} ColumnDisplayName={`系所（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Name`} Style={theme.TextBox} ColumnDisplayName={`姓名（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-GraduationDegree`} Style={theme.TextBox} ColumnDisplayName={`畢業學位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-PaperTitle`} Style={theme.TextBox} ColumnDisplayName={`論文名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-CooperationProject`} Style={theme.TextBox} ColumnDisplayName={`合作項目（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-CooperatingUnits`} Style={theme.TextBox} ColumnDisplayName={`合作單位/學校 （${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-Remark`} Style={theme.TextArea} ColumnDisplayName={`備註（${label}）`} DefaultInputDisplay="請輸入" />,
    ];
};



