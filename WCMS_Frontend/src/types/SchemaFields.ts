// ✅ 自動產生，請勿手動修改

export const AccountFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  AccountId: 'AccountId',
  AccountName: 'AccountName',
  Person: 'Person',
  PersonId: 'PersonId',
  Role: 'Role',
  RoleId: 'RoleId',
  AccountStatus: 'AccountStatus',
  PasswordChangeDate: 'PasswordChangeDate',
  Password: 'Password',
} as const;

export type AccountFieldKey = keyof typeof AccountFields;

export const AccountApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type AccountApiRequestFieldKey = keyof typeof AccountApiRequestFields;

export const AnnouncementFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  AnnouncementId: 'AnnouncementId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  Picture: 'Picture',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  _AnnouncementDetail: '_AnnouncementDetail',
} as const;

export type AnnouncementFieldKey = keyof typeof AnnouncementFields;

export const AnnouncementApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type AnnouncementApiRequestFieldKey = keyof typeof AnnouncementApiRequestFields;

export const AnnouncementDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  AnnouncementId: 'AnnouncementId',
  Lang: 'Lang',
  Title: 'Title',
  SubTitle: 'SubTitle',
  Content: 'Content',
  Url: 'Url',
  UrlDescription: 'UrlDescription',
  _AnnouncementDetailFile: '_AnnouncementDetailFile',
} as const;

export type AnnouncementDetailFieldKey = keyof typeof AnnouncementDetailFields;

export const AnnouncementDetailFileFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  AnnouncementId: 'AnnouncementId',
  ParentRowId: 'ParentRowId',
  File: 'File',
  FileId: 'FileId',
  FileName: 'FileName',
} as const;

export type AnnouncementDetailFileFieldKey = keyof typeof AnnouncementDetailFileFields;

export const BannerFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  BannerId: 'BannerId',
  BannerCategoryName: 'BannerCategoryName',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  _BannerDetail: '_BannerDetail',
} as const;

export type BannerFieldKey = keyof typeof BannerFields;

export const BannerApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type BannerApiRequestFieldKey = keyof typeof BannerApiRequestFields;

export const BannerDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  BannerId: 'BannerId',
  PicSrcId: 'PicSrcId',
  FontColor: 'FontColor',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  Sort: 'Sort',
  _BannerDetailInfo: '_BannerDetailInfo',
} as const;

export type BannerDetailFieldKey = keyof typeof BannerDetailFields;

export const BannerDetailInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  BannerId: 'BannerId',
  ParentRowId: 'ParentRowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  URL: 'URL',
  URL_Open: 'URL_Open',
} as const;

export type BannerDetailInfoFieldKey = keyof typeof BannerDetailInfoFields;

export const CalendarFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  Year: 'Year',
  ImportSrc: 'ImportSrc',
  LastImportTime: 'LastImportTime',
  _CalendarDetail: '_CalendarDetail',
} as const;

export type CalendarFieldKey = keyof typeof CalendarFields;

export const CalendarApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type CalendarApiRequestFieldKey = keyof typeof CalendarApiRequestFields;

export const CalendarDetailFields = {
  RowState: 'RowState',
  Year: 'Year',
  Date: 'Date',
  DayOfWeek: 'DayOfWeek',
  IsHoliday: 'IsHoliday',
  HolidayName: 'HolidayName',
  Description: 'Description',
  IsEdit: 'IsEdit',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
} as const;

export type CalendarDetailFieldKey = keyof typeof CalendarDetailFields;

export const CaptchaPublicConfigFields = {
  Enabled: 'Enabled',
  Provider: 'Provider',
  SiteKey: 'SiteKey',
} as const;

export type CaptchaPublicConfigFieldKey = keyof typeof CaptchaPublicConfigFields;

export const CaptchaPublicConfig_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type CaptchaPublicConfig_DTOApiResponseFieldKey = keyof typeof CaptchaPublicConfig_DTOApiResponseFields;

export const CategoryFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
  _CategoryDetail: '_CategoryDetail',
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const CategoryApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type CategoryApiRequestFieldKey = keyof typeof CategoryApiRequestFields;

