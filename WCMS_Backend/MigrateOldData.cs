
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.Features.SiteEdit.PageManagement;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using WCMS.SysCore.Middleware;

namespace WCMS
{
    public class MigrateOldData
    {
        //public static void Main(string[] args)
        //{
        //    //RunDBMigration(args);
        //    //return;
        //    var builder = WebApplication.CreateBuilder(args);
        //    builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("SqlConnection")));
        //    // Add services to the container.
        //    builder.Services.AddControllers().AddJsonOptions(opt => { opt.JsonSerializerOptions.PropertyNamingPolicy = null; });
        //    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        //    builder.Services.AddEndpointsApiExplorer();
        //    builder.Services.AddSwaggerGen();
        //    builder.Services.AddScoped(typeof(IBasicRepository<>), typeof(BasicRepository<>));
        //    builder.Services.AddScoped<IRepositoryMapProvider, RepositoryMapProvider>();
        //    RegisterBizServices(builder.Services);
        //    builder.Services.AddCors(options =>
        //    {//CORS (跨來源資源共享) 錯誤處理，之後架設客戶網站時再設置白名單
        //        options.AddPolicy("AllowLocalhostWildcard", policy =>
        //        { policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost" || new Uri(origin).Host == "127.0.0.1").AllowAnyHeader().AllowAnyMethod(); });
        //    });
        //    var app = builder.Build();
        //    app.UseMiddleware<ErrorHandlingMiddleware>();
        //    // Configure the HTTP request pipeline.
        //    if (app.Environment.IsDevelopment())
        //    {
        //        app.UseSwagger();
        //        app.UseSwaggerUI();
        //    }
        //    app.UseHttpsRedirection();
        //    app.UseAuthorization();
        //    app.MapControllers();
        //    app.UseCors("AllowLocalhostWildcard");
        //    app.Run();
        //}

        ///// <summary>
        ///// 啟動Server
        ///// </summary>
        //private static void StartServer()
        //{

        //}
        ///// <summary>
        ///// 獲取舊資料
        ///// </summary>
        //private static void GetOldData()
        //{

        //}
        ///// <summary>
        ///// 透過API執行轉換
        ///// </summary>
        //private static void ExecuteMigrate()
        //{

        //}
    }
}
