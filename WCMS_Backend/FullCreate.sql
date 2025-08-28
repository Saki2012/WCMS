IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Announcement] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NULL,
    [Tags] nvarchar(max) NULL,
    [ContentStatus] tinyint NOT NULL,
    [PictureId] nvarchar(max) NULL,
    [PicDescription] nvarchar(max) NULL,
    [ViewCount] int NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Announcement] PRIMARY KEY ([AnnouncementId])
);

CREATE TABLE [AnnouncementDetailFile] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [FileId] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_AnnouncementDetailFile] PRIMARY KEY ([AnnouncementId], [ParentRowId], [RowId])
);

CREATE TABLE [Banner] (
    [BannerId] nvarchar(450) NOT NULL,
    [BannerCategoryName] nvarchar(max) NOT NULL,
    [Interval] smallint NOT NULL,
    [Speed] smallint NOT NULL,
    [Height] smallint NOT NULL,
    [Width] smallint NOT NULL,
    [Effect] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Banner] PRIMARY KEY ([BannerId])
);

CREATE TABLE [BannerDetail] (
    [BannerId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [FontColor] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2(0) NOT NULL,
    [Validate_End] datetime2(0) NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_BannerDetail] PRIMARY KEY ([BannerId], [RowId])
);

CREATE TABLE [BannerDetailInfo] (
    [BannerId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [URL] nvarchar(max) NOT NULL,
    [URL_Open] tinyint NOT NULL,
    CONSTRAINT [PK_BannerDetailInfo] PRIMARY KEY ([BannerId], [ParentRowId], [RowId])
);

CREATE TABLE [Category] (
    [CategoryId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Category] PRIMARY KEY ([CategoryId])
);

CREATE TABLE [DataChangeLog] (
    [DataChangeId] bigint NOT NULL IDENTITY,
    [UserId] nvarchar(max) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(max) NOT NULL,
    [DataChangeTime] datetime2(0) NOT NULL,
    CONSTRAINT [PK_DataChangeLog] PRIMARY KEY ([DataChangeId])
);

CREATE TABLE [FileArchive] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [CategoriesId] nvarchar(max) NOT NULL,
    [TagsId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_FileArchive] PRIMARY KEY ([FileArchiveId])
);

CREATE TABLE [FileManage] (
    [InternalId] nvarchar(450) NOT NULL,
    [Path] nvarchar(max) NOT NULL,
    [FileName] nvarchar(255) NOT NULL,
    [FileExtension] nvarchar(15) NOT NULL,
    [FileDescription] nvarchar(max) NOT NULL,
    [MimeType] nvarchar(max) NOT NULL,
    [FileSHA256] nvarchar(64) NOT NULL,
    [FileSize] bigint NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [ImportLabel] nvarchar(max) NOT NULL,
    [FileStatus] tinyint NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_FileManage] PRIMARY KEY ([InternalId])
);

CREATE TABLE [Gallery] (
    [GalleryId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [CoverPicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Gallery] PRIMARY KEY ([GalleryId])
);

CREATE TABLE [GalleryInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryInfo] PRIMARY KEY ([GalleryId], [RowId])
);

CREATE TABLE [GalleryPhotos] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_GalleryPhotos] PRIMARY KEY ([GalleryId], [RowId])
);

CREATE TABLE [GalleryPhotosInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryPhotosInfo] PRIMARY KEY ([GalleryId], [ParentRowId], [RowId])
);

CREATE TABLE [OperateLog] (
    [Id] bigint NOT NULL IDENTITY,
    [UserId] nvarchar(max) NOT NULL,
    [IP] nvarchar(max) NOT NULL,
    [Browser] nvarchar(max) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [PK] nvarchar(max) NOT NULL,
    [OperateTime] datetime2(0) NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [Memo] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_OperateLog] PRIMARY KEY ([Id])
);

CREATE TABLE [PageManagement] (
    [PageId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NULL,
    [ViewCount] int NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    CONSTRAINT [PK_PageManagement] PRIMARY KEY ([PageId])
);

CREATE TABLE [Role] (
    [RoleId] nvarchar(450) NOT NULL,
    [RoleName] nvarchar(max) NOT NULL,
    [EndType] tinyint NOT NULL,
    [IsAdmin] bit NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Role] PRIMARY KEY ([RoleId])
);

CREATE TABLE [SiteMenu_Index] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [GoogleAnalytics] nvarchar(max) NOT NULL,
    [Enable] bit NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SiteMenu_Index] PRIMARY KEY ([SiteIndex])
);

CREATE TABLE [SiteMenu_IndexInfo] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [SiteHeader] nvarchar(max) NULL,
    [SiteFooter] nvarchar(max) NULL,
    [Keyword] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SiteMenu_IndexInfo] PRIMARY KEY ([SiteIndex], [RowId])
);

