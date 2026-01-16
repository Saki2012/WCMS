// ✅ 自動產生，請勿手動修改

export const AccountModelFields = {
    CreateTime: "CreateTime",
    CreateUser: "CreateUser",
    CreateUserId: "CreateUserId",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUser: "InvalidUser",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    IsIniData: "IsIniData",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    AccountId: "AccountId",
    AccountName: "AccountName",
    Person: "Person",
    PersonId: "PersonId",
    Role: "Role",
    RoleId: "RoleId",
    PasswordHash: "PasswordHash",
    PasswordSalt: "PasswordSalt",
    PasswordAlgoVer: "PasswordAlgoVer",
    AccountStatus: "AccountStatus",
    PasswordChangeDate: "PasswordChangeDate",
} as const;

export type AccountModelFieldKey = keyof typeof AccountModelFields;

export const AccountSetFields = {
    Account: "Account",
} as const;

export type AccountSetFieldKey = keyof typeof AccountSetFields;

export const AccountSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type AccountSet_DTOApiRequestFieldKey = keyof typeof AccountSet_DTOApiRequestFields;

export const AccountStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type AccountStatusFieldKey = keyof typeof AccountStatusFields;

export const AccountFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    AccountId: "AccountId",
    AccountName: "AccountName",
    Person: "Person",
    PersonId: "PersonId",
    Role: "Role",
    RoleId: "RoleId",
    Password: "Password",
    AccountStatus: "AccountStatus",
    PasswordChangeDate: "PasswordChangeDate",
} as const;

export type AccountFieldKey = keyof typeof AccountFields;

export const AnnouncementDetailFileFields = {
    AnnouncementId: "AnnouncementId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    FileId: "FileId",
    FileName: "FileName",
} as const;

export type AnnouncementDetailFileFieldKey = keyof typeof AnnouncementDetailFileFields;

export const AnnouncementDetailFields = {
    AnnouncementId: "AnnouncementId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    SubTitle: "SubTitle",
    Content: "Content",
    Url: "Url",
    UrlDescription: "UrlDescription",
} as const;

export type AnnouncementDetailFieldKey = keyof typeof AnnouncementDetailFields;

export const AnnouncementSetFields = {
    Announcement: "Announcement",
    AnnouncementDetail: "AnnouncementDetail",
    AnnouncementDetailFile: "AnnouncementDetailFile",
} as const;

export type AnnouncementSetFieldKey = keyof typeof AnnouncementSetFields;

export const AnnouncementSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type AnnouncementSet_DTOApiRequestFieldKey = keyof typeof AnnouncementSet_DTOApiRequestFields;

export const AnnouncementFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    AnnouncementId: "AnnouncementId",
    Categories: "Categories",
    Tags: "Tags",
    ContentStatus: "ContentStatus",
    PictureId: "PictureId",
    PicDescription: "PicDescription",
    ViewCount: "ViewCount",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    _AnnouncementDetail: "_AnnouncementDetail",
} as const;

export type AnnouncementFieldKey = keyof typeof AnnouncementFields;

export const BannerDetailInfoFields = {
    BannerId: "BannerId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    Content: "Content",
    URL: "URL",
    URL_Open: "URL_Open",
    _BannerDetail: "_BannerDetail",
    SpecLatestShows: "SpecLatestShows",
    SpecShowLocation: "SpecShowLocation",
    SpecShowDate: "SpecShowDate",
} as const;

export type BannerDetailInfoFieldKey = keyof typeof BannerDetailInfoFields;

export const BannerDetailFields = {
    BannerId: "BannerId",
    RowId: "RowId",
    PicSrcId: "PicSrcId",
    FontColor: "FontColor",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    Sort: "Sort",
    _Banner: "_Banner",
    _BannerDetailInfo: "_BannerDetailInfo",
} as const;

export type BannerDetailFieldKey = keyof typeof BannerDetailFields;

export const BannerSetFields = {
    Banner: "Banner",
    BannerDetail: "BannerDetail",
    BannerDetailInfo: "BannerDetailInfo",
} as const;

export type BannerSetFieldKey = keyof typeof BannerSetFields;

export const BannerSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type BannerSet_DTOApiRequestFieldKey = keyof typeof BannerSet_DTOApiRequestFields;

export const BannerFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    BannerId: "BannerId",
    BannerCategoryName: "BannerCategoryName",
    Interval: "Interval",
    Speed: "Speed",
    Height: "Height",
    Width: "Width",
    _BannerDetail: "_BannerDetail",
} as const;

export type BannerFieldKey = keyof typeof BannerFields;

export const CalendarDetailFields = {
    Year: "Year",
    Date: "Date",
    DayOfWeek: "DayOfWeek",
    IsHoliday: "IsHoliday",
    HolidayName: "HolidayName",
    Description: "Description",
    IsEdit: "IsEdit",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    _Calendar: "_Calendar",
    Spec_AcademicYear: "Spec_AcademicYear",
    Spec_AcademicYearId: "Spec_AcademicYearId",
    Spec_OpenTime: "Spec_OpenTime",
    Spec_CloseTime: "Spec_CloseTime",
    Spec_ModifyMemo: "Spec_ModifyMemo",
} as const;

export type CalendarDetailFieldKey = keyof typeof CalendarDetailFields;

export const CalendarSetFields = {
    Calendar: "Calendar",
    CalendarDetail: "CalendarDetail",
} as const;

