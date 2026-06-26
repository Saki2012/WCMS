// ✅ 自動產生，請勿手動修改

export const AccountModelFields = {
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
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  AccountId: 'AccountId',
  AccountName: 'AccountName',
  Person: 'Person',
  PersonId: 'PersonId',
  Role: 'Role',
  RoleId: 'RoleId',
  PasswordHash: 'PasswordHash',
  PasswordSalt: 'PasswordSalt',
  PasswordAlgoVer: 'PasswordAlgoVer',
  AccountStatus: 'AccountStatus',
  PasswordChangeDate: 'PasswordChangeDate',
} as const;

export type AccountModelFieldKey = keyof typeof AccountModelFields;

export const AccountSetFields = {
  Account: 'Account',
} as const;

export type AccountSetFieldKey = keyof typeof AccountSetFields;

export const AccountSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type AccountSet_DTOApiRequestFieldKey = keyof typeof AccountSet_DTOApiRequestFields;

export const AccountFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  AccountId: 'AccountId',
  AccountName: 'AccountName',
  Person: 'Person',
  PersonId: 'PersonId',
  Role: 'Role',
  RoleId: 'RoleId',
  Password: 'Password',
  AccountStatus: 'AccountStatus',
  PasswordChangeDate: 'PasswordChangeDate',
} as const;

export type AccountFieldKey = keyof typeof AccountFields;

export const AnnouncementDetailFileFields = {
  AnnouncementId: 'AnnouncementId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  File: 'File',
  FileId: 'FileId',
  FileName: 'FileName',
  _AnnouncementDetail: '_AnnouncementDetail',
} as const;

export type AnnouncementDetailFileFieldKey = keyof typeof AnnouncementDetailFileFields;

export const AnnouncementDetailFields = {
  AnnouncementId: 'AnnouncementId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  SubTitle: 'SubTitle',
  Content: 'Content',
  Url: 'Url',
  UrlDescription: 'UrlDescription',
  _Announcement: '_Announcement',
  _AnnouncementDetailFile: '_AnnouncementDetailFile',
} as const;

export type AnnouncementDetailFieldKey = keyof typeof AnnouncementDetailFields;

export const AnnouncementSetFields = {
  Announcement: 'Announcement',
  AnnouncementDetail: 'AnnouncementDetail',
  AnnouncementDetailFile: 'AnnouncementDetailFile',
} as const;

export type AnnouncementSetFieldKey = keyof typeof AnnouncementSetFields;

export const AnnouncementSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type AnnouncementSet_DTOApiRequestFieldKey = keyof typeof AnnouncementSet_DTOApiRequestFields;

export const AnnouncementFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  AnnouncementId: 'AnnouncementId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  _AnnouncementDetail: '_AnnouncementDetail',
} as const;

export type AnnouncementFieldKey = keyof typeof AnnouncementFields;

export const BannerDetailInfoFields = {
  BannerId: 'BannerId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  URL: 'URL',
  URL_Open: 'URL_Open',
  _BannerDetail: '_BannerDetail',
} as const;

export type BannerDetailInfoFieldKey = keyof typeof BannerDetailInfoFields;

export const BannerDetailFields = {
  BannerId: 'BannerId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  FontColor: 'FontColor',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  Sort: 'Sort',
  _Banner: '_Banner',
  _BannerDetailInfo: '_BannerDetailInfo',
} as const;

export type BannerDetailFieldKey = keyof typeof BannerDetailFields;

export const BannerSetFields = {
  Banner: 'Banner',
  BannerDetail: 'BannerDetail',
  BannerDetailInfo: 'BannerDetailInfo',
} as const;

export type BannerSetFieldKey = keyof typeof BannerSetFields;

export const BannerSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type BannerSet_DTOApiRequestFieldKey = keyof typeof BannerSet_DTOApiRequestFields;

export const BannerFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  BannerId: 'BannerId',
  BannerCategoryName: 'BannerCategoryName',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  _BannerDetail: '_BannerDetail',
} as const;

export type BannerFieldKey = keyof typeof BannerFields;

export const CalendarDetailFields = {
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
  _Calendar: '_Calendar',
} as const;

export type CalendarDetailFieldKey = keyof typeof CalendarDetailFields;

export const CalendarSetFields = {
  Calendar: 'Calendar',
  CalendarDetail: 'CalendarDetail',
} as const;