CREATE TABLE [SiteMenu_Item] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [ParentRowId] int NULL,
    [ItemSiteUrl] nvarchar(max) NULL,
    [FullUrl] nvarchar(450) NULL,
    [Level] tinyint NOT NULL,
    [DisplayOrder] tinyint NOT NULL,
    [ItemType] tinyint NOT NULL,
    [WindowTarget] tinyint NOT NULL,
    [IsShowOnMenu] bit NOT NULL,
    CONSTRAINT [PK_SiteMenu_Item] PRIMARY KEY ([SiteIndex], [RowId])
);

CREATE TABLE [SiteMenu_Item_Module] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [BannerId] nvarchar(max) NULL,
    [ModuleProgId] nvarchar(max) NULL,
    [ModuleOptions] nvarchar(max) NULL,
    CONSTRAINT [PK_SiteMenu_Item_Module] PRIMARY KEY ([SiteIndex], [ItemRowId])
);

CREATE TABLE [SiteMenu_Item_Title] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SiteMenu_Item_Title] PRIMARY KEY ([SiteIndex], [ItemRowId], [RowId])
);

CREATE TABLE [SiteMenu_Item_Url] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [RedirectType] tinyint NOT NULL,
    [RedirectUrl] nvarchar(max) NULL,
    CONSTRAINT [PK_SiteMenu_Item_Url] PRIMARY KEY ([SiteIndex], [ItemRowId])
);

CREATE TABLE [SpecCategory] (
    [CategoryId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [ShowColumnItems] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecCategory] PRIMARY KEY ([CategoryId])
);

CREATE TABLE [SpecCategoryDetail] (
    [CategoryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [CategoryName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SpecCategoryDetail] PRIMARY KEY ([CategoryId], [RowId])
);

CREATE TABLE [SpecResearch] (
    [ResearchId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [Tags] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecResearch] PRIMARY KEY ([ResearchId])
);

CREATE TABLE [SpecResearchDetail] (
    [ResearchId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(5) NOT NULL,
    [Year] nvarchar(10) NULL,
    [AcademicYear] nvarchar(10) NULL,
    [Semester] nvarchar(10) NULL,
    [DuringExecution] nvarchar(200) NULL,
    [ContractPeriod] nvarchar(200) NULL,
    [ClassTime] nvarchar(200) NULL,
    [ProjectLeader] nvarchar(200) NULL,
    [Name] nvarchar(200) NULL,
    [TeachingStaffOfOurSchool] nvarchar(200) NULL,
    [ApprovalNumber] nvarchar(200) NULL,
    [ApprovedAmount] nvarchar(200) NULL,
    [College] nvarchar(200) NULL,
    [Department] nvarchar(200) NULL,
    [GraduationDegree] nvarchar(200) NULL,
    [CooperatingUnits] nvarchar(200) NULL,
    [CooperationProject] nvarchar(200) NULL,
    [Courses] nvarchar(200) NULL,
    [ProjectName] nvarchar(max) NULL,
    [PaperTitle] nvarchar(200) NULL,
    [Remark] nvarchar(max) NULL,
    [Cohost1] nvarchar(200) NULL,
    [Cohost2] nvarchar(200) NULL,
    [Commissioned] nvarchar(200) NULL,
    [PlanAmount] nvarchar(200) NULL,
    [PlanContent] nvarchar(max) NULL,
    CONSTRAINT [PK_SpecResearchDetail] PRIMARY KEY ([ResearchId], [RowId])
);

CREATE TABLE [SpecUSR] (
    [USRId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [Tags] nvarchar(max) NULL,
    [PictureId] nvarchar(max) NULL,
    [PicDescription] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecUSR] PRIMARY KEY ([USRId])
);

CREATE TABLE [SpecUSRDetail] (
    [USRId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(5) NOT NULL,
    [Year] nvarchar(10) NULL,
    [AcademicYear] nvarchar(10) NULL,
    [Courses] nvarchar(200) NULL,
    [PracticeField] nvarchar(200) NULL,
    [ProjectName] nvarchar(200) NULL,
    [ExternalCooperationUnit] nvarchar(200) NULL,
    [Department] nvarchar(200) NULL,
    [DuringExecution] nvarchar(200) NULL,
    [PlanAmount] nvarchar(200) NULL,
    [ExecutionStrategy] nvarchar(max) NULL,
    [ContentIntroduction] nvarchar(max) NULL,
    [ProjectConcept] nvarchar(max) NULL,
    [ProjectHighlights] nvarchar(max) NULL,
    [ProjectLeader] nvarchar(200) NULL,
    [Cohost1] nvarchar(200) NULL,
    [Cohost2] nvarchar(200) NULL,
    [Commissioned] nvarchar(200) NULL,
    [Remark] nvarchar(max) NULL,
    CONSTRAINT [PK_SpecUSRDetail] PRIMARY KEY ([USRId], [RowId])
);

CREATE TABLE [TagData] (
    [TagId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_TagData] PRIMARY KEY ([TagId])
);

CREATE TABLE [User] (
    [UserId] nvarchar(450) NOT NULL,
    [UserName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NULL,
    [PasswordHash] varbinary(max) NOT NULL,
    [PasswordSalt] varbinary(max) NOT NULL,
    [PasswordAlgoVer] int NOT NULL,
    [AccountStatus] tinyint NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_User] PRIMARY KEY ([UserId])
);

CREATE TABLE [WebResource] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [PicId] nvarchar(max) NOT NULL,
    [PicDescription] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_WebResource] PRIMARY KEY ([WebResourceId])
);

CREATE TABLE [WebResourceInfo] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [ResUrl] nvarchar(max) NOT NULL,
    [Url_OpenType] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_WebResourceInfo] PRIMARY KEY ([WebResourceId], [RowId])
);

