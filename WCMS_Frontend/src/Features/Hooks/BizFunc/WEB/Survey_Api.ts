import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SurveySet = components["schemas"]["SurveySet_DTO"];
// #endregion

// #region Public
export class SurveyService extends ApiDataService<SurveySet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Survey, apiInstance);
    }
    // #endregion
}
export class SurveyAdapterImpl extends ApiDataAdapter<SurveySet, SurveyService>
{}
export const SurveyAdapter = (apiInstance?: AxiosInstance) => new SurveyAdapterImpl((api?: AxiosInstance) => new SurveyService(api ?? apiInstance));
// #endregion