export type CalendarSetFieldKey = keyof typeof CalendarSetFields;

export const CalendarSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type CalendarSet_DTOApiRequestFieldKey = keyof typeof CalendarSet_DTOApiRequestFields;

export const CalendarFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  Year: 'Year',
  ImportSrc: 'ImportSrc',
  LastImportTime: 'LastImportTime',
  _CalendarDetail: '_CalendarDetail',
} as const;

export type CalendarFieldKey = keyof typeof CalendarFields;

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

export const CategoryDataSetFields = {
  Category: 'Category',
  CategoryDetail: 'CategoryDetail',
} as const;

export type CategoryDataSetFieldKey = keyof typeof CategoryDataSetFields;

export const CategoryDataSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type CategoryDataSet_DTOApiRequestFieldKey = keyof typeof CategoryDataSet_DTOApiRequestFields;

export const CategoryDetailFields = {
  CategoryId: 'CategoryId',
  RowId: 'RowId',
  Lang: 'Lang',
  CategoryName: 'CategoryName',
} as const;

export type CategoryDetailFieldKey = keyof typeof CategoryDetailFields;

export const CategoryFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
  _CategoryDetail: '_CategoryDetail',
  _MatCategoryInfoField: '_MatCategoryInfoField',
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const ChangePasswordFields = {
  OldPassword: 'OldPassword',
  NewPassword: 'NewPassword',
} as const;

export type ChangePasswordFieldKey = keyof typeof ChangePasswordFields;

export const FileArchiveDetailFields = {
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileSrc: 'FileSrc',
  FileSrcId: 'FileSrcId',
  FileName: 'FileName',
} as const;

export type FileArchiveDetailFieldKey = keyof typeof FileArchiveDetailFields;

export const FileArchiveInfoFields = {
  FileArchiveId: 'FileArchiveId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  _FileArchiveDetail: '_FileArchiveDetail',
  _FileArchiveUrlDetail: '_FileArchiveUrlDetail',
} as const;

export type FileArchiveInfoFieldKey = keyof typeof FileArchiveInfoFields;

export const FileArchiveSetFields = {
  FileArchive: 'FileArchive',
  FileArchiveInfo: 'FileArchiveInfo',
  FileArchiveDetail: 'FileArchiveDetail',
  FileArchiveUrlDetail: 'FileArchiveUrlDetail',
} as const;

export type FileArchiveSetFieldKey = keyof typeof FileArchiveSetFields;

export const FileArchiveSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileArchiveSet_DTOApiRequestFieldKey = keyof typeof FileArchiveSet_DTOApiRequestFields;

export const FileArchiveUrlDetailFields = {
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Url: 'Url',
  UrlDescription: 'UrlDescription',
  WindowTarget: 'WindowTarget',
} as const;

export type FileArchiveUrlDetailFieldKey = keyof typeof FileArchiveUrlDetailFields;

