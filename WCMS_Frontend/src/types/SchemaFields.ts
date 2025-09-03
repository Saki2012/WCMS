// ✅ 自動產生，請勿手動修改

export const AccountStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type AccountStatusFieldKey = keyof typeof AccountStatusFields;

export const AnnouncementDetailFileFields = {
  AnnouncementId: 'AnnouncementId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileId: 'FileId',
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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  AnnouncementId: 'AnnouncementId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  ViewCount: 'ViewCount',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  BannerId: 'BannerId',
  BannerCategoryName: 'BannerCategoryName',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  Effect: 'Effect',
} as const;

export type BannerFieldKey = keyof typeof BannerFields;

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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const ContentStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type ContentStatusFieldKey = keyof typeof ContentStatusFields;

export const CreateUserDtoFields = {
  UserId: 'UserId',
  UserName: 'UserName',
  Password: 'Password',
  Email: 'Email',
} as const;

export type CreateUserDtoFieldKey = keyof typeof CreateUserDtoFields;

export const DataStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type DataStatusFieldKey = keyof typeof DataStatusFields;

export const EndTypeFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type EndTypeFieldKey = keyof typeof EndTypeFields;

export const FileArchiveDetailFields = {
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileSrcId: 'FileSrcId',
  FileName: 'FileName',
} as const;

export type FileArchiveDetailFieldKey = keyof typeof FileArchiveDetailFields;

export const FileArchiveInfoFields = {
  FileArchiveId: 'FileArchiveId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  FileArchiveDetail: 'FileArchiveDetail',
} as const;

export type FileArchiveInfoFieldKey = keyof typeof FileArchiveInfoFields;

export const FileArchiveSetFields = {
  FileArchive: 'FileArchive',
  FileArchiveInfo: 'FileArchiveInfo',
  FileArchiveDetail: 'FileArchiveDetail',
} as const;

export type FileArchiveSetFieldKey = keyof typeof FileArchiveSetFields;

export const FileArchiveSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileArchiveSet_DTOApiRequestFieldKey = keyof typeof FileArchiveSet_DTOApiRequestFields;

export const FileArchiveFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  FileArchiveId: 'FileArchiveId',
  ContentStatus: 'ContentStatus',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
  FileArchiveInfo: 'FileArchiveInfo',
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileManageModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
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
  DownloadCount: 'DownloadCount',
} as const;

export type FileManageModelFieldKey = keyof typeof FileManageModelFields;

export const FileManageSetFields = {
  FileManage: 'FileManage',
  FileManage_DownloadInfo: 'FileManage_DownloadInfo',
  FileManage_SyncInfo: 'FileManage_SyncInfo',
} as const;

export type FileManageSetFieldKey = keyof typeof FileManageSetFields;

export const FileManageSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileManageSet_DTOApiRequestFieldKey = keyof typeof FileManageSet_DTOApiRequestFields;

export const FileManage_DownloadInfoModelFields = {
  InternalId: 'InternalId',
  RowId: 'RowId',
  DownloadUserIP: 'DownloadUserIP',
  UserAgent: 'UserAgent',
  RefererURL: 'RefererURL',
  DownloadStatus: 'DownloadStatus',
  DownloadTime: 'DownloadTime',
} as const;

export type FileManage_DownloadInfoModelFieldKey = keyof typeof FileManage_DownloadInfoModelFields;

export const FileManage_SyncInfoModelFields = {
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
} as const;

export type FileManage_SyncInfoModelFieldKey = keyof typeof FileManage_SyncInfoModelFields;

export const FileStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type FileStatusFieldKey = keyof typeof FileStatusFields;

export const FormStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type FormStatusFieldKey = keyof typeof FormStatusFields;

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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  GalleryId: 'GalleryId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  CoverPicSrcId: 'CoverPicSrcId',
  Sort: 'Sort',
  GalleryInfo: 'GalleryInfo',
  GalleryPhotos: 'GalleryPhotos',
} as const;

export type GalleryFieldKey = keyof typeof GalleryFields;

export const LoginDtoFields = {
  Account: 'Account',
  Password: 'Password',
} as const;

export type LoginDtoFieldKey = keyof typeof LoginDtoFields;

