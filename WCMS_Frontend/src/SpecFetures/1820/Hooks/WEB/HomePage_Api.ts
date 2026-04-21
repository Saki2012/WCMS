import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecHomePage1820Set = components["schemas"]["SpecHomePage1820Set_DTO"];
class SpecHomePage1820Service extends ApiDataService<SpecHomePage1820Set>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecHomePageApi, apiInstance);
    }
}
export const SpecHomePage1820Adapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecHomePage1820Set, SpecHomePage1820Service>((api?: AxiosInstance) =>
        new SpecHomePage1820Service(api ?? apiInstance)
    );