export const FileArchiveFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  FileArchiveId: 'FileArchiveId',
  ContentStatus: 'ContentStatus',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
  _FileArchiveInfo: '_FileArchiveInfo',
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileManageModelFields = {
  CreateTime: 'CreateTime',
  CreateUser: 'CreateUser',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUser: 'ModifyUser',
  ModifyUserId: 'ModifyUserId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
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

export type FileManageModelFieldKey = keyof typeof FileManageModelFields;

export const FileManageSetFields = {
  FileManage: 'FileManage',
  FileManage_DownloadRecent: 'FileManage_DownloadRecent',
  FileManage_SyncInfo: 'FileManage_SyncInfo',
} as const;

export type FileManageSetFieldKey = keyof typeof FileManageSetFields;

export const FileManageSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileManageSet_DTOApiRequestFieldKey = keyof typeof FileManageSet_DTOApiRequestFields;

export const FileManage_DownloadRecentModelFields = {
  RowState: 'RowState',
  InternalId: 'InternalId',
  RowId: 'RowId',
  VisitorKey: 'VisitorKey',
  RefererURL: 'RefererURL',
  LastCountTime: 'LastCountTime',
  _FileManage: '_FileManage',
} as const;

export type FileManage_DownloadRecentModelFieldKey = keyof typeof FileManage_DownloadRecentModelFields;

export const FileManage_SyncInfoModelFields = {
  RowState: 'RowState',
  InternalId: 'InternalId',
  RowId: 'RowId',
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
  _FileManage: '_FileManage',
} as const;

export type FileManage_SyncInfoModelFieldKey = keyof typeof FileManage_SyncInfoModelFields;

export const GalleryInfoFields = {
  GalleryId: 'GalleryId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type GalleryInfoFieldKey = keyof typeof GalleryInfoFields;

export const GalleryPhotosInfoFields = {
  GalleryId: 'GalleryId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Description: 'Description',
} as const;

export type GalleryPhotosInfoFieldKey = keyof typeof GalleryPhotosInfoFields;

export const GalleryPhotosFields = {
  GalleryId: 'GalleryId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  Sort: 'Sort',
  GalleryPhotosInfo: 'GalleryPhotosInfo',
} as const;

export type GalleryPhotosFieldKey = keyof typeof GalleryPhotosFields;

export const GallerySetFields = {
  Gallery: 'Gallery',
  GalleryInfo: 'GalleryInfo',
  GalleryPhotos: 'GalleryPhotos',
  GalleryPhotosInfo: 'GalleryPhotosInfo',
} as const;

export type GallerySetFieldKey = keyof typeof GallerySetFields;

export const GallerySet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type GallerySet_DTOApiRequestFieldKey = keyof typeof GallerySet_DTOApiRequestFields;

export const GalleryFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  GalleryId: 'GalleryId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  CoverPicSrcId: 'CoverPicSrcId',
  Validate_Start: 'Validate_Start',
  _GalleryInfo: '_GalleryInfo',
  _GalleryPhotos: '_GalleryPhotos',
} as const;

export type GalleryFieldKey = keyof typeof GalleryFields;

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

export const MatCategoryDataSetFields = {
  Category: 'Category',
  CategoryDetail: 'CategoryDetail',
  MatCategoryInfoField: 'MatCategoryInfoField',
  MatCategoryInfoFieldDisplay: 'MatCategoryInfoFieldDisplay',
} as const;

export type MatCategoryDataSetFieldKey = keyof typeof MatCategoryDataSetFields;

export const MatCategoryDataSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type MatCategoryDataSet_DTOApiRequestFieldKey = keyof typeof MatCategoryDataSet_DTOApiRequestFields;

export const MatCategoryInfoFieldDisplayFields = {
  RowState: 'RowState',
  CategoryId: 'CategoryId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  FieldDisplayName: 'FieldDisplayName',
  _MatCategoryInfoField: '_MatCategoryInfoField',
} as const;

export type MatCategoryInfoFieldDisplayFieldKey = keyof typeof MatCategoryInfoFieldDisplayFields;

export const MatCategoryInfoFieldFields = {
  RowState: 'RowState',
  CategoryId: 'CategoryId',
  RowId: 'RowId',
  Field: 'Field',
  _Category: '_Category',
  _MatCategoryInfoFieldDisplay: '_MatCategoryInfoFieldDisplay',
} as const;

export type MatCategoryInfoFieldFieldKey = keyof typeof MatCategoryInfoFieldFields;

export const MaterialLangInfoFields = {
  MaterialId: 'MaterialId',
  RowId: 'RowId',
  Lang: 'Lang',
  MaterialName: 'MaterialName',
  MaterialInfoJson: 'MaterialInfoJson',
  Memo: 'Memo',
  _Material: '_Material',
} as const;

export type MaterialLangInfoFieldKey = keyof typeof MaterialLangInfoFields;

export const MaterialPictureFields = {
  MaterialId: 'MaterialId',
  RowId: 'RowId',
  Picture: 'Picture',
  PictureId: 'PictureId',
  PictureName: 'PictureName',
  _Material: '_Material',
} as const;

export type MaterialPictureFieldKey = keyof typeof MaterialPictureFields;

export const MaterialSetFields = {
  Material: 'Material',
  MaterialLangInfo: 'MaterialLangInfo',
  MaterialPicture: 'MaterialPicture',
  MaterialTags: 'MaterialTags',
} as const;

export type MaterialSetFieldKey = keyof typeof MaterialSetFields;

export const MaterialSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type MaterialSet_DTOApiRequestFieldKey = keyof typeof MaterialSet_DTOApiRequestFields;

export const MaterialTagsFields = {
  MaterialId: 'MaterialId',
  RowId: 'RowId',
  Tag: 'Tag',
  TagId: 'TagId',
  _Material: '_Material',
} as const;

export type MaterialTagsFieldKey = keyof typeof MaterialTagsFields;

export const MaterialFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  MaterialId: 'MaterialId',
  Category: 'Category',
  CategoryId: 'CategoryId',
  Price: 'Price',
  _MaterialLangInfo: '_MaterialLangInfo',
  _MaterialPicture: '_MaterialPicture',
  _MaterialTags: '_MaterialTags',
} as const;