export const MenuUrlTypeFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type MenuUrlTypeFieldKey = keyof typeof MenuUrlTypeFields;

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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  PageId: 'PageId',
  CategoryId: 'CategoryId',
  ViewCount: 'ViewCount',
} as const;

export type PageManagementFieldKey = keyof typeof PageManagementFields;

export const PermissionModelFields = {
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
  InvalidUser: 'InvalidUser',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  UserId: 'UserId',
  RoleId: 'RoleId',
  User: 'User',
  Role: 'Role',
} as const;

export type PermissionModelFieldKey = keyof typeof PermissionModelFields;

export const QueryListParamFields = {
  Fields: 'Fields',
  Condition: 'Condition',
  OrderBy: 'OrderBy',
  PageNumber: 'PageNumber',
  PageSize: 'PageSize',
} as const;

export type QueryListParamFieldKey = keyof typeof QueryListParamFields;

export const RoleModelFields = {
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
  InvalidUser: 'InvalidUser',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  RoleId: 'RoleId',
  RoleName: 'RoleName',
  EndType: 'EndType',
  IsAdmin: 'IsAdmin',
  UserRoles: 'UserRoles',
} as const;

export type RoleModelFieldKey = keyof typeof RoleModelFields;

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
  SiteHeader: 'SiteHeader',
  SiteFooter: 'SiteFooter',
  Keyword: 'Keyword',
} as const;

export type SiteMenu_IndexInfoFieldKey = keyof typeof SiteMenu_IndexInfoFields;

export const SiteMenu_IndexFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  SiteIndex: 'SiteIndex',
  GoogleAnalytics: 'GoogleAnalytics',
  Enable: 'Enable',
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
  IsShowOnMenu: 'IsShowOnMenu',
} as const;

export type SiteMenu_ItemFieldKey = keyof typeof SiteMenu_ItemFields;

export const SiteMenu_Item_ModuleFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  BannerId: 'BannerId',
  ModuleProgId: 'ModuleProgId',
  ModuleOptions: 'ModuleOptions',
} as const;

export type SiteMenu_Item_ModuleFieldKey = keyof typeof SiteMenu_Item_ModuleFields;

export const SiteMenu_Item_TitleFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
} as const;

export type SiteMenu_Item_TitleFieldKey = keyof typeof SiteMenu_Item_TitleFields;

export const SiteMenu_Item_UrlFields = {
  SiteIndex: 'SiteIndex',
  ItemRowId: 'ItemRowId',
  RedirectType: 'RedirectType',
  RedirectUrl: 'RedirectUrl',
} as const;

export type SiteMenu_Item_UrlFieldKey = keyof typeof SiteMenu_Item_UrlFields;

export const SpecCategoryDetailModelFields = {
  CategoryId: 'CategoryId',
  RowId: 'RowId',
  Lang: 'Lang',
  CategoryName: 'CategoryName',
} as const;

export type SpecCategoryDetailModelFieldKey = keyof typeof SpecCategoryDetailModelFields;

export const SpecCategoryModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
  ShowColumnItems: 'ShowColumnItems',
} as const;

export type SpecCategoryModelFieldKey = keyof typeof SpecCategoryModelFields;

export const SpecCategorySetFields = {
  SpecCategory: 'SpecCategory',
  SpecCategoryDetail: 'SpecCategoryDetail',
} as const;

export type SpecCategorySetFieldKey = keyof typeof SpecCategorySetFields;

export const SpecCategorySet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecCategorySet_DTOApiRequestFieldKey = keyof typeof SpecCategorySet_DTOApiRequestFields;

export const SpecResearchDetailModelFields = {
  ResearchId: 'ResearchId',
  RowId: 'RowId',
  Lang: 'Lang',
  Year: 'Year',
  AcademicYear: 'AcademicYear',
  Semester: 'Semester',
  DuringExecution: 'DuringExecution',
  ContractPeriod: 'ContractPeriod',
  ClassTime: 'ClassTime',
  ProjectLeader: 'ProjectLeader',
  Name: 'Name',
  TeachingStaffOfOurSchool: 'TeachingStaffOfOurSchool',
  ApprovalNumber: 'ApprovalNumber',
  ApprovedAmount: 'ApprovedAmount',
  College: 'College',
  Department: 'Department',
  GraduationDegree: 'GraduationDegree',
  CooperatingUnits: 'CooperatingUnits',
  CooperationProject: 'CooperationProject',
  Courses: 'Courses',
  ProjectName: 'ProjectName',
  PaperTitle: 'PaperTitle',
  Remark: 'Remark',
  Cohost1: 'Cohost1',
  Cohost2: 'Cohost2',
  Commissioned: 'Commissioned',
  PlanAmount: 'PlanAmount',
  PlanContent: 'PlanContent',
} as const;

