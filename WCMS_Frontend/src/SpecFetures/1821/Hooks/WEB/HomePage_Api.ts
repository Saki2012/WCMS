import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecHomePage1821FormModel = components["schemas"]["SpecHomePage1821"];
// #endregion

// #region Public
export class SpecHomePage1821Service extends ApiDataService<SpecHomePage1821FormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecHomePageApi, apiInstance);
    }
    // #endregion
}

export class SpecHomePage1821AdapterImpl extends ApiDataAdapter<
    SpecHomePage1821FormModel,
    SpecHomePage1821Service
>
{}

export const SpecHomePage1821Adapter = (apiInstance?: AxiosInstance) =>
{
    return new SpecHomePage1821AdapterImpl(
        (api?: AxiosInstance) => new SpecHomePage1821Service(api ?? apiInstance),
    );
};
// #endregion