export type CalendarSetFieldKey = keyof typeof CalendarSetFields;

export const CalendarSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type CalendarSet_DTOApiRequestFieldKey = keyof typeof CalendarSet_DTOApiRequestFields;

export const CalendarFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    Year: "Year",
    ImportSrc: "ImportSrc",
    LastImportTime: "LastImportTime",
    _CalendarDetail: "_CalendarDetail",
} as const;

export type CalendarFieldKey = keyof typeof CalendarFields;

export const CategoryDataSetFields = {
    Category: "Category",
    CategoryDetail: "CategoryDetail",
} as const;

export type CategoryDataSetFieldKey = keyof typeof CategoryDataSetFields;

export const CategoryDataSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type CategoryDataSet_DTOApiRequestFieldKey = keyof typeof CategoryDataSet_DTOApiRequestFields;

export const CategoryDetailFields = {
    CategoryId: "CategoryId",
    RowId: "RowId",
    Lang: "Lang",
    CategoryName: "CategoryName",
} as const;

export type CategoryDetailFieldKey = keyof typeof CategoryDetailFields;

export const CategoryFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    CategoryId: "CategoryId",
    ProgId: "ProgId",
    _CategoryDetail: "_CategoryDetail",
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const ChangePasswordFields = {
    OldPassword: "OldPassword",
    NewPassword: "NewPassword",
} as const;

export type ChangePasswordFieldKey = keyof typeof ChangePasswordFields;

export const ContentStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type ContentStatusFieldKey = keyof typeof ContentStatusFields;

export const DataStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type DataStatusFieldKey = keyof typeof DataStatusFields;

export const DayOfWeekFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type DayOfWeekFieldKey = keyof typeof DayOfWeekFields;

export const FileArchiveDetailFields = {
    FileArchiveId: "FileArchiveId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    FileSrcId: "FileSrcId",
    FileSrc: "FileSrc",
    FileName: "FileName",
} as const;

export type FileArchiveDetailFieldKey = keyof typeof FileArchiveDetailFields;

export const FileArchiveInfoFields = {
    FileArchiveId: "FileArchiveId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    _FileArchiveDetail: "_FileArchiveDetail",
    _FileArchiveUrlDetail: "_FileArchiveUrlDetail",
} as const;

export type FileArchiveInfoFieldKey = keyof typeof FileArchiveInfoFields;

export const FileArchiveSetFields = {
    FileArchive: "FileArchive",
    FileArchiveInfo: "FileArchiveInfo",
    FileArchiveDetail: "FileArchiveDetail",
    FileArchiveUrlDetail: "FileArchiveUrlDetail",
} as const;

export type FileArchiveSetFieldKey = keyof typeof FileArchiveSetFields;

export const FileArchiveSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type FileArchiveSet_DTOApiRequestFieldKey = keyof typeof FileArchiveSet_DTOApiRequestFields;

export const FileArchiveUrlDetailFields = {
    FileArchiveId: "FileArchiveId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    Url: "Url",
    UrlDescription: "UrlDescription",
    WindowTarget: "WindowTarget",
} as const;

export type FileArchiveUrlDetailFieldKey = keyof typeof FileArchiveUrlDetailFields;

export const FileArchiveFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    FileArchiveId: "FileArchiveId",
    ContentStatus: "ContentStatus",
    CategoriesId: "CategoriesId",
    TagsId: "TagsId",
    DownloadCount: "DownloadCount",
    _FileArchiveInfo: "_FileArchiveInfo",
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileManageModelFields = {
    CreateTime: "CreateTime",
    CreateUser: "CreateUser",
    CreateUserId: "CreateUserId",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    OrgLvId: "OrgLvId",
    IsIniData: "IsIniData",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    InternalId: "InternalId",
    Path: "Path",
    FileName: "FileName",
    FileExtension: "FileExtension",
    FileDescription: "FileDescription",
    MimeType: "MimeType",
    FileSHA256: "FileSHA256",
    FileSize: "FileSize",
    ProgId: "ProgId",
    ImportLabel: "ImportLabel",
    FileStatus: "FileStatus",
    DownloadCount: "DownloadCount",
    _FileManage_DownloadInfo: "_FileManage_DownloadInfo",
    _FileManage_SyncInfo: "_FileManage_SyncInfo",
} as const;

export type FileManageModelFieldKey = keyof typeof FileManageModelFields;

export const FileManageSetFields = {
    FileManage: "FileManage",
    FileManage_DownloadInfo: "FileManage_DownloadInfo",
    FileManage_SyncInfo: "FileManage_SyncInfo",
} as const;

export type FileManageSetFieldKey = keyof typeof FileManageSetFields;

export const FileManageSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type FileManageSet_DTOApiRequestFieldKey = keyof typeof FileManageSet_DTOApiRequestFields;

export const FileManage_DownloadInfoModelFields = {
    RowState: "RowState",
    InternalId: "InternalId",
    RowId: "RowId",
    DownloadUserIP: "DownloadUserIP",
    UserAgent: "UserAgent",
    RefererURL: "RefererURL",
    DownloadStatus: "DownloadStatus",
    DownloadTime: "DownloadTime",
    _FileManage: "_FileManage",
} as const;

export type FileManage_DownloadInfoModelFieldKey = keyof typeof FileManage_DownloadInfoModelFields;