CREATE TABLE [AnnouncementDetail] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NULL,
    [SubTitle] nvarchar(max) NULL,
    [Content] nvarchar(max) NULL,
    [Url] nvarchar(max) NULL,
    CONSTRAINT [PK_AnnouncementDetail] PRIMARY KEY ([AnnouncementId], [RowId]),
    CONSTRAINT [FK_AnnouncementDetail_Announcement_AnnouncementId] FOREIGN KEY ([AnnouncementId]) REFERENCES [Announcement] ([AnnouncementId]) ON DELETE NO ACTION
);

CREATE TABLE [CategoryDetail] (
    [CategoryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [CategoryName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_CategoryDetail] PRIMARY KEY ([CategoryId], [RowId]),
    CONSTRAINT [FK_CategoryDetail_Category_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Category] ([CategoryId]) ON DELETE NO ACTION
);

CREATE TABLE [DataChangeLogDetail] (
    [DataChangeId] bigint NOT NULL,
    [RowId] bigint NOT NULL,
    [TableIndex] int NOT NULL,
    [ChangeData] varbinary(max) NOT NULL,
    [RowState] tinyint NOT NULL,
    CONSTRAINT [PK_DataChangeLogDetail] PRIMARY KEY ([DataChangeId], [RowId]),
    CONSTRAINT [FK_DataChangeLogDetail_DataChangeLog_DataChangeId] FOREIGN KEY ([DataChangeId]) REFERENCES [DataChangeLog] ([DataChangeId]) ON DELETE NO ACTION
);

CREATE TABLE [FileArchiveInfo] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveInfo] PRIMARY KEY ([FileArchiveId], [RowId]),
    CONSTRAINT [FK_FileArchiveInfo_FileArchive_FileArchiveId] FOREIGN KEY ([FileArchiveId]) REFERENCES [FileArchive] ([FileArchiveId]) ON DELETE NO ACTION
);

