import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
class TimelineService extends ApiDataService<TimelineSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Timeline, apiInstance);
    }
}
export const TimelineAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<TimelineSet, TimelineService>((api?: AxiosInstance) => new TimelineService(api ?? apiInstance));
