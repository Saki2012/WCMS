using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class AddNewColumnToYourEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcement",
                columns: table => new
                {
                    CustomerCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcement", x => x.CustomerCode);
                });

            migrationBuilder.CreateTable(
                name: "Banner",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Interval = table.Column<short>(type: "smallint", nullable: false),
                    Speed = table.Column<short>(type: "smallint", nullable: false),
                    Height = table.Column<short>(type: "smallint", nullable: false),
                    Width = table.Column<short>(type: "smallint", nullable: false),
                    Effect = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Banner", x => x.BannerId);
                });

            migrationBuilder.CreateTable(
                name: "BannerDetail",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FontColor = table.Column<byte>(type: "tinyint", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false),
                    URL_Open = table.Column<byte>(type: "tinyint", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BannerDetail", x => new { x.BannerId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "BannerDetailInfo",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BannerDetailInfo", x => new { x.BannerId, x.ParentRowId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "Category",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Category", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "CategoryDetail",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryDetail", x => new { x.CategoryId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "DataChangeLog",
                columns: table => new
                {
                    DataChangeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataChangeTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataChangeLog", x => x.DataChangeId);
                });

            migrationBuilder.CreateTable(
                name: "FileArchive",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CategoriesId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TagsId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchive", x => x.FileArchiveId);
                });

            migrationBuilder.CreateTable(
                name: "FileArchiveDetail",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchiveDetail", x => new { x.FileArchiveId, x.ParentRowId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "FileArchiveInfo",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchiveInfo", x => new { x.FileArchiveId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "Gallery",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoriesId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TagsId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CoverPicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gallery", x => x.GalleryId);
                });

            migrationBuilder.CreateTable(
                name: "GalleryInfo",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryInfo", x => new { x.GalleryId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "GalleryPhotos",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false),
                    IsCovered = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryPhotos", x => new { x.GalleryId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "GalleryPhotosInfo",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryPhotosInfo", x => new { x.GalleryId, x.ParentRowId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "OperateLog",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Browser = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PK = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OperateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Memo = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperateLog", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PageManagement",
                columns: table => new
                {
                    PageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageManagement", x => x.PageId);
                });

            migrationBuilder.CreateTable(
                name: "PageManagementDetail",
                columns: table => new
                {
                    PageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageManagementDetail", x => new { x.PageId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "Role",
                columns: table => new
                {
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EndType = table.Column<byte>(type: "tinyint", nullable: false),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Role", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "SpecResearch",
                columns: table => new
                {
                    ResearchId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Interval = table.Column<short>(type: "smallint", nullable: false),
                    Speed = table.Column<short>(type: "smallint", nullable: false),
                    Height = table.Column<short>(type: "smallint", nullable: false),
                    Width = table.Column<short>(type: "smallint", nullable: false),
                    Effect = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecResearch", x => x.ResearchId);
                });

            migrationBuilder.CreateTable(
                name: "SpecResearchDetail",
                columns: table => new
                {
                    ResearchId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FontColor = table.Column<byte>(type: "tinyint", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false),
                    URL_Open = table.Column<byte>(type: "tinyint", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecResearchDetail", x => x.ResearchId);
                });

            migrationBuilder.CreateTable(
                name: "SpecUSR",
                columns: table => new
                {
                    USRId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Interval = table.Column<short>(type: "smallint", nullable: false),
                    Speed = table.Column<short>(type: "smallint", nullable: false),
                    Height = table.Column<short>(type: "smallint", nullable: false),
                    Width = table.Column<short>(type: "smallint", nullable: false),
                    Effect = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecUSR", x => x.USRId);
                });

            migrationBuilder.CreateTable(
                name: "SpecUSRDetail",
                columns: table => new
                {
                    USRId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FontColor = table.Column<byte>(type: "tinyint", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false),
                    URL_Open = table.Column<byte>(type: "tinyint", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecUSRDetail", x => x.USRId);
                });

            migrationBuilder.CreateTable(
                name: "TagData",
                columns: table => new
                {
                    TagId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagData", x => x.TagId);
                });

            migrationBuilder.CreateTable(
                name: "TagDetail",
                columns: table => new
                {
                    TagId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TagName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagDetail", x => new { x.TagId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccountStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "WebResource",
                columns: table => new
                {
                    WebResourceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoriesId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TagsId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SrcType = table.Column<byte>(type: "tinyint", nullable: false),
                    SrcData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Url_OpenType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifyTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Validate_End = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebResource", x => x.WebResourceId);
                });

            migrationBuilder.CreateTable(
                name: "WebResourceInfo",
                columns: table => new
                {
                    WebResourceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebResourceInfo", x => new { x.WebResourceId, x.RowId });
                });

            migrationBuilder.CreateTable(
                name: "DataChangeLogDetail",
                columns: table => new
                {
                    DataChangeId = table.Column<long>(type: "bigint", nullable: false),
                    RowId = table.Column<long>(type: "bigint", nullable: false),
                    TableIndex = table.Column<int>(type: "int", nullable: false),
                    ChangeData = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    RowState = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataChangeLogDetail", x => new { x.DataChangeId, x.RowId });
                    table.ForeignKey(
                        name: "FK_DataChangeLogDetail_DataChangeLog_DataChangeId",
                        column: x => x.DataChangeId,
                        principalTable: "DataChangeLog",
                        principalColumn: "DataChangeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_InternalId",
                table: "Announcement",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Banner_InternalId",
                table: "Banner",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Category_InternalId",
                table: "Category",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileArchive_InternalId",
                table: "FileArchive",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Gallery_InternalId",
                table: "Gallery",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PageManagement_InternalId",
                table: "PageManagement",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Role_InternalId",
                table: "Role",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpecResearch_InternalId",
                table: "SpecResearch",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpecUSR_InternalId",
                table: "SpecUSR",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TagData_InternalId",
                table: "TagData",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_InternalId",
                table: "User",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebResource_InternalId",
                table: "WebResource",
                column: "InternalId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Announcement");

            migrationBuilder.DropTable(
                name: "Banner");

            migrationBuilder.DropTable(
                name: "BannerDetail");

            migrationBuilder.DropTable(
                name: "BannerDetailInfo");

            migrationBuilder.DropTable(
                name: "Category");

            migrationBuilder.DropTable(
                name: "CategoryDetail");

            migrationBuilder.DropTable(
                name: "DataChangeLogDetail");

            migrationBuilder.DropTable(
                name: "FileArchive");

            migrationBuilder.DropTable(
                name: "FileArchiveDetail");

            migrationBuilder.DropTable(
                name: "FileArchiveInfo");

            migrationBuilder.DropTable(
                name: "Gallery");

            migrationBuilder.DropTable(
                name: "GalleryInfo");

            migrationBuilder.DropTable(
                name: "GalleryPhotos");

            migrationBuilder.DropTable(
                name: "GalleryPhotosInfo");

            migrationBuilder.DropTable(
                name: "OperateLog");

            migrationBuilder.DropTable(
                name: "PageManagement");

            migrationBuilder.DropTable(
                name: "PageManagementDetail");

            migrationBuilder.DropTable(
                name: "Role");

            migrationBuilder.DropTable(
                name: "SpecResearch");

            migrationBuilder.DropTable(
                name: "SpecResearchDetail");

            migrationBuilder.DropTable(
                name: "SpecUSR");

            migrationBuilder.DropTable(
                name: "SpecUSRDetail");

            migrationBuilder.DropTable(
                name: "TagData");

            migrationBuilder.DropTable(
                name: "TagDetail");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "WebResource");

            migrationBuilder.DropTable(
                name: "WebResourceInfo");

            migrationBuilder.DropTable(
                name: "DataChangeLog");
        }
    }
}