export type MaterialFieldKey = keyof typeof MaterialFields;

export const OrderBySpecFields = {
  Col: 'Col',
  Desc: 'Desc',
} as const;

export type OrderBySpecFieldKey = keyof typeof OrderBySpecFields;

export const PageManagementDetailFields = {
  PageId: 'PageId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type PageManagementDetailFieldKey = keyof typeof PageManagementDetailFields;

export const PageManagementSetFields = {
  PageManagement: 'PageManagement',
  PageManagementDetail: 'PageManagementDetail',
} as const;

export type PageManagementSetFieldKey = keyof typeof PageManagementSetFields;

export const PageManagementSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type PageManagementSet_DTOApiRequestFieldKey = keyof typeof PageManagementSet_DTOApiRequestFields;

export const PageManagementFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  PageId: 'PageId',
  ProgId: 'ProgId',
  CategoryId: 'CategoryId',
  _PageManagementDetail: '_PageManagementDetail',
} as const;

export type PageManagementFieldKey = keyof typeof PageManagementFields;

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

export const PersonModelFields = {
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
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  PersonId: 'PersonId',
  PersonName: 'PersonName',
  PersonImg: 'PersonImg',
  PersonImgId: 'PersonImgId',
  Gender: 'Gender',
  Email: 'Email',
  MobilePhone: 'MobilePhone',
  HomePhone: 'HomePhone',
} as const;

export type PersonModelFieldKey = keyof typeof PersonModelFields;

export const PersonSetFields = {
  Person: 'Person',
} as const;

export type PersonSetFieldKey = keyof typeof PersonSetFields;

export const PersonSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type PersonSet_DTOApiRequestFieldKey = keyof typeof PersonSet_DTOApiRequestFields;

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

export const RoleDataModelFields = {
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
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  RoleId: 'RoleId',
  RoleName: 'RoleName',
  IsAdmin: 'IsAdmin',
  _RolePermission: '_RolePermission',
} as const;

export type RoleDataModelFieldKey = keyof typeof RoleDataModelFields;

export const RolePermissionModelFields = {
  RowState: 'RowState',
  RoleId: 'RoleId',
  RowId: 'RowId',
  PermissionKey: 'PermissionKey',
  GrantMask: 'GrantMask',
  _RoleData: '_RoleData',
} as const;

export type RolePermissionModelFieldKey = keyof typeof RolePermissionModelFields;

export const RolePermissionSetFields = {
  RoleData: 'RoleData',
  RolePermission: 'RolePermission',
} as const;

export type RolePermissionSetFieldKey = keyof typeof RolePermissionSetFields;

export const RolePermissionSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type RolePermissionSet_DTOApiRequestFieldKey = keyof typeof RolePermissionSet_DTOApiRequestFields;

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

export const SiteMenuSetFields = {
  SiteMenu_Index: 'SiteMenu_Index',
  SiteMenu_IndexInfo: 'SiteMenu_IndexInfo',
  SiteMenu_Item: 'SiteMenu_Item',
  SiteMenu_Item_Title: 'SiteMenu_Item_Title',
  SiteMenu_Item_Url: 'SiteMenu_Item_Url',
  SiteMenu_Item_Module: 'SiteMenu_Item_Module',
} as const;

export type SiteMenuSetFieldKey = keyof typeof SiteMenuSetFields;

export const SiteMenuSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SiteMenuSet_DTOApiRequestFieldKey = keyof typeof SiteMenuSet_DTOApiRequestFields;

export const SiteMenu_IndexInfoFields = {
  SiteIndex: 'SiteIndex',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Description: 'Description',
  BannerId: 'BannerId',
  SiteHeader: 'SiteHeader',
  SiteFooter: 'SiteFooter',
  Keyword: 'Keyword',
  _SiteMenu_Index: '_SiteMenu_Index',
} as const;

export type SiteMenu_IndexInfoFieldKey = keyof typeof SiteMenu_IndexInfoFields;