export const CategoryDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  CategoryId: 'CategoryId',
  Lang: 'Lang',
  CategoryName: 'CategoryName',
} as const;

export type CategoryDetailFieldKey = keyof typeof CategoryDetailFields;

export const ChangePasswordFields = {
  OldPassword: 'OldPassword',
  NewPassword: 'NewPassword',
} as const;

export type ChangePasswordFieldKey = keyof typeof ChangePasswordFields;

export const FileArchiveFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  FileArchiveId: 'FileArchiveId',
  ContentStatus: 'ContentStatus',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
  Validate_Start: 'Validate_Start',
  _FileArchiveInfo: '_FileArchiveInfo',
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileArchiveApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileArchiveApiRequestFieldKey = keyof typeof FileArchiveApiRequestFields;

export const FileArchiveDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  FileSrcId: 'FileSrcId',
  FileSrc: 'FileSrc',
  FileName: 'FileName',
} as const;

export type FileArchiveDetailFieldKey = keyof typeof FileArchiveDetailFields;

export const FileArchiveInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  FileArchiveId: 'FileArchiveId',
  Lang: 'Lang',
  Title: 'Title',
  _FileArchiveDetail: '_FileArchiveDetail',
  _FileArchiveUrlDetail: '_FileArchiveUrlDetail',
} as const;

export type FileArchiveInfoFieldKey = keyof typeof FileArchiveInfoFields;

export const FileArchiveUrlDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  Url: 'Url',
  UrlDescription: 'UrlDescription',
  WindowTarget: 'WindowTarget',
} as const;

export type FileArchiveUrlDetailFieldKey = keyof typeof FileArchiveUrlDetailFields;

export const FileManageFields = {
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  InternalId: 'InternalId',
  Path: 'Path',
  FileName: 'FileName',
  FileExtension: 'FileExtension',
  FileDescription: 'FileDescription',
  MimeType: 'MimeType',
  FileSHA256: 'FileSHA256',
  FileSize: 'FileSize',
  ProgId: 'ProgId',
  ImportLabel: 'ImportLabel',
  FileStatus: 'FileStatus',
  PublicDownloadCount: 'PublicDownloadCount',
  IsPublic: 'IsPublic',
  _FileManage_SyncInfo: '_FileManage_SyncInfo',
  _FileManage_DownloadRecent: '_FileManage_DownloadRecent',
} as const;

export type FileManageFieldKey = keyof typeof FileManageFields;

export const FileManageApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileManageApiRequestFieldKey = keyof typeof FileManageApiRequestFields;

export const FileManage_DownloadRecentFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  InternalId: 'InternalId',
  VisitorKey: 'VisitorKey',
  RefererURL: 'RefererURL',
  LastCountTime: 'LastCountTime',
} as const;

export type FileManage_DownloadRecentFieldKey = keyof typeof FileManage_DownloadRecentFields;

export const FileManage_SyncInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  InternalId: 'InternalId',
  FileStatus: 'FileStatus',
  SrcIP: 'SrcIP',
  SrcNode: 'SrcNode',
  SrcFullPath: 'SrcFullPath',
  DestIP: 'DestIP',
  DestNode: 'DestNode',
  DestFullPath: 'DestFullPath',
  ErrorCode: 'ErrorCode',
  ErrorMessage: 'ErrorMessage',
  ExecuteTime: 'ExecuteTime',
} as const;

export type FileManage_SyncInfoFieldKey = keyof typeof FileManage_SyncInfoFields;

export const GalleryFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  GalleryId: 'GalleryId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  CoverPicSrc: 'CoverPicSrc',
  CoverPicSrcId: 'CoverPicSrcId',
  _GalleryInfo: '_GalleryInfo',
  _GalleryPhotos: '_GalleryPhotos',
} as const;

export type GalleryFieldKey = keyof typeof GalleryFields;

export const GalleryApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type GalleryApiRequestFieldKey = keyof typeof GalleryApiRequestFields;

export const GalleryInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  GalleryId: 'GalleryId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type GalleryInfoFieldKey = keyof typeof GalleryInfoFields;

