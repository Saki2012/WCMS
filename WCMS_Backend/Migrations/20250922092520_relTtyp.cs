using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class relTtyp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileArchiveDetail_FileManage_FileSrcId",
                table: "FileArchiveDetail");

            migrationBuilder.DropIndex(
                name: "IX_FileArchiveDetail_FileSrcId",
                table: "FileArchiveDetail");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