export const SiteMenu_IndexFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  SiteIndex: 'SiteIndex',
  GoogleAnalytics: 'GoogleAnalytics',
  Enable: 'Enable',
  DefaultLang: 'DefaultLang',
  SupportLangs: 'SupportLangs',
  _SiteMenu_IndexInfo: '_SiteMenu_IndexInfo',
  _SiteMenu_Item: '_SiteMenu_Item',
} as const;

export type SiteMenu_IndexFieldKey = keyof typeof SiteMenu_IndexFields;

export const SiteMenu_ItemFields = {
  SiteIndex: 'SiteIndex',
  RowId: 'RowId',
  ParentRowId: 'ParentRowId',
  ItemSiteUrl: 'ItemSiteUrl',
  FullUrl: 'FullUrl',
  Level: 'Level',
  DisplayOrder: 'DisplayOrder',
  ItemType: 'ItemType',
  WindowTarget: 'WindowTarget',
  _SiteMenu_Index: '_SiteMenu_Index',
  _SiteMenu_Item_Title: '_SiteMenu_Item_Title',
  _SiteMenu_Item_Url: '_SiteMenu_Item_Url',
  _SiteMenu_Item_Module: '_SiteMenu_Item_Module',
} as const;

export type SiteMenu_ItemFieldKey = keyof typeof SiteMenu_ItemFields;

export const SiteMenu_Item_ModuleFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  BannerId: 'BannerId',
  PageType: 'PageType',
  ModuleProgId: 'ModuleProgId',
  ModuleOptions: 'ModuleOptions',
  _SiteMenu_Index: '_SiteMenu_Index',
} as const;

export type SiteMenu_Item_ModuleFieldKey = keyof typeof SiteMenu_Item_ModuleFields;

export const SiteMenu_Item_TitleFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  IsShowOnMenu: 'IsShowOnMenu',
  _SiteMenu_Index: '_SiteMenu_Index',
} as const;

export type SiteMenu_Item_TitleFieldKey = keyof typeof SiteMenu_Item_TitleFields;

export const SiteMenu_Item_UrlFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  RedirectType: 'RedirectType',
  RedirectUrl: 'RedirectUrl',
  _SiteMenu_Index: '_SiteMenu_Index',
} as const;

export type SiteMenu_Item_UrlFieldKey = keyof typeof SiteMenu_Item_UrlFields;

export const SiteViewCountDetailModelFields = {
  RowState: 'RowState',
  SiteMenu_Index: 'SiteMenu_Index',
  SiteIndex: 'SiteIndex',
  ProgId: 'ProgId',
  TargetInternalId: 'TargetInternalId',
  PageViewCount: 'PageViewCount',
  FilePreviewCount: 'FilePreviewCount',
  FileDownloadCount: 'FileDownloadCount',
  LinkClickCount: 'LinkClickCount',
  _SiteViewCountHeader: '_SiteViewCountHeader',
} as const;

export type SiteViewCountDetailModelFieldKey = keyof typeof SiteViewCountDetailModelFields;

export const SiteViewCountHeaderModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  SiteMenu_Index: 'SiteMenu_Index',
  SiteIndex: 'SiteIndex',
  PublicViewCount: 'PublicViewCount',
  _SiteViewCountDetail: '_SiteViewCountDetail',
} as const;

export type SiteViewCountHeaderModelFieldKey = keyof typeof SiteViewCountHeaderModelFields;

export const SiteViewCountRecentlyModelFields = {
  RowState: 'RowState',
  SiteMenu_Index: 'SiteMenu_Index',
  SiteIndex: 'SiteIndex',
  ProgId: 'ProgId',
  TargetInternalId: 'TargetInternalId',
  TargetType: 'TargetType',
  ActionType: 'ActionType',
  VisitorKey: 'VisitorKey',
  LastViewTime: 'LastViewTime',
  RefererUrl: 'RefererUrl',
} as const;

export type SiteViewCountRecentlyModelFieldKey = keyof typeof SiteViewCountRecentlyModelFields;

export const SiteViewCountSetFields = {
  SiteViewCountHeader: 'SiteViewCountHeader',
  SiteViewCountDetail: 'SiteViewCountDetail',
  SiteViewCountRecently: 'SiteViewCountRecently',
} as const;