export const GalleryPhotosFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  GalleryId: 'GalleryId',
  PicSrc: 'PicSrc',
  PicSrcId: 'PicSrcId',
  Sort: 'Sort',
  _GalleryPhotosInfo: '_GalleryPhotosInfo',
} as const;

export type GalleryPhotosFieldKey = keyof typeof GalleryPhotosFields;

export const GalleryPhotosInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  GalleryId: 'GalleryId',
  ParentRowId: 'ParentRowId',
  Lang: 'Lang',
  Title: 'Title',
  Description: 'Description',
} as const;

export type GalleryPhotosInfoFieldKey = keyof typeof GalleryPhotosInfoFields;

export const GetCurrentSiteOnlineCountRequestFields = {
  SiteIndex: 'SiteIndex',
  Minutes: 'Minutes',
} as const;

export type GetCurrentSiteOnlineCountRequestFieldKey = keyof typeof GetCurrentSiteOnlineCountRequestFields;

export const GetCurrentSiteOnlineCountResultFields = {
  SiteIndex: 'SiteIndex',
  Minutes: 'Minutes',
  CurrentOnlineCount: 'CurrentOnlineCount',
  QueryTime: 'QueryTime',
} as const;

export type GetCurrentSiteOnlineCountResultFieldKey = keyof typeof GetCurrentSiteOnlineCountResultFields;

export const GetCurrentSiteOnlineCountResult_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type GetCurrentSiteOnlineCountResult_DTOApiResponseFieldKey = keyof typeof GetCurrentSiteOnlineCountResult_DTOApiResponseFields;

export const LoginDtoFields = {
  Account: 'Account',
  Password: 'Password',
} as const;

export type LoginDtoFieldKey = keyof typeof LoginDtoFields;

export const MatCategoryFormModelFields = {
  Category: 'Category',
  MatCategoryInfoField: 'MatCategoryInfoField',
} as const;

export type MatCategoryFormModelFieldKey = keyof typeof MatCategoryFormModelFields;

export const MatCategoryFormModelApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type MatCategoryFormModelApiRequestFieldKey = keyof typeof MatCategoryFormModelApiRequestFields;

export const MatCategoryInfoFieldFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  CategoryId: 'CategoryId',
  Field: 'Field',
  _MatCategoryInfoFieldDisplay: '_MatCategoryInfoFieldDisplay',
} as const;

export type MatCategoryInfoFieldFieldKey = keyof typeof MatCategoryInfoFieldFields;

export const MatCategoryInfoFieldDisplayFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  CategoryId: 'CategoryId',
  ParentRowId: 'ParentRowId',
  Lang: 'Lang',
  FieldDisplayName: 'FieldDisplayName',
} as const;

export type MatCategoryInfoFieldDisplayFieldKey = keyof typeof MatCategoryInfoFieldDisplayFields;

export const MaterialFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  MaterialId: 'MaterialId',
  Category: 'Category',
  CategoryId: 'CategoryId',
  Price: 'Price',
  _MaterialLangInfo: '_MaterialLangInfo',
  _MaterialPicture: '_MaterialPicture',
  _MaterialTags: '_MaterialTags',
} as const;

export type MaterialFieldKey = keyof typeof MaterialFields;

export const MaterialApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type MaterialApiRequestFieldKey = keyof typeof MaterialApiRequestFields;

export const MaterialLangInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  MaterialId: 'MaterialId',
  Lang: 'Lang',
  MaterialName: 'MaterialName',
  MaterialInfoJson: 'MaterialInfoJson',
  Memo: 'Memo',
} as const;

export type MaterialLangInfoFieldKey = keyof typeof MaterialLangInfoFields;

export const MaterialPictureFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  MaterialId: 'MaterialId',
  Picture: 'Picture',
  PictureId: 'PictureId',
  PictureName: 'PictureName',
} as const;

export type MaterialPictureFieldKey = keyof typeof MaterialPictureFields;

export const MaterialTagsFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  MaterialId: 'MaterialId',
  Tag: 'Tag',
  TagId: 'TagId',
} as const;

export type MaterialTagsFieldKey = keyof typeof MaterialTagsFields;

export const OrderBySpecFields = {
  Col: 'Col',
  Desc: 'Desc',
} as const;

