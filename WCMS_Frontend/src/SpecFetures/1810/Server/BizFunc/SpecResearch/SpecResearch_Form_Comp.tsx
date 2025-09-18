import { LibCheckBox, LibTextBox, LibTextArea, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";


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
            <LibCheckBox ColumnDisplayName="狀態"></LibCheckBox>
        ],
        Tags: [
            <LibCheckBox ColumnDisplayName="標籤"></LibCheckBox>
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
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Semester`} Style={theme.TextBox2} ColumnDisplayName={`學期（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ClassTime`} Style={theme.TextBox2} ColumnDisplayName={`上課時間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Courses`} Style={theme.TextBox2} ColumnDisplayName={`課程/社團（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-TeachingStaffOfOurSchool`} Style={theme.TextBox2} ColumnDisplayName={`本校教學人員（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ProjectLeader`} Style={theme.TextBox2} ColumnDisplayName={`計畫主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-PlanAmount`} Style={theme.TextBox2} ColumnDisplayName={`計畫金額（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-ProjectName`} Style={theme.TextBox} ColumnDisplayName={`計畫名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-PlanContent`} Style={theme.TextArea} ColumnDisplayName={`計畫內容簡介（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-Commissioned`} Style={theme.TextBox} ColumnDisplayName={`委辦/補助單位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Cohost1`} Style={theme.TextBox2} ColumnDisplayName={`共同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Cohost2`} Style={theme.TextBox2} ColumnDisplayName={`協同主持人（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ApprovalNumber`} Style={theme.TextBox2} ColumnDisplayName={`核定編號（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ApprovedAmount`} Style={theme.TextBox2} ColumnDisplayName={`核定金額（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-DuringExecution`} Style={theme.TextBox2} ColumnDisplayName={`執行期間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-ContractPeriod`} Style={theme.TextBox2} ColumnDisplayName={`合約期間（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-College`} Style={theme.TextBox2} ColumnDisplayName={`學院（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Department`} Style={theme.TextBox2} ColumnDisplayName={`系所（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-Name`} Style={theme.TextBox2} ColumnDisplayName={`姓名（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox parentClass="col-md-6 col-12" key={`${lang}-GraduationDegree`} Style={theme.TextBox2} ColumnDisplayName={`畢業學位（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-PaperTitle`} Style={theme.TextBox} ColumnDisplayName={`論文名稱（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-CooperationProject`} Style={theme.TextBox} ColumnDisplayName={`合作項目（${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextBox key={`${lang}-CooperatingUnits`} Style={theme.TextBox} ColumnDisplayName={`合作單位/學校 （${label}）`} DefaultInputDisplay="請輸入" />,
        <LibTextArea key={`${lang}-Remark`} Style={theme.TextArea} ColumnDisplayName={`備註（${label}）`} DefaultInputDisplay="請輸入" />,
    ];
};



