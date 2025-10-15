using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class updatefk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileArchiveInfo_FileArchive_FileArchiveId1",
                table: "FileArchiveInfo");

            migrationBuilder.DropIndex(
                name: "IX_FileArchiveInfo_FileArchiveId1",
                table: "FileArchiveInfo");

            migrationBuilder.DropColumn(
                name: "FileArchiveId1",
                table: "FileArchiveInfo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileArchiveId1",
                table: "FileArchiveInfo",
                type: "nvarchar(20)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileArchiveInfo_FileArchiveId1",
                table: "FileArchiveInfo",
                column: "FileArchiveId1");

            migrationBuilder.AddForeignKey(
                name: "FK_FileArchiveInfo_FileArchive_FileArchiveId1",
                table: "FileArchiveInfo",
                column: "FileArchiveId1",
                principalTable: "FileArchive",
                principalColumn: "FileArchiveId");
        }
    }
}