export const FileManage_SyncInfoModelFields = {
    RowState: "RowState",
    InternalId: "InternalId",
    RowId: "RowId",
    FileStatus: "FileStatus",
    SrcIP: "SrcIP",
    SrcNode: "SrcNode",
    SrcFullPath: "SrcFullPath",
    DestIP: "DestIP",
    DestNode: "DestNode",
    DestFullPath: "DestFullPath",
    ErrorCode: "ErrorCode",
    ErrorMessage: "ErrorMessage",
    ExecuteTime: "ExecuteTime",
    _FileManage: "_FileManage",
} as const;

export type FileManage_SyncInfoModelFieldKey = keyof typeof FileManage_SyncInfoModelFields;

export const FileStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type FileStatusFieldKey = keyof typeof FileStatusFields;

export const FormStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type FormStatusFieldKey = keyof typeof FormStatusFields;

export const FuncActionFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type FuncActionFieldKey = keyof typeof FuncActionFields;

export const GalleryInfoFields = {
    GalleryId: "GalleryId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    Content: "Content",
} as const;

export type GalleryInfoFieldKey = keyof typeof GalleryInfoFields;

export const GalleryPhotosInfoFields = {
    GalleryId: "GalleryId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
} as const;

export type GalleryPhotosInfoFieldKey = keyof typeof GalleryPhotosInfoFields;

export const GalleryPhotosFields = {
    GalleryId: "GalleryId",
    RowId: "RowId",
    PicSrcId: "PicSrcId",
    Sort: "Sort",
    GalleryPhotosInfo: "GalleryPhotosInfo",
} as const;

export type GalleryPhotosFieldKey = keyof typeof GalleryPhotosFields;

export const GallerySetFields = {
    Gallery: "Gallery",
    GalleryInfo: "GalleryInfo",
    GalleryPhotos: "GalleryPhotos",
    GalleryPhotosInfo: "GalleryPhotosInfo",
} as const;

export type GallerySetFieldKey = keyof typeof GallerySetFields;

export const GallerySet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type GallerySet_DTOApiRequestFieldKey = keyof typeof GallerySet_DTOApiRequestFields;

export const GalleryFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    GalleryId: "GalleryId",
    Categories: "Categories",
    Tags: "Tags",
    ContentStatus: "ContentStatus",
    CoverPicSrcId: "CoverPicSrcId",
    Validate_Start: "Validate_Start",
    _GalleryInfo: "_GalleryInfo",
    _GalleryPhotos: "_GalleryPhotos",
} as const;

export type GalleryFieldKey = keyof typeof GalleryFields;

export const GenderFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type GenderFieldKey = keyof typeof GenderFields;

export const LangCodeFields = {
    toString: "toString",
    charAt: "charAt",
    charCodeAt: "charCodeAt",
    concat: "concat",
    indexOf: "indexOf",
    lastIndexOf: "lastIndexOf",
    localeCompare: "localeCompare",
    match: "match",
    replace: "replace",
    search: "search",
    slice: "slice",
    split: "split",
    substring: "substring",
    toLowerCase: "toLowerCase",
    toLocaleLowerCase: "toLocaleLowerCase",
    toUpperCase: "toUpperCase",
    toLocaleUpperCase: "toLocaleUpperCase",
    trim: "trim",
    length: "length",
    substr: "substr",
    valueOf: "valueOf",
    codePointAt: "codePointAt",
    includes: "includes",
    endsWith: "endsWith",
    normalize: "normalize",
    repeat: "repeat",
    startsWith: "startsWith",
    anchor: "anchor",
    big: "big",
    blink: "blink",
    bold: "bold",
    fixed: "fixed",
    fontcolor: "fontcolor",
    fontsize: "fontsize",
    italics: "italics",
    link: "link",
    small: "small",
    strike: "strike",
    sub: "sub",
    sup: "sup",
    padStart: "padStart",
    padEnd: "padEnd",
    trimEnd: "trimEnd",
    trimStart: "trimStart",
    trimLeft: "trimLeft",
    trimRight: "trimRight",
    matchAll: "matchAll",
} as const;

export type LangCodeFieldKey = keyof typeof LangCodeFields;

export const LoginDtoFields = {
    Account: "Account",
    Password: "Password",
} as const;

export type LoginDtoFieldKey = keyof typeof LoginDtoFields;

export const MenuUrlTypeFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type MenuUrlTypeFieldKey = keyof typeof MenuUrlTypeFields;

export const MessageStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type MessageStatusFieldKey = keyof typeof MessageStatusFields;

export const ModulePageTypeFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type ModulePageTypeFieldKey = keyof typeof ModulePageTypeFields;

export const ORCIDDataFields = {
    ORCID: "ORCID",
    AuthorName: "AuthorName",
    AuthorName_en: "AuthorName_en",
    JobTitle: "JobTitle",
    Unit: "Unit",
    Unit_en: "Unit_en",
    Email: "Email",
    Country: "Country",
} as const;

export type ORCIDDataFieldKey = keyof typeof ORCIDDataFields;

export const ORCIDDataApiResponseFields = {
    IsSuccess: "IsSuccess",
    SysMessage: "SysMessage",
    Data: "Data",
} as const;

export type ORCIDDataApiResponseFieldKey = keyof typeof ORCIDDataApiResponseFields;

export const OrderBySpecFields = {
    Col: "Col",
    Desc: "Desc",
} as const;

export type OrderBySpecFieldKey = keyof typeof OrderBySpecFields;

export const PageManagementDetailFields = {
    PageId: "PageId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    Content: "Content",
} as const;

