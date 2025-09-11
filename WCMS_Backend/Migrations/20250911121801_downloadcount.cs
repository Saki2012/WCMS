using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class downloadcount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DownloadCount",
                table: "FileArchive",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DownloadCount",
                table: "FileArchive");
        }
    }
}
