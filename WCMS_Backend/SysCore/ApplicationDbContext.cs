using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SharpCompress.Compressors.RLE90;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Dynamic.Core;
using System.Linq.Dynamic.Core.CustomTypeProviders;
using System.Reflection;
using System.Reflection.Emit;
using System.Runtime.Intrinsics.Arm;
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

        #region DB UDF用
        /// <summary>
        /// 把 CSV 字串切成 IQueryable<string>，給 EF 轉 SQL 用（不會在 .NET 端執行）
        /// </summary>
        public static IQueryable<SplitStringRow> SplitToStringTable(string csv) => throw new NotSupportedException();
        [Keyless] public class SplitStringRow
        {
            public string Id { get; set; } = default!; // 要和 UDF 的欄位別名 "Id" 對上
        }
        #endregion
        #endregion
        #region Protected
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            ModelDbSetting(builder);
            AutoBindRelationships(builder);
            ApplyCascadeDeleteRules(builder);
            builder.Entity<OperateLogModel>().ToTable("OperateLog");
            //builder.BuildIndexesFromAnnotations();//設置Index套件
            BindInverseNavigations(builder);         
            ApplyGlobalDeleteBehavior(builder);      
            SetDateTimeDBType(builder);
            RegistUDF(builder);
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
        /// 依慣例自動綁定一對多關聯：
        /// 規則：實體上的「導航屬性 Nav (class 非 string)」
        ///      若存在同名外鍵「{Nav}Id」，且 {Nav} 的型別是模型中的實體，
        ///      則建立 HasOne(Nav).WithMany().HasForeignKey("{Nav}Id").OnDelete(NoAction)。
        /// 注意：FK 可空時，在查詢層 Include 會生成 LEFT JOIN；非空時語意較接近 INNER。
        /// </summary>
        private static void AutoBindRelationships(ModelBuilder mb)
        {
            foreach (var entityType in mb.Model.GetEntityTypes())
            {
                var clr = entityType.ClrType;
                if (clr == null) continue;

                var props = clr.GetProperties(BindingFlags.Public | BindingFlags.Instance);

                foreach (var navProp in props)
                {
                    // 只處理 class 導航且排除 string（延續原本嚴格規則）
                    var navType = navProp.PropertyType;
                    if (navType == typeof(string) || !navType.IsClass) continue;

                    // 必須有 [ForeignKey]（不做名稱猜測）
                    var fkAttr = navProp.GetCustomAttribute<ForeignKeyAttribute>();
                    if (fkAttr == null) continue;
                    if (string.IsNullOrWhiteSpace(fkAttr.Name)) continue;

                    // 1) 解析外鍵欄位（支援 "A,B, C"）
                    var fkNames = fkAttr.Name
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim())
                        .ToArray();
                    if (fkNames.Length == 0) continue;

                    // 2) 全部外鍵屬性都要存在
                    var fkProps = fkNames
                        .Select(n => props.FirstOrDefault(p => p.Name == n))
                        .ToArray();
                    if (fkProps.Any(p => p == null)) continue;

                    // 3) 導航型別必須是 EF 追蹤的實體
                    var principalEntityType = mb.Model.FindEntityType(navType);
                    if (principalEntityType == null) continue;

                    // 4) 只支援對主鍵（與原本邏輯一致）
                    var principalPk = principalEntityType.FindPrimaryKey();
                    if (principalPk == null) continue;

                    // 5) 複合長度要一致（單欄位時等於 1）
                    if (principalPk.Properties.Count != fkProps.Length) continue;

                    // 6) 型別逐一比對（允許外鍵是 Nullable）
                    bool typeMismatch = false;
                    for (int i = 0; i < fkProps.Length; i++)
                    {
                        var fkClr = Nullable.GetUnderlyingType(fkProps[i]!.PropertyType) ?? fkProps[i]!.PropertyType;
                        var pkClr = principalPk.Properties[i].ClrType;
                        if (fkClr != pkClr) { typeMismatch = true; break; }
                    }
                    if (typeMismatch) continue;

                    // 7) 建立關聯（單一/複合皆可）
                    var rel = mb.Entity(clr).HasOne(navType, navProp.Name).WithMany();
                    if (fkNames.Length == 1)
                        rel.HasForeignKey(fkNames[0]).OnDelete(DeleteBehavior.NoAction);
                    else
                        rel.HasForeignKey(fkNames).OnDelete(DeleteBehavior.NoAction);
                }
            }
        }
        private static bool IsCollectionType(Type t)
        {
            if (t == typeof(string)) return false;
            if (t.IsArray) return true;
            if (!t.IsGenericType) return typeof(System.Collections.IEnumerable).IsAssignableFrom(t);
            return typeof(System.Collections.IEnumerable).IsAssignableFrom(t);
        }

        private static Type? GetEnumerableElementType(Type t)
        {
            if (t.IsArray) return t.GetElementType();
            if (t.IsGenericType) return t.GetGenericArguments().FirstOrDefault();
            return null;
        }
        /// <summary>
        /// 🟢 自動補全反向導航（支援複合 FK 與 [InverseProperty]）
        /// </summary>
        /// <param name="builder"></param>
        private static void BindInverseNavigations(ModelBuilder builder)
        {
            foreach (var et in builder.Model.GetEntityTypes())
            {
                var clr = et.ClrType;

                var navProps = clr.GetProperties()
                    .Where(p =>
                        Attribute.IsDefined(p, typeof(ForeignKeyAttribute)) &&
                        !IsCollectionType(p.PropertyType) &&
                        p.PropertyType.IsClass && !p.PropertyType.IsAbstract);

                foreach (var nav in navProps)
                {
                    var fkAttr = nav.GetCustomAttribute<ForeignKeyAttribute>();
                    if (fkAttr == null) continue;

                    var principalClr = nav.PropertyType;

                    // 🔍 關鍵：除了 InverseProperty.Property 要等於 nav.Name
                    //      還要「集合元素型別 == 目前的子類型 (clr)」
                    var inverseOnPrincipal = principalClr.GetProperties()
                        .FirstOrDefault(p =>
                        {
                            var inv = p.GetCustomAttribute<InversePropertyAttribute>();
                            if (inv?.Property != nav.Name) return false;

                            var pt = p.PropertyType;
                            if (IsCollectionType(pt))
                            {
                                var elem = GetEnumerableElementType(pt);
                                return elem == clr;            // ✅ 集合元素必須是子類型
                            }
                            else
                            {
                                return pt == clr;             // 1:1 的情況（少見）
                            }
                        });

                    var fkNames = fkAttr.Name.Split(',').Select(s => s.Trim()).ToArray();

                    var dep = builder.Entity(clr).HasOne(principalClr, navigationName: nav.Name);
                    var rel = (inverseOnPrincipal != null)
                        ? dep.WithMany(inverseOnPrincipal.Name)
                        : dep.WithMany();

                    rel.HasForeignKey(fkNames);
                }
            }
        }
        private static void ApplyGlobalDeleteBehavior(ModelBuilder builder)
        {
            foreach (var fk in builder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                if (fk.IsOwnership) continue;                    // 跳過 OwnedType
                if (fk.DeclaringEntityType.IsOwned()) continue;  // 跳過 OwnedType

                if (fk.IsRequired)                                // 🟢 必填 FK
                    fk.DeleteBehavior = DeleteBehavior.Cascade;   //    → 刪主體會連動刪子項；移除關聯也不會丟例外
                else                                              //    選填 FK
                    fk.DeleteBehavior = DeleteBehavior.ClientSetNull; // → 由 EF 把 FK 設 null（DB 不做級聯）
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
        /// <summary>
        /// 註冊UDF功能
        /// </summary>
        public static void RegistUDF(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDbFunction(typeof(ApplicationDbContext).GetMethod(nameof(SplitToStringTable), [typeof(string)])!).HasName(nameof(SplitToStringTable)).HasSchema("dbo");
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

    public sealed class WcmsTypeProvider : DefaultDynamicLinqCustomTypeProvider
    {
        // 新版建構子：用 ParsingConfig 的這個，不要用舊的 bool 那個（已 Obsolete）
        public WcmsTypeProvider() : base(new ParsingConfig()) { }

        // 你的套件版本：覆寫無參數的 GetCustomTypes()
        public override HashSet<Type> GetCustomTypes()
        {
            var set = base.GetCustomTypes();
            set.Add(typeof(ApplicationDbContext));                    // 讓解析器認得
            set.Add(typeof(ApplicationDbContext.SplitStringRow));     // UDF 的回傳型別（可選）
            return set;
        }
    }
}