export type PageManagementDetailFieldKey = keyof typeof PageManagementDetailFields;

export const PageManagementSetFields = {
    PageManagement: "PageManagement",
    PageManagementDetail: "PageManagementDetail",
} as const;

export type PageManagementSetFieldKey = keyof typeof PageManagementSetFields;

export const PageManagementSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type PageManagementSet_DTOApiRequestFieldKey = keyof typeof PageManagementSet_DTOApiRequestFields;

export const PageManagementFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    PageId: "PageId",
    CategoryId: "CategoryId",
    ViewCount: "ViewCount",
    _PageManagementDetail: "_PageManagementDetail",
} as const;

export type PageManagementFieldKey = keyof typeof PageManagementFields;

export const PermissionCatalogModuleDTOFields = {
    ModuleCode: "ModuleCode",
    ModuleTitle: "ModuleTitle",
    Progs: "Progs",
} as const;

export type PermissionCatalogModuleDTOFieldKey = keyof typeof PermissionCatalogModuleDTOFields;

export const PermissionCatalogModuleDTOApiResponseFields = {
    IsSuccess: "IsSuccess",
    SysMessage: "SysMessage",
    Data: "Data",
} as const;

export type PermissionCatalogModuleDTOApiResponseFieldKey = keyof typeof PermissionCatalogModuleDTOApiResponseFields;

export const PermissionCatalogProgDTOFields = {
    ProgId: "ProgId",
    ProgTitle: "ProgTitle",
    SupportMask: "SupportMask",
} as const;

export type PermissionCatalogProgDTOFieldKey = keyof typeof PermissionCatalogProgDTOFields;

export const PersonModelFields = {
    CreateTime: "CreateTime",
    CreateUser: "CreateUser",
    CreateUserId: "CreateUserId",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUser: "InvalidUser",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    IsIniData: "IsIniData",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    PersonId: "PersonId",
    PersonName: "PersonName",
    PersonImg: "PersonImg",
    PersonImgId: "PersonImgId",
    Gender: "Gender",
    Email: "Email",
    MobilePhone: "MobilePhone",
    HomePhone: "HomePhone",
} as const;

export type PersonModelFieldKey = keyof typeof PersonModelFields;

export const PersonSetFields = {
    Person: "Person",
} as const;

export type PersonSetFieldKey = keyof typeof PersonSetFields;

export const PersonSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type PersonSet_DTOApiRequestFieldKey = keyof typeof PersonSet_DTOApiRequestFields;

export const PublishStatusFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type PublishStatusFieldKey = keyof typeof PublishStatusFields;

export const QueryListParamFields = {
    Fields: "Fields",
    Condition: "Condition",
    OrderBy: "OrderBy",
    PageNumber: "PageNumber",
    PageSize: "PageSize",
} as const;

export type QueryListParamFieldKey = keyof typeof QueryListParamFields;

export const ResetPasswordFields = {
    UserInternalId: "UserInternalId",
    NewPassword: "NewPassword",
} as const;

export type ResetPasswordFieldKey = keyof typeof ResetPasswordFields;

export const RoleDataModelFields = {
    CreateTime: "CreateTime",
    CreateUser: "CreateUser",
    CreateUserId: "CreateUserId",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUser: "InvalidUser",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    IsIniData: "IsIniData",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    RoleId: "RoleId",
    RoleName: "RoleName",
    IsAdmin: "IsAdmin",
    _RolePermission: "_RolePermission",
} as const;

export type RoleDataModelFieldKey = keyof typeof RoleDataModelFields;

export const RolePermissionModelFields = {
    RowState: "RowState",
    RoleId: "RoleId",
    RowId: "RowId",
    PermissionKey: "PermissionKey",
    GrantMask: "GrantMask",
    _RoleData: "_RoleData",
} as const;

export type RolePermissionModelFieldKey = keyof typeof RolePermissionModelFields;

export const RolePermissionSetFields = {
    RoleData: "RoleData",
    RolePermission: "RolePermission",
} as const;

export type RolePermissionSetFieldKey = keyof typeof RolePermissionSetFields;

export const RolePermissionSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type RolePermissionSet_DTOApiRequestFieldKey = keyof typeof RolePermissionSet_DTOApiRequestFields;

export const RowStateFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type RowStateFieldKey = keyof typeof RowStateFields;

export const SiteMenuSetFields = {
    SiteMenu_Index: "SiteMenu_Index",
    SiteMenu_IndexInfo: "SiteMenu_IndexInfo",
    SiteMenu_Item: "SiteMenu_Item",
    SiteMenu_Item_Title: "SiteMenu_Item_Title",
    SiteMenu_Item_Url: "SiteMenu_Item_Url",
    SiteMenu_Item_Module: "SiteMenu_Item_Module",
} as const;

export type SiteMenuSetFieldKey = keyof typeof SiteMenuSetFields;

export const SiteMenuSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SiteMenuSet_DTOApiRequestFieldKey = keyof typeof SiteMenuSet_DTOApiRequestFields;

export const SiteMenu_IndexInfoFields = {
    SiteIndex: "SiteIndex",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    Description: "Description",
    BannerId: "BannerId",
    SiteHeader: "SiteHeader",
    SiteFooter: "SiteFooter",
    Keyword: "Keyword",
} as const;

export type SiteMenu_IndexInfoFieldKey = keyof typeof SiteMenu_IndexInfoFields;

