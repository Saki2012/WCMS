import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type GalleryFormModel = components["schemas"]["Gallery"];
// #endregion

// #region Public
class GalleryService extends ApiDataService<GalleryFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Gallery, apiInstance);
    }
    // #endregion
}
export class GalleryAdapterImpl extends ApiDataAdapter<GalleryFormModel, GalleryService>
{}
export const GalleryAdapter = (apiInstance?: AxiosInstance) => new GalleryAdapterImpl((api?: AxiosInstance) => new GalleryService(api ?? apiInstance));
// #endregion
