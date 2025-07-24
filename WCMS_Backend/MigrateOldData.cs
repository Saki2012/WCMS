
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Data;
using System.Reflection;
using System.Text;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.Features.SiteEdit.Tag;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Middleware;

namespace WCMS
{
    public class OldDataImporter
    {
        public static async Task RunAsync()
        {
            // 1. 連線舊資料庫抓資料
            //var connStr = "Server=192.168.68.2;Database=WebDevloper1810;User Id=WebDevloper;Password=WebDevloper;";
            //using (var conn = new SqlConnection(connStr))
            //{ 
            //// 2. 在此轉換 DataTable -> 組成對應格式物件 (請你自行處理)
            //var payload = ConvertToApiModel(conn);
            //}
            //// 3. 傳送至後端 API
            //using var http = new HttpClient { BaseAddress = new Uri("https://localhost:7030/") };
            //var response = await http.PostAsJsonAsync("Service/PageManagement/InitialCreateData", payload);

            //Console.WriteLine(response.IsSuccessStatusCode
            //    ? "✅ 資料上傳成功"
            //    : $"❌ 錯誤: {response.StatusCode}");
        }

        // 👉 留給你實作的資料轉換範本
        private static object ConvertToApiModel(SqlConnection conn)
        {
            var sql = "SELECT * FROM Page A JOIN Page_Lang B ON A.Sn = B.Sn";
            var dt = new DataTable();
            using (var cmd = new SqlCommand(sql, conn))
            using (var adapter = new SqlDataAdapter(cmd))
            {
                conn.Open();
                adapter.Fill(dt);
            }
            var result = new
            {
                sets = new[] {
                    new {
                        PageManagement = new {
                            PageId = "1",
                            CategoryId = "1",
                            ViewCount = 0,
                            IsIniData = true
                        },
                        PageManagementDetail = new[] {
                            new { PageId = "1", RowId = 1, Lang = "en", Title = "Title", Content = "HTML Content" },
                            new { PageId = "1", RowId = 2, Lang = "zh-tw", Title = "標題", Content = "內容" }
                        }
                    }
                }
            };
            return result;
        }
    }
}