export const SiteMenu_IndexFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    SiteIndex: "SiteIndex",
    GoogleAnalytics: "GoogleAnalytics",
    Enable: "Enable",
    DefaultLang: "DefaultLang",
    SupportLangs: "SupportLangs",
} as const;

export type SiteMenu_IndexFieldKey = keyof typeof SiteMenu_IndexFields;

export const SiteMenu_ItemFields = {
    SiteIndex: "SiteIndex",
    RowId: "RowId",
    ParentRowId: "ParentRowId",
    ItemSiteUrl: "ItemSiteUrl",
    FullUrl: "FullUrl",
    Level: "Level",
    DisplayOrder: "DisplayOrder",
    ItemType: "ItemType",
    WindowTarget: "WindowTarget",
} as const;

export type SiteMenu_ItemFieldKey = keyof typeof SiteMenu_ItemFields;

export const SiteMenu_Item_ModuleFields = {
    SiteIndex: "SiteIndex",
    ItemRowId: "ItemRowId",
    BannerId: "BannerId",
    PageType: "PageType",
    ModuleProgId: "ModuleProgId",
    ModuleOptions: "ModuleOptions",
} as const;

export type SiteMenu_Item_ModuleFieldKey = keyof typeof SiteMenu_Item_ModuleFields;

export const SiteMenu_Item_TitleFields = {
    SiteIndex: "SiteIndex",
    ItemRowId: "ItemRowId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    IsShowOnMenu: "IsShowOnMenu",
} as const;

export type SiteMenu_Item_TitleFieldKey = keyof typeof SiteMenu_Item_TitleFields;

export const SiteMenu_Item_UrlFields = {
    SiteIndex: "SiteIndex",
    ItemRowId: "ItemRowId",
    RedirectType: "RedirectType",
    RedirectUrl: "RedirectUrl",
} as const;

export type SiteMenu_Item_UrlFieldKey = keyof typeof SiteMenu_Item_UrlFields;

export const SpecCategoryDetailModelFields = {
    CategoryId: "CategoryId",
    RowId: "RowId",
    Lang: "Lang",
    CategoryName: "CategoryName",
} as const;

export type SpecCategoryDetailModelFieldKey = keyof typeof SpecCategoryDetailModelFields;

export const SpecCategoryModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    CategoryId: "CategoryId",
    ProgId: "ProgId",
    ShowColumnItems: "ShowColumnItems",
    _SpecCategoryDetail: "_SpecCategoryDetail",
} as const;

export type SpecCategoryModelFieldKey = keyof typeof SpecCategoryModelFields;

export const SpecCategorySetFields = {
    SpecCategory: "SpecCategory",
    SpecCategoryDetail: "SpecCategoryDetail",
} as const;

export type SpecCategorySetFieldKey = keyof typeof SpecCategorySetFields;

export const SpecCategorySet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecCategorySet_DTOApiRequestFieldKey = keyof typeof SpecCategorySet_DTOApiRequestFields;

export const SpecCurrentOpenTimeFields = {
    Date: "Date",
    DayOfWeek: "DayOfWeek",
    HolidayName: "HolidayName",
    Spec_OpenTime: "Spec_OpenTime",
    Spec_CloseTime: "Spec_CloseTime",
} as const;

export type SpecCurrentOpenTimeFieldKey = keyof typeof SpecCurrentOpenTimeFields;

export const SpecCurrentOpenTime_DTOApiResponseFields = {
    IsSuccess: "IsSuccess",
    SysMessage: "SysMessage",
    Data: "Data",
} as const;

export type SpecCurrentOpenTime_DTOApiResponseFieldKey = keyof typeof SpecCurrentOpenTime_DTOApiResponseFields;

export const SpecJournalAuthorFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    ORCID: "ORCID",
    AuthorName: "AuthorName",
    AuthorName_en: "AuthorName_en",
    JobTitle: "JobTitle",
    Unit: "Unit",
    Unit_en: "Unit_en",
    Email: "Email",
    Country: "Country",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalAuthorFieldKey = keyof typeof SpecJournalAuthorFields;

export const SpecJournalIndexDetailFields = {
    RowState: "RowState",
    IndexId: "IndexId",
    RowId: "RowId",
    Volume: "Volume",
    Issue: "Issue",
    PublishStatus: "PublishStatus",
    IsSpecial: "IsSpecial",
    PublishDate: "PublishDate",
    SeasonNo: "SeasonNo",
    SummaryFile: "SummaryFile",
    SummaryFileId: "SummaryFileId",
    SummaryFileName: "SummaryFileName",
    _SpecJournalIndex: "_SpecJournalIndex",
} as const;

export type SpecJournalIndexDetailFieldKey = keyof typeof SpecJournalIndexDetailFields;

export const SpecJournalIndexModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    IndexId: "IndexId",
    IndexName: "IndexName",
    _SpecJournalIndexDetail: "_SpecJournalIndexDetail",
} as const;

export type SpecJournalIndexModelFieldKey = keyof typeof SpecJournalIndexModelFields;

export const SpecJournalIndexSetFields = {
    SpecJournalIndex: "SpecJournalIndex",
    SpecJournalIndexDetail: "SpecJournalIndexDetail",
} as const;

export type SpecJournalIndexSetFieldKey = keyof typeof SpecJournalIndexSetFields;

export const SpecJournalIndexSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecJournalIndexSet_DTOApiRequestFieldKey = keyof typeof SpecJournalIndexSet_DTOApiRequestFields;