export type OrderBySpecFieldKey = keyof typeof OrderBySpecFields;

export const PageManagementFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  SiteIndex: 'SiteIndex',
  SiteIndexId: 'SiteIndexId',
  PageId: 'PageId',
  ProgId: 'ProgId',
  CategoryId: 'CategoryId',
  _PageManagementDetail: '_PageManagementDetail',
} as const;

export type PageManagementFieldKey = keyof typeof PageManagementFields;

export const PageManagementApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type PageManagementApiRequestFieldKey = keyof typeof PageManagementApiRequestFields;

export const PageManagementDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  PageId: 'PageId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type PageManagementDetailFieldKey = keyof typeof PageManagementDetailFields;

export const PermissionCatalogModuleDTOFields = {
  ModuleCode: 'ModuleCode',
  ModuleTitle: 'ModuleTitle',
  Progs: 'Progs',
} as const;

export type PermissionCatalogModuleDTOFieldKey = keyof typeof PermissionCatalogModuleDTOFields;

export const PermissionCatalogModuleDTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type PermissionCatalogModuleDTOApiResponseFieldKey = keyof typeof PermissionCatalogModuleDTOApiResponseFields;

export const PermissionCatalogProgDTOFields = {
  ProgId: 'ProgId',
  ProgTitle: 'ProgTitle',
  SupportMask: 'SupportMask',
} as const;

export type PermissionCatalogProgDTOFieldKey = keyof typeof PermissionCatalogProgDTOFields;

export const PersonFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  PersonId: 'PersonId',
  PersonName: 'PersonName',
  PersonImg: 'PersonImg',
  PersonImgId: 'PersonImgId',
  Gender: 'Gender',
  Email: 'Email',
  MobilePhone: 'MobilePhone',
  HomePhone: 'HomePhone',
} as const;

export type PersonFieldKey = keyof typeof PersonFields;

export const PersonApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type PersonApiRequestFieldKey = keyof typeof PersonApiRequestFields;

export const QueryListParamFields = {
  Fields: 'Fields',
  Condition: 'Condition',
  OrderBy: 'OrderBy',
  RankGroups: 'RankGroups',
  PageNumber: 'PageNumber',
  PageSize: 'PageSize',
} as const;

export type QueryListParamFieldKey = keyof typeof QueryListParamFields;

export const RankGroupsSpecFields = {
  Condition: 'Condition',
  OrderBy: 'OrderBy',
} as const;

export type RankGroupsSpecFieldKey = keyof typeof RankGroupsSpecFields;

export const ResetPasswordFields = {
  UserInternalId: 'UserInternalId',
  NewPassword: 'NewPassword',
} as const;

export type ResetPasswordFieldKey = keyof typeof ResetPasswordFields;

export const RoleDataFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  RoleId: 'RoleId',
  RoleName: 'RoleName',
  IsAdmin: 'IsAdmin',
  _RolePermission: '_RolePermission',
} as const;

export type RoleDataFieldKey = keyof typeof RoleDataFields;

export const RoleDataApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type RoleDataApiRequestFieldKey = keyof typeof RoleDataApiRequestFields;

export const RolePermissionFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  RoleId: 'RoleId',
  PermissionKey: 'PermissionKey',
  GrantMask: 'GrantMask',
} as const;

export type RolePermissionFieldKey = keyof typeof RolePermissionFields;

export const SaveMenuItemModuleFields = {
  BannerId: 'BannerId',
  PageType: 'PageType',
  ModuleProgId: 'ModuleProgId',
  ModuleOptions: 'ModuleOptions',
} as const;

export type SaveMenuItemModuleFieldKey = keyof typeof SaveMenuItemModuleFields;

export const SaveMenuItemResultFields = {
  RowId: 'RowId',
  FullUrl: 'FullUrl',
  IsNewItem: 'IsNewItem',
} as const;

export type SaveMenuItemResultFieldKey = keyof typeof SaveMenuItemResultFields;

export const SaveMenuItemResult_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type SaveMenuItemResult_DTOApiResponseFieldKey = keyof typeof SaveMenuItemResult_DTOApiResponseFields;