CREATE TABLE [FileManage_DownloadInfo] (
    [InternalId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [DownloadUserIP] nvarchar(max) NOT NULL,
    [UserAgent] nvarchar(max) NOT NULL,
    [RefererURL] nvarchar(max) NOT NULL,
    [DownloadStatus] nvarchar(max) NOT NULL,
    [DownloadTime] datetime2(0) NOT NULL,
    CONSTRAINT [PK_FileManage_DownloadInfo] PRIMARY KEY ([InternalId], [RowId]),
    CONSTRAINT [FK_FileManage_DownloadInfo_FileManage_InternalId] FOREIGN KEY ([InternalId]) REFERENCES [FileManage] ([InternalId]) ON DELETE NO ACTION
);

CREATE TABLE [FileManage_SyncInfo] (
    [InternalId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [FileStatus] tinyint NOT NULL,
    [SrcIP] nvarchar(max) NOT NULL,
    [SrcNode] nvarchar(max) NOT NULL,
    [SrcFullPath] nvarchar(max) NOT NULL,
    [DestIP] nvarchar(max) NOT NULL,
    [DestNode] nvarchar(max) NOT NULL,
    [DestFullPath] nvarchar(max) NOT NULL,
    [ErrorCode] nvarchar(max) NULL,
    [ErrorMessage] nvarchar(max) NULL,
    [ExecuteTime] datetime2(0) NOT NULL,
    CONSTRAINT [PK_FileManage_SyncInfo] PRIMARY KEY ([InternalId], [RowId]),
    CONSTRAINT [FK_FileManage_SyncInfo_FileManage_InternalId] FOREIGN KEY ([InternalId]) REFERENCES [FileManage] ([InternalId]) ON DELETE NO ACTION
);

CREATE TABLE [PageManagementDetail] (
    [PageId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NULL,
    [Content] nvarchar(max) NULL,
    CONSTRAINT [PK_PageManagementDetail] PRIMARY KEY ([PageId], [RowId]),
    CONSTRAINT [FK_PageManagementDetail_PageManagement_PageId] FOREIGN KEY ([PageId]) REFERENCES [PageManagement] ([PageId]) ON DELETE NO ACTION
);

CREATE TABLE [TagDetail] (
    [TagId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [TagName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_TagDetail] PRIMARY KEY ([TagId], [RowId]),
    CONSTRAINT [FK_TagDetail_TagData_TagId] FOREIGN KEY ([TagId]) REFERENCES [TagData] ([TagId]) ON DELETE NO ACTION
);

CREATE TABLE [Permission] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Permission] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_Permission_Role_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Role] ([RoleId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Permission_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User] ([UserId]) ON DELETE CASCADE
);

CREATE TABLE [FileArchiveDetail] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [FileSrcId] nvarchar(max) NOT NULL,
    [FileName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveDetail] PRIMARY KEY ([FileArchiveId], [ParentRowId], [RowId]),
    CONSTRAINT [FK_FileArchiveDetail_FileArchiveInfo_FileArchiveId_RowId] FOREIGN KEY ([FileArchiveId], [RowId]) REFERENCES [FileArchiveInfo] ([FileArchiveId], [RowId]) ON DELETE NO ACTION
);

CREATE UNIQUE INDEX [IX_Announcement_InternalId] ON [Announcement] ([InternalId]);

CREATE UNIQUE INDEX [IX_Banner_InternalId] ON [Banner] ([InternalId]);

CREATE UNIQUE INDEX [IX_Category_InternalId] ON [Category] ([InternalId]);

CREATE UNIQUE INDEX [IX_FileArchive_InternalId] ON [FileArchive] ([InternalId]);

CREATE INDEX [IX_FileArchiveDetail_FileArchiveId_RowId] ON [FileArchiveDetail] ([FileArchiveId], [RowId]);

CREATE INDEX [IX_FileManage_FileSHA256] ON [FileManage] ([FileSHA256]);

CREATE UNIQUE INDEX [IX_FileManage_InternalId] ON [FileManage] ([InternalId]);

CREATE UNIQUE INDEX [IX_Gallery_InternalId] ON [Gallery] ([InternalId]);

CREATE UNIQUE INDEX [IX_PageManagement_InternalId] ON [PageManagement] ([InternalId]);

CREATE UNIQUE INDEX [IX_Permission_InternalId] ON [Permission] ([InternalId]);

CREATE INDEX [IX_Permission_RoleId] ON [Permission] ([RoleId]);

CREATE UNIQUE INDEX [IX_Role_InternalId] ON [Role] ([InternalId]);

CREATE UNIQUE INDEX [IX_SiteMenu_Index_InternalId] ON [SiteMenu_Index] ([InternalId]);

CREATE UNIQUE INDEX [UX_SiteMenu_Item_NaturalKey] ON [SiteMenu_Item] ([SiteIndex], [FullUrl]) WHERE [FullUrl] IS NOT NULL;

CREATE UNIQUE INDEX [IX_SpecCategory_InternalId] ON [SpecCategory] ([InternalId]);

CREATE UNIQUE INDEX [IX_SpecResearch_InternalId] ON [SpecResearch] ([InternalId]);

CREATE UNIQUE INDEX [IX_SpecUSR_InternalId] ON [SpecUSR] ([InternalId]);

CREATE UNIQUE INDEX [IX_TagData_InternalId] ON [TagData] ([InternalId]);

CREATE UNIQUE INDEX [IX_User_InternalId] ON [User] ([InternalId]);

CREATE UNIQUE INDEX [IX_WebResource_InternalId] ON [WebResource] ([InternalId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250825080231_InitialCreate', N'9.0.8');

ALTER TABLE [FileArchiveDetail] DROP CONSTRAINT [FK_FileArchiveDetail_FileArchiveInfo_FileArchiveId_RowId];

DROP INDEX [IX_FileArchiveDetail_FileArchiveId_RowId] ON [FileArchiveDetail];

ALTER TABLE [FileArchiveDetail] ADD CONSTRAINT [FK_FileArchiveDetail_FileArchive_FileArchiveId] FOREIGN KEY ([FileArchiveId]) REFERENCES [FileArchive] ([FileArchiveId]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250825084432_ChangeFK', N'9.0.8');

COMMIT;
GO

