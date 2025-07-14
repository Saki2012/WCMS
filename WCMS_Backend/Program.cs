
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.Features.SiteEdit.PageManagement;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
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
                { policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost" || new Uri(origin).Host == "127.0.0.1").AllowAnyHeader().AllowAnyMethod();});
            });
            var app = builder.Build();
            app.UseMiddleware<ErrorHandlingMiddleware>();
            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
            app.UseCors("AllowLocalhostWildcard");
            app.Run();
        }


        private static void RunDBMigration(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(builder.Configuration.GetConnectionString("SqlConnection")).Options;
            var ctx = new ApplicationDbContext(options);
            ctx.Database.EnsureCreated(); // 讓它觸發 OnModelCreating

            Console.WriteLine("Context created.");
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