export const SaveMenuItemTitleFields = {
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  IsShowOnMenu: 'IsShowOnMenu',
} as const;

export type SaveMenuItemTitleFieldKey = keyof typeof SaveMenuItemTitleFields;

export const SaveMenuItemUrlFields = {
  RedirectType: 'RedirectType',
  RedirectUrl: 'RedirectUrl',
} as const;

export type SaveMenuItemUrlFieldKey = keyof typeof SaveMenuItemUrlFields;

export const SaveMenuItemFields = {
  InternalId: 'InternalId',
  RowId: 'RowId',
  ParentRowId: 'ParentRowId',
  DisplayOrder: 'DisplayOrder',
  ItemSiteUrl: 'ItemSiteUrl',
  ItemType: 'ItemType',
  WindowTarget: 'WindowTarget',
  Titles: 'Titles',
  Url: 'Url',
  Module: 'Module',
} as const;

export type SaveMenuItemFieldKey = keyof typeof SaveMenuItemFields;

export const SaveMenuItem_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SaveMenuItem_DTOApiRequestFieldKey = keyof typeof SaveMenuItem_DTOApiRequestFields;

export const SaveMenuStructureItemFields = {
  RowId: 'RowId',
  ParentRowId: 'ParentRowId',
  DisplayOrder: 'DisplayOrder',
} as const;

export type SaveMenuStructureItemFieldKey = keyof typeof SaveMenuStructureItemFields;

export const SaveMenuStructureFields = {
  InternalId: 'InternalId',
  Items: 'Items',
  DeletedRowIds: 'DeletedRowIds',
} as const;

export type SaveMenuStructureFieldKey = keyof typeof SaveMenuStructureFields;

export const SaveMenuStructure_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SaveMenuStructure_DTOApiRequestFieldKey = keyof typeof SaveMenuStructure_DTOApiRequestFields;

export const SaveSiteInfoFields = {
  InternalId: 'InternalId',
  SiteMenu_Index: 'SiteMenu_Index',
  SiteMenu_IndexInfo: 'SiteMenu_IndexInfo',
} as const;

export type SaveSiteInfoFieldKey = keyof typeof SaveSiteInfoFields;

export const SaveSiteInfo_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SaveSiteInfo_DTOApiRequestFieldKey = keyof typeof SaveSiteInfo_DTOApiRequestFields;

export const SiteMenu_IndexFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  SiteIndex: 'SiteIndex',
  GoogleAnalytics: 'GoogleAnalytics',
  Enable: 'Enable',
  DefaultLang: 'DefaultLang',
  SupportLangs: 'SupportLangs',
  _SiteMenu_IndexInfo: '_SiteMenu_IndexInfo',
  _SiteMenu_Item: '_SiteMenu_Item',
} as const;

export type SiteMenu_IndexFieldKey = keyof typeof SiteMenu_IndexFields;

export const SiteMenu_IndexApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SiteMenu_IndexApiRequestFieldKey = keyof typeof SiteMenu_IndexApiRequestFields;

export const SiteMenu_IndexInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  SiteIndex: 'SiteIndex',
  Lang: 'Lang',
  Title: 'Title',
  Description: 'Description',
  SiteHeader: 'SiteHeader',
  SiteFooter: 'SiteFooter',
  Keyword: 'Keyword',
  Banner: 'Banner',
  BannerId: 'BannerId',
} as const;

export type SiteMenu_IndexInfoFieldKey = keyof typeof SiteMenu_IndexInfoFields;

export const SiteMenu_ItemFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  SiteIndex: 'SiteIndex',
  ParentRowId: 'ParentRowId',
  ItemSiteUrl: 'ItemSiteUrl',
  FullUrl: 'FullUrl',
  Level: 'Level',
  DisplayOrder: 'DisplayOrder',
  ItemType: 'ItemType',
  WindowTarget: 'WindowTarget',
  _SiteMenu_Item_Title: '_SiteMenu_Item_Title',
  _SiteMenu_Item_Url: '_SiteMenu_Item_Url',
  _SiteMenu_Item_Module: '_SiteMenu_Item_Module',
} as const;