export const SpecJournalKeywordsFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    LangCode: "LangCode",
    Keyword: "Keyword",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalKeywordsFieldKey = keyof typeof SpecJournalKeywordsFields;

export const SpecJournalModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    JournalId: "JournalId",
    _JournalIndex: "_JournalIndex",
    JournalIndexId: "JournalIndexId",
    _JournalIndexDetail: "_JournalIndexDetail",
    JournalIndexRowId: "JournalIndexRowId",
    Title: "Title",
    Title_en: "Title_en",
    PageStart: "PageStart",
    PageEnd: "PageEnd",
    DOIUrl: "DOIUrl",
    JournalFile: "JournalFile",
    JournalFileId: "JournalFileId",
    JournalFileName: "JournalFileName",
    InsightPointFile: "InsightPointFile",
    InsightPointFileId: "InsightPointFileId",
    InsightPointFileName: "InsightPointFileName",
    ArticleLang: "ArticleLang",
    Memo: "Memo",
    Memo_en: "Memo_en",
    _SpecJournalAuthor: "_SpecJournalAuthor",
    _SpecJournalRefFormat: "_SpecJournalRefFormat",
    _SpecJournalOpenPointFiles: "_SpecJournalOpenPointFiles",
    _SpecJournalRefFiles: "_SpecJournalRefFiles",
    _SpecJournalTypes: "_SpecJournalTypes",
    _SpecJournalKeywords: "_SpecJournalKeywords",
} as const;

export type SpecJournalModelFieldKey = keyof typeof SpecJournalModelFields;

export const SpecJournalOpenPointFilesFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    OpenPointFileName: "OpenPointFileName",
    OpenPointFile: "OpenPointFile",
    OpenPointFileId: "OpenPointFileId",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalOpenPointFilesFieldKey = keyof typeof SpecJournalOpenPointFilesFields;

export const SpecJournalRefFilesFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    RefFileName: "RefFileName",
    RefFile: "RefFile",
    RefFileId: "RefFileId",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalRefFilesFieldKey = keyof typeof SpecJournalRefFilesFields;

export const SpecJournalRefFormatFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    Title: "Title",
    Content: "Content",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalRefFormatFieldKey = keyof typeof SpecJournalRefFormatFields;

export const SpecJournalSetFields = {
    SpecJournal: "SpecJournal",
    SpecJournalAuthor: "SpecJournalAuthor",
    SpecJournalRefFormat: "SpecJournalRefFormat",
    SpecJournalOpenPointFiles: "SpecJournalOpenPointFiles",
    SpecJournalRefFiles: "SpecJournalRefFiles",
    SpecJournalTypes: "SpecJournalTypes",
    SpecJournalKeywords: "SpecJournalKeywords",
} as const;

export type SpecJournalSetFieldKey = keyof typeof SpecJournalSetFields;

export const SpecJournalSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecJournalSet_DTOApiRequestFieldKey = keyof typeof SpecJournalSet_DTOApiRequestFields;

export const SpecJournalTypesFields = {
    RowState: "RowState",
    JournalId: "JournalId",
    RowId: "RowId",
    Tag: "Tag",
    TagId: "TagId",
    _SpecJournal: "_SpecJournal",
} as const;

export type SpecJournalTypesFieldKey = keyof typeof SpecJournalTypesFields;

export const SpecMusicalModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    MusicalId: "MusicalId",
    MusicalName: "MusicalName",
    Category: "Category",
    CategoryId: "CategoryId",
    CoverPicId: "CoverPicId",
    Specification: "Specification",
    Headstock: "Headstock",
    Backboard: "Backboard",
    ScaleLength: "ScaleLength",
    Bridge: "Bridge",
    BodyForm: "BodyForm",
    Material: "Material",
    Info: "Info",
    _SpecMusicalSoundList: "_SpecMusicalSoundList",
    _SpecMusicalPictureList: "_SpecMusicalPictureList",
} as const;

export type SpecMusicalModelFieldKey = keyof typeof SpecMusicalModelFields;

export const SpecMusicalPictureListFields = {
    RowState: "RowState",
    MusicalId: "MusicalId",
    RowId: "RowId",
    PicSrcId: "PicSrcId",
    Sort: "Sort",
    Info: "Info",
    _SpecMusical: "_SpecMusical",
} as const;

export type SpecMusicalPictureListFieldKey = keyof typeof SpecMusicalPictureListFields;

export const SpecMusicalSetFields = {
    SpecMusical: "SpecMusical",
    SpecMusicalSoundList: "SpecMusicalSoundList",
    SpecMusicalPictureList: "SpecMusicalPictureList",
} as const;

export type SpecMusicalSetFieldKey = keyof typeof SpecMusicalSetFields;

export const SpecMusicalSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecMusicalSet_DTOApiRequestFieldKey = keyof typeof SpecMusicalSet_DTOApiRequestFields;

export const SpecMusicalSoundListFields = {
    RowState: "RowState",
    MusicalId: "MusicalId",
    RowId: "RowId",
    SoundSrcId: "SoundSrcId",
    Info: "Info",
    _SpecMusical: "_SpecMusical",
} as const;

export type SpecMusicalSoundListFieldKey = keyof typeof SpecMusicalSoundListFields;

