using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Reflection.Emit;
using System.Security.AccessControl;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
    /// <summary>
    /// 
    /// </summary>
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        #region Property
        /// <summary>
        /// 操作日誌
        /// </summary>
        public DbSet<OperateLogModel> OperateLog { get; set; }
        /// <summary>
        /// 變更日誌
        /// </summary>
        public DbSet<DataChangeLog> DataChangeLog { get; set; }
        /// <summary>
        /// 變更日誌明細
        /// </summary>
        public DbSet<DataChangeLogDetail> DataChangeLogDetail { get; set; }

        #endregion
        #region Construct
        #endregion
        #region Protected
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            ModelDbSetting(builder);
            ApplyCascadeDeleteRules(builder);
            builder.Entity<DataChangeLogDetail>().HasKey(p => new { p.DataChangeId, p.RowId });
            //builder.BuildIndexesFromAnnotations();//設置Index套件
            SetDateTimeDBType(builder);
        }
        #endregion
        #region Private
        /// <summary>
        /// 模型與Database綁定設置
        /// </summary>
        /// <param name="builder"></param>
        private void ModelDbSetting(ModelBuilder builder)
        {
            Type[] modelTypes = Assembly.GetExecutingAssembly().GetTypes().Where(p =>
                p.BaseType == typeof(DetailRowModel) || p.BaseType == typeof(MasterDataModel) || p.BaseType == typeof(BillDataModel)
            ).ToArray();
            foreach (Type type in modelTypes)
            {
                string tableName = type.Name;
                if (tableName.Substring(tableName.Length - 5, 5) == SysParam.Model) tableName = tableName[0..^5];
                string[] keyPropName = type.GetProperties().Where(p => p.IsDefined(typeof(KeyAttribute))).Select(p => p.Name).ToArray();
                if (keyPropName.Length != 0) builder.Entity(type).ToTable(tableName).HasKey(keyPropName);
                else builder.Entity(type).ToTable(tableName);
            }
        }

        /// <summary>
        /// 自動對所有「主表 → 子表」的關聯套用 DeleteBehavior.Cascade
        /// 可排除某些 Entity 類型不套用（例如：參考用的主資料表）
        /// </summary>
        /// <param name="modelBuilder">DbContext 的 ModelBuilder</param>
        /// <param name="excludedEntities">可選，要排除的 Entity 類型（不會掃描與套用）</param>
        public static void ApplyCascadeDeleteRules(ModelBuilder modelBuilder, params Type[] excludedEntities)
        {
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // 如果是排除的 Entity，就跳過
                if (excludedEntities?.Contains(entity.ClrType) == true) continue;

                foreach (var foreignKey in entity.GetForeignKeys())
                {
                    // 排除 Owned Type 與複雜依賴
                    if (foreignKey.IsOwnership) continue;

                    // 我們只要主→子，有雙向導航屬性的關係
                    var hasPrincipalToDependent = foreignKey.PrincipalToDependent != null;
                    var hasDependentToPrincipal = foreignKey.DependentToPrincipal != null;

                    if (hasPrincipalToDependent && hasDependentToPrincipal)
                    {
                        // ✅ 設定連動刪除
                        foreignKey.DeleteBehavior = DeleteBehavior.Cascade;
                    }
                    else
                    {
                        // 🟡 其他情況預設為 Restrict，避免意外刪除參考資料
                        foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
                    }
                }
            }
        }

        /// <summary>
        /// 設置 DateTime 欄位的資料庫類型為 datetime2(0) (yy/mm/dd hh:mm:ss)
        /// </summary>
        /// <param name="modelBuilder"></param>
        public static void SetDateTimeDBType(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                    {
                        property.SetColumnType("datetime2(0)");
                    }
                }
            }
        }
        #endregion
    }

    public static class LibDataAccess
    {
        #region Property
        /// <summary>
        /// 
        /// </summary>
        public static readonly IConfiguration Configuration = new ConfigurationBuilder().SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile(SysParam.AppSettingsJson, optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "production"}.json", optional: true, reloadOnChange: true).Build();
        #endregion
        #region Public
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public static ApplicationDbContext CreateDataAccess(IConfiguration config = null)
        {
            return new ApplicationDbContext(GetConnectionOption(config));
        }
        #endregion
        #region Private
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        private static DbContextOptions<ApplicationDbContext> GetConnectionOption(IConfiguration config)
        {
            if (config is null) config = Configuration;
            DbContextOptionsBuilder<ApplicationDbContext> builder = new DbContextOptionsBuilder<ApplicationDbContext>();
            builder.UseSqlServer(config.GetConnectionString(SysParam.SqlConnection), b => b.MigrationsAssembly(nameof(WCMS)));
            return builder.Options;
        }
        #endregion
    }
}