export type SiteMenu_ItemFieldKey = keyof typeof SiteMenu_ItemFields;

export const SiteMenu_Item_ModuleFields = {
  RowState: 'RowState',
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  Banner: 'Banner',
  BannerId: 'BannerId',
  PageType: 'PageType',
  ModuleProgId: 'ModuleProgId',
  ModuleOptions: 'ModuleOptions',
} as const;

export type SiteMenu_Item_ModuleFieldKey = keyof typeof SiteMenu_Item_ModuleFields;

export const SiteMenu_Item_TitleFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  Lang: 'Lang',
  Title: 'Title',
  IsShowOnMenu: 'IsShowOnMenu',
} as const;

export type SiteMenu_Item_TitleFieldKey = keyof typeof SiteMenu_Item_TitleFields;

export const SiteMenu_Item_UrlFields = {
  RowState: 'RowState',
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  RedirectType: 'RedirectType',
  RedirectUrl: 'RedirectUrl',
} as const;

export type SiteMenu_Item_UrlFieldKey = keyof typeof SiteMenu_Item_UrlFields;

export const SiteViewCountDetailFields = {
  RowState: 'RowState',
  SiteIndex: 'SiteIndex',
  ProgId: 'ProgId',
  TargetInternalId: 'TargetInternalId',
  PageViewCount: 'PageViewCount',
  FilePreviewCount: 'FilePreviewCount',
  FileDownloadCount: 'FileDownloadCount',
  LinkClickCount: 'LinkClickCount',
} as const;

export type SiteViewCountDetailFieldKey = keyof typeof SiteViewCountDetailFields;

export const SiteViewCountHeaderFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  SiteMenu_Index: 'SiteMenu_Index',
  SiteIndex: 'SiteIndex',
  PublicViewCount: 'PublicViewCount',
  _SiteViewCountDetail: '_SiteViewCountDetail',
} as const;

export type SiteViewCountHeaderFieldKey = keyof typeof SiteViewCountHeaderFields;

export const SiteViewCountHeaderApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type SiteViewCountHeaderApiResponseFieldKey = keyof typeof SiteViewCountHeaderApiResponseFields;

export const SpecHomePage1821Fields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  HomePageId: 'HomePageId',
  Lang: 'Lang',
  Section3Title: 'Section3Title',
  Section3SubTitle: 'Section3SubTitle',
  Card1Title: 'Card1Title',
  Card1Link: 'Card1Link',
  Card1Pic: 'Card1Pic',
  Card1PicId: 'Card1PicId',
  Card2Title: 'Card2Title',
  Card2Link: 'Card2Link',
  Card2Pic: 'Card2Pic',
  Card2PicId: 'Card2PicId',
  Section4Title: 'Section4Title',
  Section4SubTitle: 'Section4SubTitle',
  LinkOptions: 'LinkOptions',
  LinkViewMore: 'LinkViewMore',
  _SpecHomePage1821_Banner: '_SpecHomePage1821_Banner',
  _SpecHomePage1821_Shortcut: '_SpecHomePage1821_Shortcut',
} as const;

export type SpecHomePage1821FieldKey = keyof typeof SpecHomePage1821Fields;

export const SpecHomePage1821ApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecHomePage1821ApiRequestFieldKey = keyof typeof SpecHomePage1821ApiRequestFields;

export const SpecHomePage1821_BannerFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  HomePageId: 'HomePageId',
  Title: 'Title',
  SubTitle: 'SubTitle',
  BannerFile: 'BannerFile',
  BannerFileId: 'BannerFileId',
  BannerFileDescription: 'BannerFileDescription',
  Link: 'Link',
} as const;

export type SpecHomePage1821_BannerFieldKey = keyof typeof SpecHomePage1821_BannerFields;

export const SpecHomePage1821_ShortcutFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  HomePageId: 'HomePageId',
  ShortcutCode: 'ShortcutCode',
  Title: 'Title',
  SubTitle: 'SubTitle',
  IconFile: 'IconFile',
  IconFileId: 'IconFileId',
  IconFileDescription: 'IconFileDescription',
  ActionType: 'ActionType',
  ActionValue: 'ActionValue',
  IsLink: 'IsLink',
  Link: 'Link',
  LinkPic: 'LinkPic',
  LinkPicId: 'LinkPicId',
  _SpecHomePage1821_ShortcutModuleItem: '_SpecHomePage1821_ShortcutModuleItem',
} as const;

