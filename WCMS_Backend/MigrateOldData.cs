
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
    public class MigrateOldData
    {
        public interface IDataMigrationService
        {
            Task RunAsync();
        }

        public class DataMigrationService : IDataMigrationService
        {
            private readonly IServiceProvider _provider;
            private readonly HttpClient _httpClient;

            public DataMigrationService(IHttpClientFactory httpClientFactory, IServiceProvider provider)
            {
                _httpClient = httpClientFactory.CreateClient("api");
                _provider = provider;
            }

            public async Task RunAsync()
            {
                var connStr = "Server=192.168.68.2;Database=WebDeveloper;User Id=WebDeveloper;Password=WebDeveloper;";
                using var conn = new SqlConnection(connStr);
                MigrateData_Tag(conn);
            }

            private void MigrateData_Tag(SqlConnection conn)
            {
                List<TagSet> tagSets = [];
                var data = new DataTable();
                var sql = "SELECT * FROM Tag";
                var adapter = new SqlDataAdapter(sql, conn);
                adapter.Fill(data);
                foreach (DataRow row in data.Rows)
                {
                    tagSets.Add(new TagSet
                    {
                        TagData = new TagData
                        {
                            TagId = row["sn"].ToString(),
                            ProgId = row["Module"].ToString(),
                            IsIniData = true
                        },
                        TagDetail = []
                    });
                }

                sql = "SELECT * FROM Tag_Lang";
                adapter = new SqlDataAdapter(sql, conn);
                adapter.Fill(data);
                foreach (DataRow row in data.Rows)
                {
                    string tagId = row["sn"].ToString();
                    var dt = tagSets.FirstOrDefault(p=>p.TagData.TagId==tagId)?.TagDetail;
                    dt.Add(new TagDetail
                    {
                        TagId = tagId,
                        Lang = row["Lang"].ToString(),
                        TagName = row["TagName"].ToString()
                    });
                }


            }
        }
    }
}