export type SpecResearchDetailModelFieldKey = keyof typeof SpecResearchDetailModelFields;

export const SpecResearchModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  ResearchId: 'ResearchId',
  CategoryId: 'CategoryId',
  ContentStatus: 'ContentStatus',
  Tags: 'Tags',
  SpecResearchDetail: 'SpecResearchDetail',
} as const;

export type SpecResearchModelFieldKey = keyof typeof SpecResearchModelFields;

export const SpecResearchSetFields = {
  SpecResearch: 'SpecResearch',
  SpecResearchDetail: 'SpecResearchDetail',
} as const;

export type SpecResearchSetFieldKey = keyof typeof SpecResearchSetFields;

export const SpecResearchSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecResearchSet_DTOApiRequestFieldKey = keyof typeof SpecResearchSet_DTOApiRequestFields;

export const SpecUSRDetailFields = {
  USRId: 'USRId',
  RowId: 'RowId',
  Lang: 'Lang',
  Year: 'Year',
  AcademicYear: 'AcademicYear',
  Courses: 'Courses',
  PracticeField: 'PracticeField',
  ProjectName: 'ProjectName',
  ExternalCooperationUnit: 'ExternalCooperationUnit',
  Department: 'Department',
  DuringExecution: 'DuringExecution',
  PlanAmount: 'PlanAmount',
  ExecutionStrategy: 'ExecutionStrategy',
  ContentIntroduction: 'ContentIntroduction',
  ProjectConcept: 'ProjectConcept',
  ProjectHighlights: 'ProjectHighlights',
  ProjectLeader: 'ProjectLeader',
  Cohost1: 'Cohost1',
  Cohost2: 'Cohost2',
  Commissioned: 'Commissioned',
  Remark: 'Remark',
} as const;

export type SpecUSRDetailFieldKey = keyof typeof SpecUSRDetailFields;

export const SpecUSRModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  USRId: 'USRId',
  CategoryId: 'CategoryId',
  ContentStatus: 'ContentStatus',
  Tags: 'Tags',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  SpecUSRDetail: 'SpecUSRDetail',
} as const;

export type SpecUSRModelFieldKey = keyof typeof SpecUSRModelFields;

export const SpecUSRSetFields = {
  SpecUSR: 'SpecUSR',
  SpecUSRDetail: 'SpecUSRDetail',
} as const;

export type SpecUSRSetFieldKey = keyof typeof SpecUSRSetFields;

export const SpecUSRSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecUSRSet_DTOApiRequestFieldKey = keyof typeof SpecUSRSet_DTOApiRequestFields;

export const TagDataFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  TagId: 'TagId',
  ProgId: 'ProgId',
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

export const UserModelFields = {
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
  InvalidUser: 'InvalidUser',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  UserId: 'UserId',
  UserName: 'UserName',
  Email: 'Email',
  PasswordHash: 'PasswordHash',
  PasswordSalt: 'PasswordSalt',
  PasswordAlgoVer: 'PasswordAlgoVer',
  AccountStatus: 'AccountStatus',
  UserRoles: 'UserRoles',
} as const;

export type UserModelFieldKey = keyof typeof UserModelFields;

export const UserSetFields = {
  User: 'User',
} as const;

export type UserSetFieldKey = keyof typeof UserSetFields;

export const UserSet_DTOApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type UserSet_DTOApiRequestFieldKey = keyof typeof UserSet_DTOApiRequestFields;

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
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  WebResourceId: 'WebResourceId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PicId: 'PicId',
  PicDescription: 'PicDescription',
  WebResourceInfo: 'WebResourceInfo',
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

export const WindowTargetFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type WindowTargetFieldKey = keyof typeof WindowTargetFields;

