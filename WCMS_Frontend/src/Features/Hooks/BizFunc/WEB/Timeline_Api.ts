import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
// #endregion

// #region Public
class TimelineService extends ApiDataService<TimelineSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Timeline, apiInstance);
    }
    // #endregion
}
export class TimelineAdapterImpl extends ApiDataAdapter<TimelineSet, TimelineService>
{}
export const TimelineAdapter = (apiInstance?: AxiosInstance) => new TimelineAdapterImpl((api?: AxiosInstance) => new TimelineService(api ?? apiInstance));
// #endregion
