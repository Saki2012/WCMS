import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
// #endregion

// #region Public
class FileArchiveService extends ApiDataService<FileArchiveSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.FileArchive, apiInstance);
    }
    // #endregion
}
export class FileArchiveAdapterImpl extends ApiDataAdapter<FileArchiveSet, FileArchiveService>
{}
export const FileArchiveAdapter = (apiInstance?: AxiosInstance) =>
    new FileArchiveAdapterImpl((api?: AxiosInstance) => new FileArchiveService(api ?? apiInstance));
// #endregion
