/**公告清單 */
import type { components } from "../../../../types/api";
import type { IFETheme } from "../../../../Features/Client/Layout/Theme/ITheme";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
type SpecResearchDetailModelFields = components["schemas"]["SpecResearchDetailModel_DTO"];
import type { Lang } from "../../../../SysCore/i18n/lang";
import { Merge } from "../../../../SysCore/Utils/Library/LibMergeData";
import * as SchemaFields from "../../../../types/SchemaFields"
import { useFetchGridListData } from "../../../../SysCore/Utils/API/FetchGridListData";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "../../../../SysCore/Components/Grid/Grid_Data";
import SpecResearchProvider from "../../Server/BizFunc/SpecResearch/SpecResearch_Api";
import LoadingErrorHandler from "../../../../SysCore/Components/LoadingErrorHandler";
import { useGetShowColumnItems } from "../../Server/BizFunc/SpecCategory/SpecCategory_Hook";
import { Grid } from "../../../../SysCore/Components/Grid/Grid_Comp";
import React, { useMemo } from "react";


const useSpecResearchList = (lang: string, categoryIds: string, tagIds: string, showColumns: string[]) => {

    var condition: string = "";
    if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.SpecResearchModelFields.CategoryId} = ${categoryIds}`)
    if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.SpecResearchModelFields.Tags} HasAny (${tagIds})`)

    type VisibleKey = [string, string];
    const ORDER: string[] = [
        SchemaFields.SpecResearchDetailModelFields.Year, SchemaFields.SpecResearchDetailModelFields.AcademicYear,
        SchemaFields.SpecResearchDetailModelFields.Semester, SchemaFields.SpecResearchDetailModelFields.ClassTime,
        SchemaFields.SpecResearchDetailModelFields.ProjectLeader, SchemaFields.SpecResearchDetailModelFields.College,
        SchemaFields.SpecResearchDetailModelFields.Department, SchemaFields.SpecResearchDetailModelFields.ProjectName,
        SchemaFields.SpecResearchDetailModelFields.TeachingStaffOfOurSchool, SchemaFields.SpecResearchDetailModelFields.ApprovalNumber,
        SchemaFields.SpecResearchDetailModelFields.ApprovedAmount, SchemaFields.SpecResearchDetailModelFields.DuringExecution,
        SchemaFields.SpecResearchDetailModelFields.ContractPeriod, SchemaFields.SpecResearchDetailModelFields.Name,
        SchemaFields.SpecResearchDetailModelFields.GraduationDegree, SchemaFields.SpecResearchDetailModelFields.PaperTitle,
        SchemaFields.SpecResearchDetailModelFields.CooperatingUnits, SchemaFields.SpecResearchDetailModelFields.CooperationProject,
        SchemaFields.SpecResearchDetailModelFields.Courses, SchemaFields.SpecResearchDetailModelFields.Cohost1,
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
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (showColumns.includes(col.key)) {
                    const detail = item.SpecResearchDetail?.find(p => p.Lang === lang);
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
        deps: [],
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

