
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Reflection;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Middleware;

namespace WCMS
{
    public class Program
    {
        public static void Main(string[] args)
        {
            //RunDBMigration(args);
            //return;
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("SqlConnection")));
            // Add services to the container.
            builder.Services.AddControllers().AddJsonOptions(opt => { opt.JsonSerializerOptions.PropertyNamingPolicy = null; });
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddScoped(typeof(IBasicRepository<>), typeof(BasicRepository<>));
            builder.Services.AddScoped<IRepositoryMapProvider, RepositoryMapProvider>();
            RegisterBizServices(builder.Services);
            builder.Services.AddCors(options =>
            {//CORS (跨來源資源共享) 錯誤處理，之後架設客戶網站時再設置白名單
                options.AddPolicy("AllowLocalhostWildcard", policy =>
                { policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost" || new Uri(origin).Host == "127.0.0.1" || new Uri(origin).Host == "wcms.it-easygoapp.com").
                    AllowAnyHeader().AllowAnyMethod();});
            });
            var app = builder.Build();
            app.UseMiddleware<ErrorHandlingMiddleware>();
            // Configure the HTTP request pipeline.
            //if (app.Environment.IsDevelopment())
            //{
                app.UseSwagger();
                app.UseSwaggerUI();
            //}
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
            app.UseCors("AllowLocalhostWildcard");


#if DEBUG
            //await OldDataImporter.RunAsync();
#endif
            app.Run();
        }


        private static void RunDBMigration(string[] args)
        {
            //先執行:dotnet ef migrations add MigrationName
            //最後執行:dotnet ef database update
            var builder = WebApplication.CreateBuilder();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(builder.Configuration.GetConnectionString("SqlConnection")).Options;
            using var ctx = new ApplicationDbContext(options);

            // 產出 SQL
            var migrator = ctx.Database.GetService<IMigrator>();
            var sql = migrator.GenerateScript(
                fromMigration: null, // 代表從頭開始
                toMigration: null,   // 到目前最新的 migration
                options: MigrationsSqlGenerationOptions.Idempotent);

            File.WriteAllText("Migrations/Generated.sql", sql);
            Console.WriteLine("Migration SQL script generated.");
        }

        /// <summary>
        /// 動態加載BizServices
        /// </summary>
        /// <param name="services"></param>
        private static void RegisterBizServices(IServiceCollection services)
        {
            var bizServiceType = typeof(BizService<>);
            var ibizServiceType = typeof(IBizService<>);
            var types = Assembly.GetExecutingAssembly()
                .GetTypes()
                .Where(type => !type.IsAbstract && !type.IsInterface && type != bizServiceType &&
                    type.GetInterfaces().Any(i =>
                        i.IsGenericType &&
                        i.GetGenericTypeDefinition() == ibizServiceType)
                )
                .Select(type => new
                {
                    Implementation = type,
                    Service = type.GetInterfaces().First(i =>
                        i.IsGenericType && i.GetGenericTypeDefinition() == ibizServiceType)
                });

            foreach (var type in types) services.AddScoped(type.Service, type.Implementation);
        }
    }
}
