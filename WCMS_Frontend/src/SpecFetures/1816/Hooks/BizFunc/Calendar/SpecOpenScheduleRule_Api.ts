import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];

class SpecOpenScheduleRuleService extends ApiDataService<SpecOpenScheduleRuleSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecOpenScheduleRule, apiInstance);
    }
}
export const SpecOpenScheduleRuleAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecOpenScheduleRuleSet, SpecOpenScheduleRuleService>(
        (api?: AxiosInstance) => new SpecOpenScheduleRuleService(api ?? apiInstance),
    );
