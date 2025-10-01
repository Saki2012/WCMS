using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class ADDUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectItem",
                table: "SpecUSRDetail",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "SpecUSRDetail",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UrlDescription",
                table: "SpecUSRDetail",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectItem",
                table: "SpecUSRDetail");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "SpecUSRDetail");

            migrationBuilder.DropColumn(
                name: "UrlDescription",
                table: "SpecUSRDetail");
        }
    }
}
