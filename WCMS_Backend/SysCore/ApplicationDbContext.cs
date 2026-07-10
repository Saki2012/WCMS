using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Dynamic.Core;
using System.Linq.Dynamic.Core.CustomTypeProviders;
using System.Reflection;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
    /// <summary>
    /// 
    /// </summary>
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        #region Property
        public DbSet<SysDbProfile> SysDbProfile => Set<SysDbProfile>();
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
            BindSysDbProfile(builder);
            ApplyEnumStringConversions(builder);
            IgnoreDtoTypes(builder);
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
        /// 模型與Database綁定設置。
        /// </summary>
        private void ModelDbSetting(ModelBuilder builder)
        {
            Type[] modelTypes = [.. Assembly.GetExecutingAssembly().GetTypes()
                .Where(type => type.IsClass && !type.IsAbstract && typeof(DbModel).IsAssignableFrom(type))
                .Where(IsAllowedDbModelType)];
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
        /// 判斷目前 Model 是否允許納入 EF Model。
        /// </summary>
        private static bool IsAllowedDbModelType(Type type)
        {
            var ns = type.Namespace ?? string.Empty;
            if (!SpecSettings.IsSpecFeaturesNamespace(ns)) return true;
            return SpecSettings.IsCurrentSpecNamespace(ns);
        }
        /// <summary>
        /// 排除DTO型別不納入EF追蹤
        /// </summary>
        /// <param name="builder"></param>
        private static void IgnoreDtoTypes(ModelBuilder builder)
        {
            // 取得目前執行組件中的所有型別
            var asm = Assembly.GetExecutingAssembly();
            var dtoTypes = asm.GetTypes().Where(type => type.IsClass && !type.IsAbstract && type.Name.EndsWith("_DTO", StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var t in dtoTypes) builder.Ignore(t);   // 告訴 EF：這些型別不是實體，全部忽略
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
            // 先把 FK 按 (Dependent, Principal) 分組，找出「同表多重 FK」
            var fkGroups = builder.Model.GetEntityTypes()
                .SelectMany(e => e.GetForeignKeys())
                .Where(fk =>
                    !fk.IsOwnership &&
                    !fk.DeclaringEntityType.IsOwned() &&
                    !fk.PrincipalEntityType.IsOwned())
                .GroupBy(fk => new
                {
                    Dep = fk.DeclaringEntityType,   // dependent
                    Pri = fk.PrincipalEntityType    // principal
                })
                .ToList();

            foreach (var g in fkGroups)
            {
                var fks = g.ToList();

                // ✅ 同一 Dependent 對同一 Principal 有 2+ FK：全部禁用 Cascade
                if (fks.Count > 1)
                {
                    foreach (var fk in fks) fk.DeleteBehavior = DeleteBehavior.NoAction;
                    continue;
                }

                // 一般情境：照你原本規則處理
                var onlyFk = fks[0];

                if (onlyFk.IsRequired)
                    onlyFk.DeleteBehavior = DeleteBehavior.Cascade;
                else
                    onlyFk.DeleteBehavior = DeleteBehavior.ClientSetNull;
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
        /// <summary>
        /// 在 EF Model 建置階段掃描所有 Entity 屬性，套用指定 enum 的「存成 nvarchar 字串」轉換規則。
        /// </summary>
        private static void ApplyEnumStringConversions(ModelBuilder builder)
        {
            var specs = BuildEnumStringConversionSpecs();
            foreach (var et in builder.Model.GetEntityTypes())
            {
                if (et.IsOwned()) continue;
                foreach (var p in et.GetProperties())
                {
                    // non-nullable enum
                    var spec = specs.FirstOrDefault(s => s.EnumType == p.ClrType);
                    if (spec != null)
                    {
                        ApplySpec(p, spec, isNullable: false);
                        continue;
                    }

                    // nullable enum
                    var under = Nullable.GetUnderlyingType(p.ClrType);
                    if (under != null)
                    {
                        var specNullable = specs.FirstOrDefault(s => s.EnumType == under);
                        if (specNullable != null)
                        {
                            ApplySpec(p, specNullable, isNullable: true);
                        }
                    }
                }
            }
        }
        /// <summary>
        /// 將指定的 enum-string 轉換規則套用到某個 EF Property（含 converter、max length、nvarchar 型別）。
        /// </summary>
        private static void ApplySpec(IMutableProperty prop, EnumStringConversionSpec spec, bool isNullable)
        {
            prop.SetValueConverter(isNullable ? spec.NullableConverter : spec.Converter);
            prop.SetMaxLength(spec.MaxLength);
            prop.SetColumnType($"nvarchar({spec.MaxLength})");
        }
        /// <summary>
        /// 描述某個 enum 存成字串欄位時所需的轉換器與欄位長度設定。
        /// </summary>
        private sealed record EnumStringConversionSpec(Type EnumType,ValueConverter Converter,ValueConverter NullableConverter,int MaxLength);
        /// <summary>
        /// 建立「需要將 enum 以 nvarchar 字串儲存」的規則清單（可在此集中新增/調整 enum 規則）。
        /// </summary>
        private static List<EnumStringConversionSpec> BuildEnumStringConversionSpecs()
        {
            var list = new List<EnumStringConversionSpec>
            {
                // ✅ LangCode：用你自訂 mapping（ToCode/Normalize）
                CreateEnumSpec(
                maxLength: SysLengthParam.Lang,
                toProvider: (LangCode v) => v.ToCode(),
                fromProvider: (string v) => LangCodeExt.Normalize(v)
            )};

            // 之後要加新的 enum（也存字串）就只要再加一筆：
            // list.Add(CreateEnumSpec(
            //     maxLength: 20,
            //     toProvider: (YourEnum v) => v.ToDbCode(),
            //     fromProvider: (string v) => YourEnumExt.ParseDbCode(v)
            // ));
            return list;
        }
        /// <summary>
        /// 建立單一 enum 的「enum ↔ string」轉換規則（含 nullable 與非 nullable 版本）。
        /// </summary>
        private static EnumStringConversionSpec CreateEnumSpec<TEnum>(int maxLength,Func<TEnum, string> toProvider,Func<string, TEnum> fromProvider) where TEnum : struct, System.Enum
        {
            var converter = new ValueConverter<TEnum, string>(v => toProvider(v),v => fromProvider(v));
            var nullableConverter = new ValueConverter<TEnum?, string?>(v => v.HasValue ? toProvider(v.Value) : null,v => string.IsNullOrWhiteSpace(v) ? null : fromProvider(v!));
            return new EnumStringConversionSpec(EnumType: typeof(TEnum),Converter: converter,NullableConverter: nullableConverter,MaxLength: maxLength);
        }
        /// <summary>
        /// 綁定 DB 環境識別資料表。
        /// </summary>
        private static void BindSysDbProfile(ModelBuilder builder)
        {
            builder.Entity<SysDbProfile>(entity =>
            {
                entity.ToTable(nameof(SysDbProfile));
                entity.HasKey(p => p.ProfileKey);
                entity.Property(p => p.ProfileKey).HasMaxLength(100).IsRequired();
                entity.Property(p => p.ProfileValue).HasMaxLength(200).IsRequired();
                entity.Property(p => p.CreateTime).IsRequired();
                entity.Property(p => p.ModifyTime);
            });
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
