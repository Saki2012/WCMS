using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SplitStringRow",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserImageId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PasswordHash = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    PasswordAlgoVer = table.Column<int>(type: "int", nullable: false),
                    AccountStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_User_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_User_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_User_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Announcement",
                columns: table => new
                {
                    AnnouncementId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Categories = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    PictureId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: true),
                    PicDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ViewCount = table.Column<int>(type: "int", nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcement", x => x.AnnouncementId);
                    table.ForeignKey(
                        name: "FK_Announcement_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Announcement_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Announcement_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Banner",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BannerCategoryName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Interval = table.Column<short>(type: "smallint", nullable: false),
                    Speed = table.Column<short>(type: "smallint", nullable: false),
                    Height = table.Column<short>(type: "smallint", nullable: false),
                    Width = table.Column<short>(type: "smallint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Banner", x => x.BannerId);
                    table.ForeignKey(
                        name: "FK_Banner_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Banner_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Banner_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Category",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Category", x => x.CategoryId);
                    table.ForeignKey(
                        name: "FK_Category_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Category_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Category_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "FileArchive",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    CategoriesId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TagsId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DownloadCount = table.Column<int>(type: "int", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchive", x => x.FileArchiveId);
                    table.ForeignKey(
                        name: "FK_FileArchive_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_FileArchive_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_FileArchive_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "FileManage",
                columns: table => new
                {
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    Path = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FileExtension = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    FileDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    MimeType = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FileSHA256 = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    ImportLabel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FileStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileManage", x => x.InternalId);
                    table.ForeignKey(
                        name: "FK_FileManage_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_FileManage_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "_Gallery",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Categories = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    CoverPicSrcId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gallery", x => x.GalleryId);
                    table.ForeignKey(
                        name: "FK_Gallery_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Gallery_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Gallery_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "OperateLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    APIName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    followingDT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Browser = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IP = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    ExcuteTime = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ExcStatus = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperateLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OperateLog_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "PageManagement",
                columns: table => new
                {
                    PageId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ViewCount = table.Column<int>(type: "int", nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageManagement", x => x.PageId);
                    table.ForeignKey(
                        name: "FK_PageManagement_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_PageManagement_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_PageManagement_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Role",
                columns: table => new
                {
                    RoleId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EndType = table.Column<byte>(type: "tinyint", nullable: false),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Role", x => x.RoleId);
                    table.ForeignKey(
                        name: "FK_Role_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Role_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Role_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_Index",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GoogleAnalytics = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Enable = table.Column<bool>(type: "bit", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_Index", x => x.SiteIndex);
                    table.ForeignKey(
                        name: "FK_SiteMenu_Index_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SiteMenu_Index_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SiteMenu_Index_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "SpecCategory",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    ShowColumnItems = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecCategory", x => x.CategoryId);
                    table.ForeignKey(
                        name: "FK_SpecCategory_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecCategory_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecCategory_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "SpecResearch",
                columns: table => new
                {
                    ResearchId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecResearch", x => x.ResearchId);
                    table.ForeignKey(
                        name: "FK_SpecResearch_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecResearch_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecResearch_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "SpecUSR",
                columns: table => new
                {
                    USRId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PictureId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: true),
                    PicDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecUSR", x => x.USRId);
                    table.ForeignKey(
                        name: "FK_SpecUSR_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecUSR_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_SpecUSR_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "TagData",
                columns: table => new
                {
                    TagId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProgId = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagData", x => x.TagId);
                    table.ForeignKey(
                        name: "FK_TagData_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_TagData_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_TagData_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "UserInfo",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInfo", x => new { x.UserId, x.RowId });
                    table.ForeignKey(
                        name: "FK_UserInfo_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebResource",
                columns: table => new
                {
                    WebResourceId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Categories = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    PicId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: true),
                    PicDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebResource", x => x.WebResourceId);
                    table.ForeignKey(
                        name: "FK_WebResource_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_WebResource_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_WebResource_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementDetail",
                columns: table => new
                {
                    AnnouncementId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SubTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Url = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    UrlDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementDetail", x => new { x.AnnouncementId, x.RowId });
                    table.ForeignKey(
                        name: "FK_AnnouncementDetail_Announcement_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcement",
                        principalColumn: "AnnouncementId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BannerDetail",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FontColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Sort = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BannerDetail", x => new { x.BannerId, x.RowId });
                    table.ForeignKey(
                        name: "FK_BannerDetail_Banner_BannerId",
                        column: x => x.BannerId,
                        principalTable: "Banner",
                        principalColumn: "BannerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CategoryDetail",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CategoryName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryDetail", x => new { x.CategoryId, x.RowId });
                    table.ForeignKey(
                        name: "FK_CategoryDetail_Category_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Category",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FileArchiveInfo",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FileArchiveId1 = table.Column<string>(type: "nvarchar(20)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchiveInfo", x => new { x.FileArchiveId, x.RowId });
                    table.ForeignKey(
                        name: "FK_FileArchiveInfo_FileArchive_FileArchiveId",
                        column: x => x.FileArchiveId,
                        principalTable: "FileArchive",
                        principalColumn: "FileArchiveId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FileArchiveInfo_FileArchive_FileArchiveId1",
                        column: x => x.FileArchiveId1,
                        principalTable: "FileArchive",
                        principalColumn: "FileArchiveId");
                });

            migrationBuilder.CreateTable(
                name: "FileManage_DownloadInfo",
                columns: table => new
                {
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    DownloadUserIP = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    RefererURL = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DownloadStatus = table.Column<bool>(type: "bit", nullable: false),
                    DownloadTime = table.Column<DateTime>(type: "datetime2(0)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileManage_DownloadInfo", x => new { x.InternalId, x.RowId });
                    table.ForeignKey(
                        name: "FK_FileManage_DownloadInfo_FileManage_InternalId",
                        column: x => x.InternalId,
                        principalTable: "FileManage",
                        principalColumn: "InternalId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FileManage_SyncInfo",
                columns: table => new
                {
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    FileStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    SrcIP = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    SrcNode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SrcFullPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DestIP = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    DestNode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DestFullPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ErrorCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ExecuteTime = table.Column<DateTime>(type: "datetime2(0)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileManage_SyncInfo", x => new { x.InternalId, x.RowId });
                    table.ForeignKey(
                        name: "FK_FileManage_SyncInfo_FileManage_InternalId",
                        column: x => x.InternalId,
                        principalTable: "FileManage",
                        principalColumn: "InternalId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GalleryInfo",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryInfo", x => new { x.GalleryId, x.RowId });
                    table.ForeignKey(
                        name: "FK_GalleryInfo_Gallery_GalleryId",
                        column: x => x.GalleryId,
                        principalTable: "_Gallery",
                        principalColumn: "GalleryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GalleryPhotos",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    PicSrcId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryPhotos", x => new { x.GalleryId, x.RowId });
                    table.ForeignKey(
                        name: "FK_GalleryPhotos_Gallery_GalleryId",
                        column: x => x.GalleryId,
                        principalTable: "_Gallery",
                        principalColumn: "GalleryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PageManagementDetail",
                columns: table => new
                {
                    PageId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageManagementDetail", x => new { x.PageId, x.RowId });
                    table.ForeignKey(
                        name: "FK_PageManagementDetail_PageManagement_PageId",
                        column: x => x.PageId,
                        principalTable: "PageManagement",
                        principalColumn: "PageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Permission",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreateUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ModifyTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ModifyUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    DataStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    InvalidTime = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    InvalidUserId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    InternalId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    OrgLvId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsIniData = table.Column<bool>(type: "bit", nullable: false),
                    DataVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Validate_Start = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Validate_End = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permission", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_Permission_Role_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Role",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Permission_User_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Permission_User_InvalidUserId",
                        column: x => x.InvalidUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Permission_User_ModifyUserId",
                        column: x => x.ModifyUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Permission_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_IndexInfo",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    SiteHeader = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SiteFooter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Keyword = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_IndexInfo", x => new { x.SiteIndex, x.RowId });
                    table.ForeignKey(
                        name: "FK_SiteMenu_IndexInfo_SiteMenu_Index_SiteIndex",
                        column: x => x.SiteIndex,
                        principalTable: "SiteMenu_Index",
                        principalColumn: "SiteIndex",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_Item",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: true),
                    ItemSiteUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FullUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Level = table.Column<byte>(type: "tinyint", nullable: false),
                    DisplayOrder = table.Column<byte>(type: "tinyint", nullable: false),
                    ItemType = table.Column<byte>(type: "tinyint", nullable: false),
                    WindowTarget = table.Column<byte>(type: "tinyint", nullable: false),
                    IsShowOnMenu = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_Item", x => new { x.SiteIndex, x.RowId });
                    table.ForeignKey(
                        name: "FK_SiteMenu_Item_SiteMenu_Index_SiteIndex",
                        column: x => x.SiteIndex,
                        principalTable: "SiteMenu_Index",
                        principalColumn: "SiteIndex",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpecCategoryDetail",
                columns: table => new
                {
                    CategoryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CategoryName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecCategoryDetail", x => new { x.CategoryId, x.RowId });
                    table.ForeignKey(
                        name: "FK_SpecCategoryDetail_SpecCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "SpecCategory",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpecResearchDetail",
                columns: table => new
                {
                    ResearchId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Year = table.Column<int>(type: "int", nullable: true),
                    AcademicYear = table.Column<int>(type: "int", nullable: true),
                    Semester = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    DuringExecution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContractPeriod = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ClassTime = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ProjectLeader = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TeachingStaffOfOurSchool = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ApprovalNumber = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ApprovedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    College = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Department = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GraduationDegree = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CooperatingUnits = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CooperationProject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Courses = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ProjectName = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PaperTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Remark = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Cohost1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Cohost2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Commissioned = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PlanAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PlanContent = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecResearchDetail", x => new { x.ResearchId, x.RowId });
                    table.ForeignKey(
                        name: "FK_SpecResearchDetail_SpecResearch_ResearchId",
                        column: x => x.ResearchId,
                        principalTable: "SpecResearch",
                        principalColumn: "ResearchId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpecUSRDetail",
                columns: table => new
                {
                    USRId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Year = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    AcademicYear = table.Column<int>(type: "int", nullable: true),
                    Courses = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PracticeField = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProjectName = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ExternalCooperationUnit = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Department = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DuringExecution = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PlanAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ExecutionStrategy = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ContentIntroduction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectConcept = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProjectHighlights = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ProjectLeader = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Cohost1 = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Cohost2 = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Commissioned = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Remark = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ProjectItem = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UrlDescription = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecUSRDetail", x => new { x.USRId, x.RowId });
                    table.ForeignKey(
                        name: "FK_SpecUSRDetail_SpecUSR_USRId",
                        column: x => x.USRId,
                        principalTable: "SpecUSR",
                        principalColumn: "USRId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagDetail",
                columns: table => new
                {
                    TagId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TagName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagDetail", x => new { x.TagId, x.RowId });
                    table.ForeignKey(
                        name: "FK_TagDetail_TagData_TagId",
                        column: x => x.TagId,
                        principalTable: "TagData",
                        principalColumn: "TagId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebResourceInfo",
                columns: table => new
                {
                    WebResourceId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Url_OpenType = table.Column<byte>(type: "tinyint", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebResourceInfo", x => new { x.WebResourceId, x.RowId });
                    table.ForeignKey(
                        name: "FK_WebResourceInfo_WebResource_WebResourceId",
                        column: x => x.WebResourceId,
                        principalTable: "WebResource",
                        principalColumn: "WebResourceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementDetailFile",
                columns: table => new
                {
                    AnnouncementId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    FileId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementDetailFile", x => new { x.AnnouncementId, x.ParentRowId, x.RowId });
                    table.ForeignKey(
                        name: "FK_AnnouncementDetailFile_AnnouncementDetail_AnnouncementId_ParentRowId",
                        columns: x => new { x.AnnouncementId, x.ParentRowId },
                        principalTable: "AnnouncementDetail",
                        principalColumns: new[] { "AnnouncementId", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BannerDetailInfo",
                columns: table => new
                {
                    BannerId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    URL = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    URL_Open = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BannerDetailInfo", x => new { x.BannerId, x.ParentRowId, x.RowId });
                    table.ForeignKey(
                        name: "FK_BannerDetailInfo_BannerDetail_BannerId_ParentRowId",
                        columns: x => new { x.BannerId, x.ParentRowId },
                        principalTable: "BannerDetail",
                        principalColumns: new[] { "BannerId", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FileArchiveDetail",
                columns: table => new
                {
                    FileArchiveId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    FileSrcId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileArchiveDetail", x => new { x.FileArchiveId, x.ParentRowId, x.RowId });
                    table.ForeignKey(
                        name: "FK_FileArchiveDetail_FileArchiveInfo_FileArchiveId_ParentRowId",
                        columns: x => new { x.FileArchiveId, x.ParentRowId },
                        principalTable: "FileArchiveInfo",
                        principalColumns: new[] { "FileArchiveId", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FileArchiveDetail_FileManage_FileSrcId",
                        column: x => x.FileSrcId,
                        principalTable: "FileManage",
                        principalColumn: "InternalId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GalleryPhotosInfo",
                columns: table => new
                {
                    GalleryId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ParentRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryPhotosInfo", x => new { x.GalleryId, x.ParentRowId, x.RowId });
                    table.ForeignKey(
                        name: "FK_GalleryPhotosInfo_GalleryPhotos_GalleryId_ParentRowId",
                        columns: x => new { x.GalleryId, x.ParentRowId },
                        principalTable: "GalleryPhotos",
                        principalColumns: new[] { "GalleryId", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_Item_Module",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ItemRowId = table.Column<int>(type: "int", nullable: false),
                    BannerId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PageType = table.Column<byte>(type: "tinyint", nullable: false),
                    ModuleProgId = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    ModuleOptions = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_Item_Module", x => new { x.SiteIndex, x.ItemRowId });
                    table.ForeignKey(
                        name: "FK_SiteMenu_Item_Module_SiteMenu_Item_SiteIndex_ItemRowId",
                        columns: x => new { x.SiteIndex, x.ItemRowId },
                        principalTable: "SiteMenu_Item",
                        principalColumns: new[] { "SiteIndex", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_Item_Title",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ItemRowId = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: false),
                    Lang = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_Item_Title", x => new { x.SiteIndex, x.ItemRowId, x.RowId });
                    table.ForeignKey(
                        name: "FK_SiteMenu_Item_Title_SiteMenu_Item_SiteIndex_ItemRowId",
                        columns: x => new { x.SiteIndex, x.ItemRowId },
                        principalTable: "SiteMenu_Item",
                        principalColumns: new[] { "SiteIndex", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteMenu_Item_Url",
                columns: table => new
                {
                    SiteIndex = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    ItemRowId = table.Column<int>(type: "int", nullable: false),
                    RedirectType = table.Column<byte>(type: "tinyint", nullable: false),
                    RedirectUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteMenu_Item_Url", x => new { x.SiteIndex, x.ItemRowId });
                    table.ForeignKey(
                        name: "FK_SiteMenu_Item_Url_SiteMenu_Item_SiteIndex_ItemRowId",
                        columns: x => new { x.SiteIndex, x.ItemRowId },
                        principalTable: "SiteMenu_Item",
                        principalColumns: new[] { "SiteIndex", "RowId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_CreateUserId",
                table: "Announcement",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_InternalId",
                table: "Announcement",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_InvalidUserId",
                table: "Announcement",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcement_ModifyUserId",
                table: "Announcement",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Banner_CreateUserId",
                table: "Banner",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Banner_InternalId",
                table: "Banner",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Banner_InvalidUserId",
                table: "Banner",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Banner_ModifyUserId",
                table: "Banner",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Category_CreateUserId",
                table: "Category",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Category_InternalId",
                table: "Category",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Category_InvalidUserId",
                table: "Category",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Category_ModifyUserId",
                table: "Category",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchive_CreateUserId",
                table: "FileArchive",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchive_InternalId",
                table: "FileArchive",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileArchive_InvalidUserId",
                table: "FileArchive",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchive_ModifyUserId",
                table: "FileArchive",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchiveDetail_FileSrcId",
                table: "FileArchiveDetail",
                column: "FileSrcId");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchiveInfo_FileArchiveId1",
                table: "FileArchiveInfo",
                column: "FileArchiveId1");

            migrationBuilder.CreateIndex(
                name: "IX_FileManage_CreateUserId",
                table: "FileManage",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileManage_FileSHA256",
                table: "FileManage",
                column: "FileSHA256");

            migrationBuilder.CreateIndex(
                name: "IX_FileManage_InternalId",
                table: "FileManage",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileManage_ModifyUserId",
                table: "FileManage",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Gallery_CreateUserId",
                table: "_Gallery",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Gallery_InternalId",
                table: "_Gallery",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Gallery_InvalidUserId",
                table: "_Gallery",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Gallery_ModifyUserId",
                table: "_Gallery",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OperateLog_UserId",
                table: "OperateLog",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PageManagement_CreateUserId",
                table: "PageManagement",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PageManagement_InternalId",
                table: "PageManagement",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PageManagement_InvalidUserId",
                table: "PageManagement",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PageManagement_ModifyUserId",
                table: "PageManagement",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Permission_CreateUserId",
                table: "Permission",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Permission_InternalId",
                table: "Permission",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permission_InvalidUserId",
                table: "Permission",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Permission_ModifyUserId",
                table: "Permission",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Permission_RoleId",
                table: "Permission",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Role_CreateUserId",
                table: "Role",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Role_InternalId",
                table: "Role",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Role_InvalidUserId",
                table: "Role",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Role_ModifyUserId",
                table: "Role",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteMenu_Index_CreateUserId",
                table: "SiteMenu_Index",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteMenu_Index_InternalId",
                table: "SiteMenu_Index",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SiteMenu_Index_InvalidUserId",
                table: "SiteMenu_Index",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteMenu_Index_ModifyUserId",
                table: "SiteMenu_Index",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "UX_SiteMenu_Item_NaturalKey",
                table: "SiteMenu_Item",
                columns: new[] { "SiteIndex", "FullUrl" },
                unique: true,
                filter: "[FullUrl] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SpecCategory_CreateUserId",
                table: "SpecCategory",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecCategory_InternalId",
                table: "SpecCategory",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpecCategory_InvalidUserId",
                table: "SpecCategory",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecCategory_ModifyUserId",
                table: "SpecCategory",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecResearch_CreateUserId",
                table: "SpecResearch",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecResearch_InternalId",
                table: "SpecResearch",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpecResearch_InvalidUserId",
                table: "SpecResearch",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecResearch_ModifyUserId",
                table: "SpecResearch",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecUSR_CreateUserId",
                table: "SpecUSR",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecUSR_InternalId",
                table: "SpecUSR",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpecUSR_InvalidUserId",
                table: "SpecUSR",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecUSR_ModifyUserId",
                table: "SpecUSR",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TagData_CreateUserId",
                table: "TagData",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TagData_InternalId",
                table: "TagData",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TagData_InvalidUserId",
                table: "TagData",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TagData_ModifyUserId",
                table: "TagData",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_User_CreateUserId",
                table: "User",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_User_InternalId",
                table: "User",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_InvalidUserId",
                table: "User",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_User_ModifyUserId",
                table: "User",
                column: "ModifyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WebResource_CreateUserId",
                table: "WebResource",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WebResource_InternalId",
                table: "WebResource",
                column: "InternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebResource_InvalidUserId",
                table: "WebResource",
                column: "InvalidUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WebResource_ModifyUserId",
                table: "WebResource",
                column: "ModifyUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementDetailFile");

            migrationBuilder.DropTable(
                name: "BannerDetailInfo");

            migrationBuilder.DropTable(
                name: "CategoryDetail");

            migrationBuilder.DropTable(
                name: "FileArchiveDetail");

            migrationBuilder.DropTable(
                name: "FileManage_DownloadInfo");

            migrationBuilder.DropTable(
                name: "FileManage_SyncInfo");

            migrationBuilder.DropTable(
                name: "GalleryInfo");

            migrationBuilder.DropTable(
                name: "GalleryPhotosInfo");

            migrationBuilder.DropTable(
                name: "OperateLog");

            migrationBuilder.DropTable(
                name: "PageManagementDetail");

            migrationBuilder.DropTable(
                name: "Permission");

            migrationBuilder.DropTable(
                name: "SiteMenu_IndexInfo");

            migrationBuilder.DropTable(
                name: "SiteMenu_Item_Module");

            migrationBuilder.DropTable(
                name: "SiteMenu_Item_Title");

            migrationBuilder.DropTable(
                name: "SiteMenu_Item_Url");

            migrationBuilder.DropTable(
                name: "SpecCategoryDetail");

            migrationBuilder.DropTable(
                name: "SpecResearchDetail");

            migrationBuilder.DropTable(
                name: "SpecUSRDetail");

            migrationBuilder.DropTable(
                name: "SplitStringRow");

            migrationBuilder.DropTable(
                name: "TagDetail");

            migrationBuilder.DropTable(
                name: "UserInfo");

            migrationBuilder.DropTable(
                name: "WebResourceInfo");

            migrationBuilder.DropTable(
                name: "AnnouncementDetail");

            migrationBuilder.DropTable(
                name: "BannerDetail");

            migrationBuilder.DropTable(
                name: "Category");

            migrationBuilder.DropTable(
                name: "FileArchiveInfo");

            migrationBuilder.DropTable(
                name: "FileManage");

            migrationBuilder.DropTable(
                name: "GalleryPhotos");

            migrationBuilder.DropTable(
                name: "PageManagement");

            migrationBuilder.DropTable(
                name: "Role");

            migrationBuilder.DropTable(
                name: "SiteMenu_Item");

            migrationBuilder.DropTable(
                name: "SpecCategory");

            migrationBuilder.DropTable(
                name: "SpecResearch");

            migrationBuilder.DropTable(
                name: "SpecUSR");

            migrationBuilder.DropTable(
                name: "TagData");

            migrationBuilder.DropTable(
                name: "WebResource");

            migrationBuilder.DropTable(
                name: "Announcement");

            migrationBuilder.DropTable(
                name: "Banner");

            migrationBuilder.DropTable(
                name: "FileArchive");

            migrationBuilder.DropTable(
                name: "_Gallery");

            migrationBuilder.DropTable(
                name: "SiteMenu_Index");

            migrationBuilder.DropTable(
                name: "User");
        }
    }
}
