import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type AnnouncementFormModel = components["schemas"]["Announcement"];
// #endregion

// #region Public
class AnnouncementService extends ApiDataService<AnnouncementFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Announcement, apiInstance);
    }
    // #endregion
}
export class AnnouncementAdapterImpl extends ApiDataAdapter<AnnouncementFormModel, AnnouncementService>
{}
export const AnnouncementAdapter = (apiInstance?: AxiosInstance) =>
    new AnnouncementAdapterImpl((api?: AxiosInstance) => new AnnouncementService(api ?? apiInstance));
// #endregion
