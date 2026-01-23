import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import * as SchemaFields from "@/types/SchemaFields"
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import SpecResearchProvider from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { useGetShowColumnItems } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import { SpecResearchDetailModelFields, SpecResearchModelFields } from "@/types/SchemaFields";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";

const useSpecResearchList = (lang: string, categoryIds: string, tagIds: string, showColumns: string[]) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.CategoryId} = ${categoryIds}`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.Tags} HasAllOf ${tagIds}`)
    condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.ContentStatus} !& 4`)//不包含隱藏的資料
    type VisibleKey = [string, string];
    //調整前台欄位顯示順序(目前需手動調整)
    const ORDER: string[] = [
        SpecResearchDetailModelFields.Year, SpecResearchDetailModelFields.AcademicYear,
        SpecResearchDetailModelFields.Semester, SpecResearchDetailModelFields.CooperatingUnits,
        SpecResearchDetailModelFields.Courses, SpecResearchDetailModelFields.CooperationProject,
        SpecResearchDetailModelFields.ClassTime, SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
        SpecResearchDetailModelFields.Department, SpecResearchDetailModelFields.Professor,
        SpecResearchDetailModelFields.ProjectLeader,
        SpecResearchDetailModelFields.College, SpecResearchDetailModelFields.ProjectName,
        SpecResearchDetailModelFields.ApprovalNumber, SpecResearchDetailModelFields.ApprovedAmount,
        SpecResearchDetailModelFields.DuringExecution, SpecResearchDetailModelFields.ContractPeriod,
        SpecResearchDetailModelFields.Name, SpecResearchDetailModelFields.GraduationDegree,
        SpecResearchDetailModelFields.PaperTitle, SpecResearchDetailModelFields.Cohost1,
        SpecResearchDetailModelFields.Cohost2, SpecResearchDetailModelFields.Commissioned,
        SpecResearchDetailModelFields.PlanAmount, SpecResearchDetailModelFields.PlanContent,
        SpecResearchDetailModelFields.Remark];
    const buildVisibleKeys = (cols?: string[]): VisibleKey[] => {
        const { SpecResearchSetFields, SpecResearchDetailModelFields } = SchemaFields;
        const seen = new Set<string>();
        const names = (cols ?? [])
            .map(raw => raw.split(".").pop()!.trim())
            .filter(n => !!n && !seen.has(n) && (ORDER.includes(n)))
            .map(n => (seen.add(n), n))
            .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
        const out: VisibleKey[] = [];
        for (const name of names) {
            const key = name as keyof typeof SpecResearchDetailModelFields;
            out.push([SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields[key]]);
        }
        return out;
    };

    const provider = SpecResearchProvider();
    return useFetchGridListData<SpecResearchSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: buildVisibleKeys(showColumns),
        buildQueryCondition: (page) => ({
            Fields: [
                SpecResearchModelFields.InternalId,
                SpecResearchModelFields.ResearchId,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Semester}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ClassTime}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectLeader}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.College}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Department}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.TeachingStaffOfOurSchool}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ApprovalNumber}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ApprovedAmount}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.DuringExecution}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ContractPeriod}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Name}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.GraduationDegree}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperatingUnits}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Cohost1}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Cohost2}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Commissioned}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PlanAmount}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PlanContent}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Remark}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Remark}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Professor}`,
            ],
            Condition: condition,
            RankGroups: [{ Condition: `${SpecResearchModelFields.ContentStatus} & 1` }],
            OrderBy: [
                { Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`, Desc: true },
                { Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`, Desc: true },
                { Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Semester}`, Desc: false },
            ],
            PageNumber: page,
            PageSize: 15,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (showColumns.includes(col.key)) {
                    const detail = item.SpecResearchDetail?.find(p => p.Lang === lang);
                    if (col.key === SpecResearchDetailModelFields.ApprovedAmount ||
                        col.key === SpecResearchDetailModelFields.PlanAmount) {
                        let val = detail ? (detail as Record<string, any>)[col.key] ?? "" : "";
                        content = new Intl.NumberFormat(lang, { style: "decimal", }).format(val)
                    }
                    else
                        content = detail ? (detail as Record<string, any>)[col.key] ?? "" : "";
                }
                else {
                    content = (item.SpecResearch as any)[col.key] ?? "";
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: !!showColumns?.length && !!categoryIds,
        deps: [lang, categoryIds, tagIds],
    });
};


export interface ISpecResearchListOptions { Category?: string; Tag?: string; }
interface ISpecResearchListProps { Theme: IFETheme; Lang: string | Lang; Options?: ISpecResearchListOptions; }

export const SpecResearchListComp = (props: ISpecResearchListProps) => {
    const useGetShowColumns = useGetShowColumnItems(props.Options?.Category ?? "");
    const showColumns = useGetShowColumns.rawData?.[0]?.SpecCategory?.ShowColumnItems?.split(',') as string[];
    const useSpecResearch = useSpecResearchList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "", showColumns);
    const isLoading = [useSpecResearch.isLoading];
    const errors = [useSpecResearch.error];
    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
            <OperationGuideHelp_Comp />
            <Grid gridData={useSpecResearch.gridProps} style={props.Theme.GridView} pageStyle={props.Theme.Paginator}></Grid>
        </LoadingErrorHandler>
    )
};