export const SpecOpenScheduleRuleModelFields = {
    CreateTime: "CreateTime",
    CreateUser: "CreateUser",
    CreateUserId: "CreateUserId",
    ModifyTime: "ModifyTime",
    ModifyUser: "ModifyUser",
    ModifyUserId: "ModifyUserId",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUser: "InvalidUser",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    IsIniData: "IsIniData",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    AcademicYearId: "AcademicYearId",
    AcademicStart: "AcademicStart",
    AcademicEnd: "AcademicEnd",
    Weekday_OpenTime: "Weekday_OpenTime",
    Weekday_CloseTime: "Weekday_CloseTime",
    Sat_OpenTime: "Sat_OpenTime",
    Sat_CloseTime: "Sat_CloseTime",
    Sun_OpenTime: "Sun_OpenTime",
    Sun_CloseTime: "Sun_CloseTime",
    WinterStart: "WinterStart",
    WinterEnd: "WinterEnd",
    Winter_Weekday_OpenTime: "Winter_Weekday_OpenTime",
    Winter_Weekday_CloseTime: "Winter_Weekday_CloseTime",
    Winter_Sat_OpenTime: "Winter_Sat_OpenTime",
    Winter_Sat_CloseTime: "Winter_Sat_CloseTime",
    Winter_Sun_OpenTime: "Winter_Sun_OpenTime",
    Winter_Sun_CloseTime: "Winter_Sun_CloseTime",
    SummerStart: "SummerStart",
    SummerEnd: "SummerEnd",
    Summer_Weekday_OpenTime: "Summer_Weekday_OpenTime",
    Summer_Weekday_CloseTime: "Summer_Weekday_CloseTime",
    Summer_Sat_OpenTime: "Summer_Sat_OpenTime",
    Summer_Sat_CloseTime: "Summer_Sat_CloseTime",
    Summer_Sun_OpenTime: "Summer_Sun_OpenTime",
    Summer_Sun_CloseTime: "Summer_Sun_CloseTime",
    ModifyMemo: "ModifyMemo",
} as const;

export type SpecOpenScheduleRuleModelFieldKey = keyof typeof SpecOpenScheduleRuleModelFields;

export const SpecOpenScheduleRuleSetFields = {
    SpecOpenScheduleRule: "SpecOpenScheduleRule",
} as const;

export type SpecOpenScheduleRuleSetFieldKey = keyof typeof SpecOpenScheduleRuleSetFields;

export const SpecOpenScheduleRuleSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecOpenScheduleRuleSet_DTOApiRequestFieldKey = keyof typeof SpecOpenScheduleRuleSet_DTOApiRequestFields;

export const SpecResearchDetailModelFields = {
    ResearchId: "ResearchId",
    RowId: "RowId",
    Lang: "Lang",
    Year: "Year",
    AcademicYear: "AcademicYear",
    Semester: "Semester",
    DuringExecution: "DuringExecution",
    ContractPeriod: "ContractPeriod",
    ClassTime: "ClassTime",
    ProjectLeader: "ProjectLeader",
    Name: "Name",
    TeachingStaffOfOurSchool: "TeachingStaffOfOurSchool",
    ApprovalNumber: "ApprovalNumber",
    ApprovedAmount: "ApprovedAmount",
    College: "College",
    Department: "Department",
    GraduationDegree: "GraduationDegree",
    CooperatingUnits: "CooperatingUnits",
    CooperationProject: "CooperationProject",
    Courses: "Courses",
    ProjectName: "ProjectName",
    PaperTitle: "PaperTitle",
    Remark: "Remark",
    Cohost1: "Cohost1",
    Cohost2: "Cohost2",
    Commissioned: "Commissioned",
    PlanAmount: "PlanAmount",
    PlanContent: "PlanContent",
    Professor: "Professor",
} as const;

export type SpecResearchDetailModelFieldKey = keyof typeof SpecResearchDetailModelFields;

export const SpecResearchModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    ResearchId: "ResearchId",
    CategoryId: "CategoryId",
    ContentStatus: "ContentStatus",
    Tags: "Tags",
    _SpecResearchDetail: "_SpecResearchDetail",
} as const;

export type SpecResearchModelFieldKey = keyof typeof SpecResearchModelFields;

export const SpecResearchSetFields = {
    SpecResearch: "SpecResearch",
    SpecResearchDetail: "SpecResearchDetail",
} as const;

export type SpecResearchSetFieldKey = keyof typeof SpecResearchSetFields;

export const SpecResearchSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecResearchSet_DTOApiRequestFieldKey = keyof typeof SpecResearchSet_DTOApiRequestFields;

export const SpecUSRDetailFields = {
    USRId: "USRId",
    RowId: "RowId",
    Lang: "Lang",
    Year: "Year",
    AcademicYear: "AcademicYear",
    Courses: "Courses",
    PracticeField: "PracticeField",
    ProjectName: "ProjectName",
    ExternalCooperationUnit: "ExternalCooperationUnit",
    Department: "Department",
    DuringExecution: "DuringExecution",
    PlanAmount: "PlanAmount",
    ExecutionStrategy: "ExecutionStrategy",
    ContentIntroduction: "ContentIntroduction",
    ProjectConcept: "ProjectConcept",
    ProjectHighlights: "ProjectHighlights",
    ProjectLeader: "ProjectLeader",
    ProjectSubLeader: "ProjectSubLeader",
    AttendTeam: "AttendTeam",
    Cohost1: "Cohost1",
    Cohost2: "Cohost2",
    Commissioned: "Commissioned",
    Remark: "Remark",
    ProjectItem: "ProjectItem",
    Url: "Url",
    UrlDescription: "UrlDescription",
} as const;

