import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];
// #endregion

// #region Public
class SpecOpenScheduleRuleService extends ApiDataService<SpecOpenScheduleRuleSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecOpenScheduleRule, apiInstance);
    }
    // #endregion
}


class SpecOpenScheduleRuleAdapterImpl extends ApiDataAdapter<SpecOpenScheduleRuleSet, SpecOpenScheduleRuleService>
{
}


export const SpecOpenScheduleRuleAdapter = (apiInstance?: AxiosInstance) =>
    new SpecOpenScheduleRuleAdapterImpl((api?: AxiosInstance) => new SpecOpenScheduleRuleService(api ?? apiInstance));
// #endregion