export type SiteViewCountSetFieldKey = keyof typeof SiteViewCountSetFields;

export const SiteViewCountSet_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type SiteViewCountSet_DTOApiResponseFieldKey = keyof typeof SiteViewCountSet_DTOApiResponseFields;

export const SpecHomePage1821ModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  HomePageId: 'HomePageId',
  Lang: 'Lang',
  Section3Title: 'Section3Title',
  Section3SubTitle: 'Section3SubTitle',
  Card1Title: 'Card1Title',
  Card1Pic: 'Card1Pic',
  Card1PicId: 'Card1PicId',
  Card2Title: 'Card2Title',
  Card2Pic: 'Card2Pic',
  Card2PicId: 'Card2PicId',
  Section4Title: 'Section4Title',
  Section4SubTitle: 'Section4SubTitle',
  LinkOptions: 'LinkOptions',
  LinkViewMore: 'LinkViewMore',
  _SpecHomePage1821_Banner: '_SpecHomePage1821_Banner',
  _SpecHomePage1821_Shortcut: '_SpecHomePage1821_Shortcut',
} as const;

export type SpecHomePage1821ModelFieldKey = keyof typeof SpecHomePage1821ModelFields;

export const SpecHomePage1821SetFields = {
  SpecHomePage1821: 'SpecHomePage1821',
  SpecHomePage1821_Banner: 'SpecHomePage1821_Banner',
  SpecHomePage1821_Shortcut: 'SpecHomePage1821_Shortcut',
  SpecHomePage1821_ShortcutModuleItem: 'SpecHomePage1821_ShortcutModuleItem',
} as const;

export type SpecHomePage1821SetFieldKey = keyof typeof SpecHomePage1821SetFields;

export const SpecHomePage1821Set_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecHomePage1821Set_DTOApiRequestFieldKey = keyof typeof SpecHomePage1821Set_DTOApiRequestFields;

export const SpecHomePage1821_BannerFields = {
  RowState: 'RowState',
  HomePageId: 'HomePageId',
  RowId: 'RowId',
  RowNo: 'RowNo',
  Title: 'Title',
  SubTitle: 'SubTitle',
  BannerFile: 'BannerFile',
  BannerFileId: 'BannerFileId',
  BannerFileDescription: 'BannerFileDescription',
  Link: 'Link',
  _SpecHomePage1821: '_SpecHomePage1821',
} as const;

export type SpecHomePage1821_BannerFieldKey = keyof typeof SpecHomePage1821_BannerFields;

export const SpecHomePage1821_ShortcutModuleItemFields = {
  RowState: 'RowState',
  HomePageId: 'HomePageId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  RowNo: 'RowNo',
  Title: 'Title',
  SubTitle: 'SubTitle',
  ModuleType: 'ModuleType',
  ModuleOptions: 'ModuleOptions',
  MoreViewLink: 'MoreViewLink',
  _SpecHomePage1821_Shortcut: '_SpecHomePage1821_Shortcut',
} as const;

export type SpecHomePage1821_ShortcutModuleItemFieldKey = keyof typeof SpecHomePage1821_ShortcutModuleItemFields;

export const SpecHomePage1821_ShortcutFields = {
  RowState: 'RowState',
  HomePageId: 'HomePageId',
  RowId: 'RowId',
  RowNo: 'RowNo',
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
  _SpecHomePage1821: '_SpecHomePage1821',
  _SpecHomePage1821_ShortcutModuleItem: '_SpecHomePage1821_ShortcutModuleItem',
} as const;

export type SpecHomePage1821_ShortcutFieldKey = keyof typeof SpecHomePage1821_ShortcutFields;

export const StringApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type StringApiResponseFieldKey = keyof typeof StringApiResponseFields;

export const SurveyItemLangFields = {
  SurveyId: 'SurveyId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  FieldName: 'FieldName',
  _SurveyItem: '_SurveyItem',
} as const;

export type SurveyItemLangFieldKey = keyof typeof SurveyItemLangFields;

export const SurveyItemFields = {
  SurveyId: 'SurveyId',
  RowId: 'RowId',
  FieldId: 'FieldId',
  IsRequired: 'IsRequired',
  InputType: 'InputType',
  Options: 'Options',
  _Survey: '_Survey',
  _SurveyItemLang: '_SurveyItemLang',
} as const;

export type SurveyItemFieldKey = keyof typeof SurveyItemFields;