export type SpecUSRDetailFieldKey = keyof typeof SpecUSRDetailFields;

export const SpecUSRFileFields = {
    USRId: "USRId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    FileSrc: "FileSrc",
    FileSrcId: "FileSrcId",
    FileName: "FileName",
    _SpecUSRDetail: "_SpecUSRDetail",
} as const;

export type SpecUSRFileFieldKey = keyof typeof SpecUSRFileFields;

export const SpecUSRModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    USRId: "USRId",
    CategoryId: "CategoryId",
    ContentStatus: "ContentStatus",
    Tags: "Tags",
    PictureId: "PictureId",
    PicDescription: "PicDescription",
    _SpecUSRDetail: "_SpecUSRDetail",
    _SpecUSRPhoto: "_SpecUSRPhoto",
} as const;

export type SpecUSRModelFieldKey = keyof typeof SpecUSRModelFields;

export const SpecUSRPhotoInfoFields = {
    USRId: "USRId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    _SpecUSRPhoto: "_SpecUSRPhoto",
} as const;

export type SpecUSRPhotoInfoFieldKey = keyof typeof SpecUSRPhotoInfoFields;

export const SpecUSRPhotoFields = {
    USRId: "USRId",
    RowId: "RowId",
    PicSrcId: "PicSrcId",
    Sort: "Sort",
    _SpecUSR: "_SpecUSR",
    _SpecUSRPhotoInfo: "_SpecUSRPhotoInfo",
} as const;

export type SpecUSRPhotoFieldKey = keyof typeof SpecUSRPhotoFields;

export const SpecUSRSetFields = {
    SpecUSR: "SpecUSR",
    SpecUSRDetail: "SpecUSRDetail",
    SpecUSRPhoto: "SpecUSRPhoto",
    SpecUSRPhotoInfo: "SpecUSRPhotoInfo",
    SpecUSRFile: "SpecUSRFile",
    SpecUSRUrl: "SpecUSRUrl",
} as const;

export type SpecUSRSetFieldKey = keyof typeof SpecUSRSetFields;

export const SpecUSRSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type SpecUSRSet_DTOApiRequestFieldKey = keyof typeof SpecUSRSet_DTOApiRequestFields;

export const SpecUSRUrlFields = {
    USRId: "USRId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    Url: "Url",
    UrlDescription: "UrlDescription",
    WindowTarget: "WindowTarget",
    _SpecUSRDetail: "_SpecUSRDetail",
} as const;

export type SpecUSRUrlFieldKey = keyof typeof SpecUSRUrlFields;

export const SysMessageModelFields = {
    Status: "Status",
    MessageCode: "MessageCode",
    Message: "Message",
} as const;

export type SysMessageModelFieldKey = keyof typeof SysMessageModelFields;

export const TagDataFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    TagId: "TagId",
    ProgId: "ProgId",
    _TagDetail: "_TagDetail",
} as const;

export type TagDataFieldKey = keyof typeof TagDataFields;

export const TagDetailFields = {
    TagId: "TagId",
    RowId: "RowId",
    Lang: "Lang",
    TagName: "TagName",
} as const;

export type TagDetailFieldKey = keyof typeof TagDetailFields;

export const TagSetFields = {
    TagData: "TagData",
    TagDetail: "TagDetail",
} as const;

export type TagSetFieldKey = keyof typeof TagSetFields;

export const TagSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type TagSet_DTOApiRequestFieldKey = keyof typeof TagSet_DTOApiRequestFields;

export const WebResourceInfoFields = {
    WebResourceId: "WebResourceId",
    RowId: "RowId",
    Lang: "Lang",
    Title: "Title",
    Content: "Content",
    ResUrl: "ResUrl",
    Url_OpenType: "Url_OpenType",
} as const;

export type WebResourceInfoFieldKey = keyof typeof WebResourceInfoFields;

export const WebResourceSetFields = {
    WebResource: "WebResource",
    WebResourceInfo: "WebResourceInfo",
} as const;

export type WebResourceSetFieldKey = keyof typeof WebResourceSetFields;

export const WebResourceSet_DTOApiRequestFields = {
    InternalId: "InternalId",
    Data: "Data",
} as const;

export type WebResourceSet_DTOApiRequestFieldKey = keyof typeof WebResourceSet_DTOApiRequestFields;

export const WebResourceFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
    FormStatus: "FormStatus",
    DataStatus: "DataStatus",
    InvalidTime: "InvalidTime",
    InvalidUserId: "InvalidUserId",
    InternalId: "InternalId",
    OrgLvId: "OrgLvId",
    WebResourceId: "WebResourceId",
    Categories: "Categories",
    Tags: "Tags",
    ContentStatus: "ContentStatus",
    PicId: "PicId",
    PicDescription: "PicDescription",
    Validate_Start: "Validate_Start",
    Validate_End: "Validate_End",
    _WebResourceInfo: "_WebResourceInfo",
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

export const WindowTargetFields = {
    toString: "toString",
    toFixed: "toFixed",
    toExponential: "toExponential",
    toPrecision: "toPrecision",
    valueOf: "valueOf",
    toLocaleString: "toLocaleString",
} as const;

export type WindowTargetFieldKey = keyof typeof WindowTargetFields;
