import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];
// #endregion

// #region Public
class GalleryService extends ApiDataService<GallerySet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Gallery, apiInstance);
    }
    // #endregion
}
export class GalleryAdapterImpl extends ApiDataAdapter<GallerySet, GalleryService>
{}
export const GalleryAdapter = (apiInstance?: AxiosInstance) => new GalleryAdapterImpl((api?: AxiosInstance) => new GalleryService(api ?? apiInstance));
// #endregion