export type SpecHomePage1821_ShortcutFieldKey = keyof typeof SpecHomePage1821_ShortcutFields;

export const SpecHomePage1821_ShortcutModuleItemFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  HomePageId: 'HomePageId',
  ParentRowId: 'ParentRowId',
  Title: 'Title',
  SubTitle: 'SubTitle',
  ModuleType: 'ModuleType',
  ModuleOptions: 'ModuleOptions',
  MoreViewLink: 'MoreViewLink',
} as const;

export type SpecHomePage1821_ShortcutModuleItemFieldKey = keyof typeof SpecHomePage1821_ShortcutModuleItemFields;

export const StringApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type StringApiResponseFieldKey = keyof typeof StringApiResponseFields;

export const SurveyFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  SurveyId: 'SurveyId',
  SurveyName: 'SurveyName',
  SurveyDescription: 'SurveyDescription',
  SurveySuccessContent: 'SurveySuccessContent',
  _SurveyItem: '_SurveyItem',
} as const;

export type SurveyFieldKey = keyof typeof SurveyFields;

export const SurveyApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SurveyApiRequestFieldKey = keyof typeof SurveyApiRequestFields;

export const SurveyItemFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  SurveyId: 'SurveyId',
  FieldId: 'FieldId',
  IsRequired: 'IsRequired',
  InputType: 'InputType',
  Options: 'Options',
  _SurveyItemLang: '_SurveyItemLang',
} as const;

export type SurveyItemFieldKey = keyof typeof SurveyItemFields;

export const SurveyItemLangFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  SurveyId: 'SurveyId',
  ParentRowId: 'ParentRowId',
  Lang: 'Lang',
  FieldName: 'FieldName',
} as const;

export type SurveyItemLangFieldKey = keyof typeof SurveyItemLangFields;

export const SurveySubmissionRequestFields = {
  SurveyId: 'SurveyId',
  Lang: 'Lang',
  UserName: 'UserName',
  ContactPhone: 'ContactPhone',
  Email: 'Email',
  FormDataJson: 'FormDataJson',
  TimeZone: 'TimeZone',
  CaptchaToken: 'CaptchaToken',
} as const;

export type SurveySubmissionRequestFieldKey = keyof typeof SurveySubmissionRequestFields;

export const SurveySubmissionsFields = {
  SurveySubmissionId: 'SurveySubmissionId',
  UserName: 'UserName',
  ContactPhone: 'ContactPhone',
  Email: 'Email',
  FormDataJson: 'FormDataJson',
  FieldSnapshotJson: 'FieldSnapshotJson',
  Survey: 'Survey',
  SurveyId: 'SurveyId',
  Lang: 'Lang',
  SubmitTime: 'SubmitTime',
  ReplyStatus: 'ReplyStatus',
  UserAgent: 'UserAgent',
  AcceptLanguage: 'AcceptLanguage',
  ClientIpMasked: 'ClientIpMasked',
  ClientIpHash: 'ClientIpHash',
  BrowserName: 'BrowserName',
  BrowserVersion: 'BrowserVersion',
  OsName: 'OsName',
  OsVersion: 'OsVersion',
  DeviceType: 'DeviceType',
  TimeZone: 'TimeZone',
} as const;

export type SurveySubmissionsFieldKey = keyof typeof SurveySubmissionsFields;

export const SurveySubmissionsApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type SurveySubmissionsApiResponseFieldKey = keyof typeof SurveySubmissionsApiResponseFields;

export const SysMessageModelFields = {
  Status: 'Status',
  MessageCode: 'MessageCode',
  Message: 'Message',
} as const;

export type SysMessageModelFieldKey = keyof typeof SysMessageModelFields;

export const TagDataFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  TagId: 'TagId',
  ProgId: 'ProgId',
  _TagDetail: '_TagDetail',
} as const;

export type TagDataFieldKey = keyof typeof TagDataFields;

