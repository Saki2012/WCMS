using Microsoft.Data.SqlClient;
using System.Data;
using WCMS.SysCore.Persistence;

namespace WCMS.SysCore.Library
{
    public static class MigrateOldData
    {
        public static DataSet GetOldData(Dictionary<string, string> sqls)
        {
            var config = LibDataAccess.Configuration;
            var connectionString = config.GetConnectionString("OldDb");
            using var conn = new SqlConnection(connectionString);
            var ds = new DataSet();
            foreach (var sql in sqls)
            {
                var tableName = sql.Key;
                var query = sql.Value;
                using var adapter = new SqlDataAdapter(query, conn);
                var dt = new DataTable(tableName);
                adapter.Fill(dt);
                ds.Tables.Add(dt);
            }
            return ds;
        }
        public static string ChangeProgId(string module)
        {
            return module switch
            {
                "Page" => "PageManagement",
                "News"=> "Announcement",
                "Archive"=> "FileArchive",
                "ResearchProject" => "SpecResearch",
                "USRProject" => "SpecUSR",
                _ => module,
            };
        }
    }
}