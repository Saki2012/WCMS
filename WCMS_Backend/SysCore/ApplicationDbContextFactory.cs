using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using WCMS.SysCore.Library;

namespace WCMS.SysCore
{
    /// <summary>
    /// EF CLI 建立 DbContext 時使用，確保 Migration 也吃得到 SpecCode。
    /// </summary>
    public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        /// <summary>
        /// 建立 EF CLI 專用 DbContext。
        /// </summary>
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var cfg = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile($"appsettings.{env}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            SpecSettings.Init(cfg);
            var cs = cfg.GetConnectionString("SqlConnection");
            if (string.IsNullOrWhiteSpace(cs)) throw new InvalidOperationException("Missing ConnectionStrings:SqlConnection.");
            var opt = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(cs).Options;
            return new ApplicationDbContext(opt);
        }
    }
}