export const TagDataApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type TagDataApiRequestFieldKey = keyof typeof TagDataApiRequestFields;

export const TagDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  TagId: 'TagId',
  Lang: 'Lang',
  TagName: 'TagName',
} as const;

export type TagDetailFieldKey = keyof typeof TagDetailFields;

export const TimelineFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  TimelineId: 'TimelineId',
  TimelineName: 'TimelineName',
  _TimelineItem: '_TimelineItem',
} as const;

export type TimelineFieldKey = keyof typeof TimelineFields;

export const TimelineApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type TimelineApiRequestFieldKey = keyof typeof TimelineApiRequestFields;

export const TimelineItemFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  TimelineId: 'TimelineId',
  Date: 'Date',
  _TimelineLangDetail: '_TimelineLangDetail',
} as const;

export type TimelineItemFieldKey = keyof typeof TimelineItemFields;

export const TimelineLangDetailFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  TimelineId: 'TimelineId',
  ParentRowId: 'ParentRowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type TimelineLangDetailFieldKey = keyof typeof TimelineLangDetailFields;

export const TryCountDetailViewRequestFields = {
  SiteIndex: 'SiteIndex',
  ProgId: 'ProgId',
  InternalId: 'InternalId',
} as const;

export type TryCountDetailViewRequestFieldKey = keyof typeof TryCountDetailViewRequestFields;

export const TryCountResultFields = {
  IsCounted: 'IsCounted',
  CurrentCount: 'CurrentCount',
} as const;

export type TryCountResultFieldKey = keyof typeof TryCountResultFields;

export const TryCountResult_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type TryCountResult_DTOApiResponseFieldKey = keyof typeof TryCountResult_DTOApiResponseFields;

export const TryCountSiteViewRequestFields = {
  SiteIndex: 'SiteIndex',
} as const;

export type TryCountSiteViewRequestFieldKey = keyof typeof TryCountSiteViewRequestFields;

export const WebResourceFields = {
  InternalId: 'InternalId',
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUser: 'InvalidUser',
  InvalidUserId: 'InvalidUserId',
  DataVersion: 'DataVersion',
  IsIniData: 'IsIniData',
  WebResourceId: 'WebResourceId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  Pic: 'Pic',
  PicId: 'PicId',
  PicDescription: 'PicDescription',
  _WebResourceInfo: '_WebResourceInfo',
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

export const WebResourceApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type WebResourceApiRequestFieldKey = keyof typeof WebResourceApiRequestFields;

export const WebResourceInfoFields = {
  RowState: 'RowState',
  RowId: 'RowId',
  RowNo: 'RowNo',
  WebResourceId: 'WebResourceId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  ResUrl: 'ResUrl',
  Url_OpenType: 'Url_OpenType',
} as const;

export type WebResourceInfoFieldKey = keyof typeof WebResourceInfoFields;

// ==============================
// ✅ PGID (from OpenAPI paths)
// ==============================

type ServicePath = keyof import("./api").paths;
type ServiceRelPath = ServicePath extends `/Service/${infer P}` ? P : never;

export type PGID = ServiceRelPath extends `${infer C}/${string}` ? C : never;

export const PGID = {
    Account: "Account",
    Announcement: "Announcement",
    Auth: "Auth",
    Banner: "Banner",
    Calendar: "Calendar",
    Captcha: "Captcha",
    Category: "Category",
    FileArchive: "FileArchive",
    FileManagement: "FileManagement",
    Gallery: "Gallery",
    MatCategory: "MatCategory",
    Material: "Material",
    PageManagement: "PageManagement",
    Person: "Person",
    RolePermission: "RolePermission",
    SiteMenu: "SiteMenu",
    SiteViewCount: "SiteViewCount",
    SpecHomePageApi: "SpecHomePageApi",
    Survey: "Survey",
    SurveySubmission: "SurveySubmission",
    SystemAPI: "SystemAPI",
    Tag: "Tag",
    Timeline: "Timeline",
    WebResource: "WebResource",
} as const satisfies Record<string, PGID>;

export type PGIDKey = keyof typeof PGID;
export type PGIDValue = typeof PGID[PGIDKey];
