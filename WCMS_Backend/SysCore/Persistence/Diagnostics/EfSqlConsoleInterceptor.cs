using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;
using System.Diagnostics;
using System.Runtime.CompilerServices;
namespace WCMS.SysCore.Persistence.Diagnostics;

#if DEBUG
public sealed class EfSqlConsoleInterceptor : DbCommandInterceptor
{
    // ✅ 用 command 物件當 key 記錄 stopwatch（避免多執行緒衝突）
    private readonly ConditionalWeakTable<DbCommand, Stopwatch> _timers = new();

    // ✅ 專門印 SQL + 參數（Reader / Scalar / NonQuery 都會走到）
    public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
    {
        Start(command);
        Write(command, eventData);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override DbDataReader ReaderExecuted(DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
    {
        Stop(command, eventData);
        return base.ReaderExecuted(command, eventData, result);
    }

    public override InterceptionResult<object> ScalarExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
    {
        Start(command);
        Write(command, eventData);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override object ScalarExecuted(DbCommand command, CommandExecutedEventData eventData, object result)
    {
        Stop(command, eventData);
        return base.ScalarExecuted(command, eventData, result);
    }

    public override InterceptionResult<int> NonQueryExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
    {
        Start(command);
        Write(command, eventData);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override int NonQueryExecuted(DbCommand command, CommandExecutedEventData eventData, int result)
    {
        Stop(command, eventData);
        return base.NonQueryExecuted(command, eventData, result);
    }

    private void Start(DbCommand command)
    {
        var sw = new Stopwatch();
        sw.Start();
        _timers.AddOrUpdate(command, sw);
    }

    private void Stop(DbCommand command, CommandExecutedEventData eventData)
    {
        if (_timers.TryGetValue(command, out var sw))
        {
            sw.Stop();
            Console.WriteLine($"[EF SQL] DONE | {sw.ElapsedMilliseconds} ms | CommandId={eventData.CommandId}");
            Console.WriteLine("============================================================");
        }
    }

    private static void Write(DbCommand command, CommandEventData eventData)
    {
        Console.WriteLine("============================================================");
        Console.WriteLine($"[EF SQL] START | CommandId={eventData.CommandId}");

        // ✅ 這裡會印出你在 query.TagWith("...") 設的內容（很推薦）
        if (!string.IsNullOrWhiteSpace(eventData.CommandSource.ToString()))
        {
            // CommandSource 是 enum，不是你 tag；tag 會在 CommandText 裡以註解出現
        }

        // ✅ 完整 SQL（含 TagWith 的註解）
        Console.WriteLine(command.CommandText);

        // ✅ 參數值
        if (command.Parameters.Count > 0)
        {
            Console.WriteLine("[EF SQL] Parameters:");
            foreach (DbParameter p in command.Parameters)
            {
                Console.WriteLine($"  {p.ParameterName} = {p.Value} ({p.DbType})");
            }
        }
    }
}

internal static class ConditionalWeakTableExt
{
    /// <summary>ConditionalWeakTable 沒有 AddOrUpdate，自己補一個。</summary>
    public static void AddOrUpdate<TKey, TValue>(this ConditionalWeakTable<TKey, TValue> table, TKey key, TValue value)
        where TKey : class
        where TValue : class
    {
        table.Remove(key);
        table.Add(key, value);
    }
}
#endif
