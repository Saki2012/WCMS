using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WCMS.Migrations
{
    /// <inheritdoc />
    public partial class SiteInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "PageType",
                table: "SiteMenu_Item_Module",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PageType",
                table: "SiteMenu_Item_Module");
        }
    }
}
