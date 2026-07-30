import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecOpenScheduleRuleFormModel = components["schemas"]["SpecOpenScheduleRule"];
// #endregion

// #region Public
/** 提供學年度開館規則的標準 FormModel API 存取。 */
class SpecOpenScheduleRuleService extends ApiDataService<SpecOpenScheduleRuleFormModel>
{
    // #region Public
    /** 建立學年度開館規則 API Service。 */
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecOpenScheduleRule, apiInstance);
    }
    // #endregion
}

/** 提供學年度開館規則的 FormModel Adapter。 */
class SpecOpenScheduleRuleAdapterImpl extends ApiDataAdapter<SpecOpenScheduleRuleFormModel, SpecOpenScheduleRuleService>
{}

/** 建立學年度開館規則 FormModel Adapter。 */
export const SpecOpenScheduleRuleAdapter = (apiInstance?: AxiosInstance) =>
    new SpecOpenScheduleRuleAdapterImpl((api?: AxiosInstance) => new SpecOpenScheduleRuleService(api ?? apiInstance));
// #endregion
