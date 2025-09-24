using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class datetime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "Validate_Start",
                table: "BannerDetail",
                type: "datetime2(0)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2(0)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Validate_End",
                table: "BannerDetail",
                type: "datetime2(0)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2(0)");

            migrationBuilder.CreateIndex(
                name: "IX_FileArchiveDetail_FileSrcId",
                table: "FileArchiveDetail",
                column: "FileSrcId");

            migrationBuilder.AddForeignKey(
                name: "FK_FileArchiveDetail_FileManage_FileSrcId",
                table: "FileArchiveDetail",
                column: "FileSrcId",
                principalTable: "FileManage",
                principalColumn: "InternalId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileArchiveDetail_FileManage_FileSrcId",
                table: "FileArchiveDetail");

            migrationBuilder.DropIndex(
                name: "IX_FileArchiveDetail_FileSrcId",
                table: "FileArchiveDetail");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Validate_Start",
                table: "BannerDetail",
                type: "datetime2(0)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2(0)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "Validate_End",
                table: "BannerDetail",
                type: "datetime2(0)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2(0)",
                oldNullable: true);
        }
    }
}
