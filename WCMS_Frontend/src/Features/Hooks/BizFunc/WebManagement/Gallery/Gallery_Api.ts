import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type GallerySet = components["schemas"]["GallerySet_DTO"];
class GalleryService extends ApiDataService<GallerySet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Gallery, apiInstance);
    }
}
export const GalleryAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<GallerySet, GalleryService>(
        (api?: AxiosInstance) => new GalleryService(api ?? apiInstance),
    );
