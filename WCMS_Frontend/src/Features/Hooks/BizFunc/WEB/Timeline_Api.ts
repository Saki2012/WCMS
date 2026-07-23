import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type TimelineFormModel = components["schemas"]["Timeline"];
// #endregion

// #region Public
class TimelineService extends ApiDataService<TimelineFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Timeline, apiInstance);
    }
    // #endregion
}
export class TimelineAdapterImpl extends ApiDataAdapter<TimelineFormModel, TimelineService>
{}
export const TimelineAdapter = (apiInstance?: AxiosInstance) => new TimelineAdapterImpl((api?: AxiosInstance) => new TimelineService(api ?? apiInstance));
// #endregion
