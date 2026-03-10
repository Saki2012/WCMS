import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
class AnnouncementService extends ApiDataService<AnnouncementSet>
{
    constructor(apiInstance?: AxiosInstance) { super(PGID.Announcement, apiInstance); }
}
export const AnnouncementAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<AnnouncementSet, AnnouncementService>((api?: AxiosInstance) => new AnnouncementService(api ?? apiInstance));