export const SurveySetFields = {
  Survey: 'Survey',
  SurveyItem: 'SurveyItem',
  SurveyItemLang: 'SurveyItemLang',
} as const;

export type SurveySetFieldKey = keyof typeof SurveySetFields;

export const SurveySet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SurveySet_DTOApiRequestFieldKey = keyof typeof SurveySet_DTOApiRequestFields;

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

export const SurveySubmissionsSetFields = {
  SurveySubmissions: 'SurveySubmissions',
} as const;

export type SurveySubmissionsSetFieldKey = keyof typeof SurveySubmissionsSetFields;

export const SurveySubmissionsSet_DTOApiResponseFields = {
  IsSuccess: 'IsSuccess',
  SysMessage: 'SysMessage',
  Data: 'Data',
} as const;

export type SurveySubmissionsSet_DTOApiResponseFieldKey = keyof typeof SurveySubmissionsSet_DTOApiResponseFields;

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

export const SurveyFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  SurveyId: 'SurveyId',
  SurveyName: 'SurveyName',
  SurveyDescription: 'SurveyDescription',
  SurveySuccessContent: 'SurveySuccessContent',
  _SurveyItem: '_SurveyItem',
} as const;

export type SurveyFieldKey = keyof typeof SurveyFields;

export const SysMessageModelFields = {
  Status: 'Status',
  MessageCode: 'MessageCode',
  Message: 'Message',
} as const;

export type SysMessageModelFieldKey = keyof typeof SysMessageModelFields;

export const TagDataFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  TagId: 'TagId',
  ProgId: 'ProgId',
  _TagDetail: '_TagDetail',
} as const;

export type TagDataFieldKey = keyof typeof TagDataFields;

export const TagDetailFields = {
  TagId: 'TagId',
  RowId: 'RowId',
  Lang: 'Lang',
  TagName: 'TagName',
} as const;

export type TagDetailFieldKey = keyof typeof TagDetailFields;

export const TagSetFields = {
  TagData: 'TagData',
  TagDetail: 'TagDetail',
} as const;

export type TagSetFieldKey = keyof typeof TagSetFields;

export const TagSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type TagSet_DTOApiRequestFieldKey = keyof typeof TagSet_DTOApiRequestFields;

export const TimelineItemFields = {
  TimelineId: 'TimelineId',
  RowId: 'RowId',
  Date: 'Date',
  _Timeline: '_Timeline',
  _TimelineLangDetail: '_TimelineLangDetail',
} as const;

export type TimelineItemFieldKey = keyof typeof TimelineItemFields;

export const TimelineLangDetailFields = {
  TimelineId: 'TimelineId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  _TimelineItem: '_TimelineItem',
} as const;

export type TimelineLangDetailFieldKey = keyof typeof TimelineLangDetailFields;

export const TimelineSetFields = {
  Timeline: 'Timeline',
  TimelineItem: 'TimelineItem',
  TimelineLangDetail: 'TimelineLangDetail',
} as const;

export type TimelineSetFieldKey = keyof typeof TimelineSetFields;

export const TimelineSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type TimelineSet_DTOApiRequestFieldKey = keyof typeof TimelineSet_DTOApiRequestFields;

export const TimelineFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  TimelineId: 'TimelineId',
  TimelineName: 'TimelineName',
  _TimelineItem: '_TimelineItem',
} as const;

export type TimelineFieldKey = keyof typeof TimelineFields;

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

export const WebResourceInfoFields = {
  WebResourceId: 'WebResourceId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  ResUrl: 'ResUrl',
  Url_OpenType: 'Url_OpenType',
} as const;

export type WebResourceInfoFieldKey = keyof typeof WebResourceInfoFields;

export const WebResourceSetFields = {
  WebResource: 'WebResource',
  WebResourceInfo: 'WebResourceInfo',
} as const;

export type WebResourceSetFieldKey = keyof typeof WebResourceSetFields;

export const WebResourceSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type WebResourceSet_DTOApiRequestFieldKey = keyof typeof WebResourceSet_DTOApiRequestFields;

export const WebResourceFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  CreateUser: 'CreateUser',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  ModifyUser: 'ModifyUser',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  WebResourceId: 'WebResourceId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PicId: 'PicId',
  PicDescription: 'PicDescription',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  _WebResourceInfo: '_WebResourceInfo',
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

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
