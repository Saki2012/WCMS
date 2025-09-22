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

const useSpecResearchList = (lang: string, categoryIds: string, tagIds: string, showColumns: string[]) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.SpecResearchModelFields.CategoryId} = ${categoryIds}`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.SpecResearchModelFields.Tags} HasAllOf ${tagIds}`)
    condition = LibMerge(" And ", false, condition, `${SchemaFields.SpecResearchModelFields.ContentStatus} !& 4`)//不包含隱藏的資料
    type VisibleKey = [string, string];
    //調整前台欄位顯示順序(目前需手動調整)
    const ORDER: string[] = [
        SchemaFields.SpecResearchDetailModelFields.Year, SchemaFields.SpecResearchDetailModelFields.AcademicYear,
        SchemaFields.SpecResearchDetailModelFields.Semester, SchemaFields.SpecResearchDetailModelFields.CooperatingUnits,
        SchemaFields.SpecResearchDetailModelFields.Courses, SchemaFields.SpecResearchDetailModelFields.CooperationProject,
        SchemaFields.SpecResearchDetailModelFields.ClassTime, SchemaFields.SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
        SchemaFields.SpecResearchDetailModelFields.Department, SchemaFields.SpecResearchDetailModelFields.ProjectLeader,
        SchemaFields.SpecResearchDetailModelFields.College, SchemaFields.SpecResearchDetailModelFields.ProjectName,
        SchemaFields.SpecResearchDetailModelFields.ApprovalNumber, SchemaFields.SpecResearchDetailModelFields.ApprovedAmount,
        SchemaFields.SpecResearchDetailModelFields.DuringExecution, SchemaFields.SpecResearchDetailModelFields.ContractPeriod,
        SchemaFields.SpecResearchDetailModelFields.Name, SchemaFields.SpecResearchDetailModelFields.GraduationDegree,
        SchemaFields.SpecResearchDetailModelFields.PaperTitle, SchemaFields.SpecResearchDetailModelFields.Cohost1,
        SchemaFields.SpecResearchDetailModelFields.Cohost2, SchemaFields.SpecResearchDetailModelFields.Commissioned,
        SchemaFields.SpecResearchDetailModelFields.PlanAmount, SchemaFields.SpecResearchDetailModelFields.PlanContent,
        SchemaFields.SpecResearchDetailModelFields.Remark];
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
                SchemaFields.SpecResearchModelFields.InternalId,
                SchemaFields.SpecResearchModelFields.ResearchId,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Year}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.AcademicYear}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Semester}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ClassTime}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ProjectLeader}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.College}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Department}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ProjectName}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.TeachingStaffOfOurSchool}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ApprovalNumber}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ApprovedAmount}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.DuringExecution}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ContractPeriod}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Name}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.GraduationDegree}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.PaperTitle}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.CooperatingUnits}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.CooperationProject}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Courses}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Cohost1}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Cohost2}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Commissioned}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.PlanAmount}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.PlanContent}`,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Remark}`,
            ],
            Condition: condition,
            OrderBy: [
                { Col: `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Year}`, Desc: true },
                { Col: `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.AcademicYear}`, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (showColumns.includes(col.key)) {
                    const detail = item.SpecResearchDetail?.find(p => p.Lang === lang);
                    if (col.key === SchemaFields.SpecResearchDetailModelFields.ApprovedAmount ||
                        col.key === SchemaFields.SpecResearchDetailModelFields.PlanAmount) {
                        let val = detail ? (detail as Record<string, any>)[col.key] ?? "" : "";
                        content = new Intl.NumberFormat("zh-TW", { style: "decimal", }).format(val)
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
            <Grid gridData={useSpecResearch.gridProps} style={props.Theme.GridView} pageStyle={props.Theme.Paginator}></Grid>
        </LoadingErrorHandler>
    )
};

