import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
// #endregion

// #region Public
class AnnouncementService extends ApiDataService<AnnouncementSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Announcement, apiInstance);
    }
    // #endregion
}
export class AnnouncementAdapterImpl extends ApiDataAdapter<AnnouncementSet, AnnouncementService>
{}
export const AnnouncementAdapter = (apiInstance?: AxiosInstance) =>
    new AnnouncementAdapterImpl((api?: AxiosInstance) => new AnnouncementService(api ?? apiInstance));
// #endregion
