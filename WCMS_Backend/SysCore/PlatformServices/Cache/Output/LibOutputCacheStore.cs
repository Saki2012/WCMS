using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace WCMS.SysCore.PlatformServices.Cache.Output;

/// <summary>
/// 將 ASP.NET Core OutputCache 統一導向 WCMS DistributedOnly Cache 路由。
/// </summary>
public sealed class LibOutputCacheStore(ICacheRoute cacheRoute, IOptions<CacheSettings> settings) : IOutputCacheStore
{
    #region Property
    private static readonly CacheOptions ReadOptions = BuildCacheOptions(TimeSpan.FromMinutes(1));
    private readonly ICacheRoute _cacheRoute = cacheRoute;
    private readonly CacheSettings _settings = settings.Value;
    private readonly ConcurrentDictionary<string, OutputTagLockEntry> _tagLocks = new(StringComparer.Ordinal);
    #endregion

    #region Public
    /// <summary>
    /// 依 OutputCache Key 讀取已保存的 Response Payload。
    /// </summary>
    public async ValueTask<byte[]?> GetAsync(string key, CancellationToken cancellationToken)
    {
        string entryKey = BuildEntryKey(key);
        CacheReadResult<OutputCacheEntryData> cached = await _cacheRoute.GetAsync<OutputCacheEntryData>(entryKey, ReadOptions, cancellationToken);
        return cached.IsHit ? cached.Value?.Payload : null;
    }
    /// <summary>
    /// 保存 Response Payload，並建立所有 Tag 與 Entry 的關聯索引。
    /// </summary>
    public async ValueTask SetAsync(string key, byte[] value, string[]? tags, TimeSpan validFor, CancellationToken cancellationToken)
    {
        ValidateSetArguments(key, validFor);
        string entryKey = BuildEntryKey(key);
        OutputCacheEntryData? previous = await ReadEntryAsync(entryKey, cancellationToken);
        OutputCacheEntryData current = BuildEntry(value, tags, validFor);
        await _cacheRoute.SetAsync(entryKey, current, BuildCacheOptions(validFor), cancellationToken);
        if (previous != null) await RemoveTagRegistrationsAsync(entryKey, previous, cancellationToken);
        await AddTagRegistrationsAsync(entryKey, current, cancellationToken);
    }
    /// <summary>
    /// 清除指定 Tag 對應的所有 OutputCache Entry。
    /// </summary>
    public async ValueTask EvictByTagAsync(string tag, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(tag)) return;
        string tagKey = BuildTagKey(tag);
        OutputCacheTagIndexData? index = await TakeTagIndexAsync(tagKey, cancellationToken);
        if (index == null) return;
        foreach (OutputCacheTagRegistration registration in GetActiveRegistrations(index))
            await RemoveEntryAsync(registration, tag, cancellationToken);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立保存 Response 與 Tag 資訊的 OutputCache Entry。
    /// </summary>
    private static OutputCacheEntryData BuildEntry(byte[] value, string[]? tags, TimeSpan validFor)
    {
        return new OutputCacheEntryData
        {
            EntryId = Guid.NewGuid(),
            Payload = [.. value],
            Tags = NormalizeTags(tags),
            ExpiresAtUtc = DateTimeOffset.UtcNow.Add(validFor),
        };
    }
    /// <summary>
    /// 建立 DistributedOnly 與 Absolute Expiration 的 Cache 設定。
    /// </summary>
    private static CacheOptions BuildCacheOptions(TimeSpan expiration)
    {
        return new CacheOptions
        {
            Mode = CacheMode.DistributedOnly,
            ExpirationStrategy = CacheExpirationStrategy.Absolute,
            Expiration = expiration,
        };
    }
    /// <summary>
    /// 正規化 Tag，避免空白與重複索引。
    /// </summary>
    private static string[] NormalizeTags(string[]? tags)
    {
        return tags?.Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Distinct(StringComparer.Ordinal)
            .ToArray() ?? [];
    }
    /// <summary>
    /// 驗證 OutputCache 寫入參數。
    /// </summary>
    private static void ValidateSetArguments(string key, TimeSpan validFor)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("OutputCache Key 不可為空白。", nameof(key));
        if (validFor <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(validFor), "OutputCache 有效時間必須大於零。");
    }
    /// <summary>
    /// 讀取目前 Entry，供覆寫與 Tag 清除時確認 EntryId。
    /// </summary>
    private async Task<OutputCacheEntryData?> ReadEntryAsync(string entryKey, CancellationToken ct)
    {
        CacheReadResult<OutputCacheEntryData> cached = await _cacheRoute.GetAsync<OutputCacheEntryData>(entryKey, ReadOptions, ct);
        return cached.IsHit ? cached.Value : null;
    }
    /// <summary>
    /// 將目前 Entry 登記到所有 Tag Index。
    /// </summary>
    private async Task AddTagRegistrationsAsync(string entryKey, OutputCacheEntryData entry, CancellationToken ct)
    {
        foreach (string tag in entry.Tags)
        {
            var registration = new OutputCacheTagRegistration
            {
                EntryKey = entryKey,
                EntryId = entry.EntryId,
                ExpiresAtUtc = entry.ExpiresAtUtc,
            };
            await AddTagRegistrationAsync(tag, registration, ct);
        }
    }
    /// <summary>
    /// 將單一 Entry Registration 寫入指定 Tag Index。
    /// </summary>
    private async Task AddTagRegistrationAsync(string tag, OutputCacheTagRegistration registration, CancellationToken ct)
    {
        string tagKey = BuildTagKey(tag);
        OutputTagLockEntry tagLock = await AcquireTagLockAsync(tagKey, ct);
        try
        {
            OutputCacheTagIndexData index = await ReadTagIndexAsync(tagKey, ct) ?? new();
            index.Registrations = GetActiveRegistrations(index)
                .Where(item => item.EntryKey != registration.EntryKey)
                .Append(registration)
                .ToList();
            await SaveTagIndexAsync(tagKey, index, ct);
        }
        finally
        {
            ReleaseTagLock(tagKey, tagLock);
        }
    }
    /// <summary>
    /// 從舊 Entry 的所有 Tag Index 移除 Registration。
    /// </summary>
    private async Task RemoveTagRegistrationsAsync(string entryKey, OutputCacheEntryData entry, CancellationToken ct)
    {
        foreach (string tag in entry.Tags)
            await RemoveTagRegistrationAsync(tag, entryKey, entry.EntryId, ct);
    }
    /// <summary>
    /// 從指定 Tag Index 移除符合 EntryKey 與 EntryId 的 Registration。
    /// </summary>
    private async Task RemoveTagRegistrationAsync(string tag, string entryKey, Guid entryId, CancellationToken ct)
    {
        string tagKey = BuildTagKey(tag);
        OutputTagLockEntry tagLock = await AcquireTagLockAsync(tagKey, ct);
        try
        {
            OutputCacheTagIndexData? index = await ReadTagIndexAsync(tagKey, ct);
            if (index == null) return;
            index.Registrations = GetActiveRegistrations(index)
                .Where(item => item.EntryKey != entryKey || item.EntryId != entryId)
                .ToList();
            await SaveTagIndexAsync(tagKey, index, ct);
        }
        finally
        {
            ReleaseTagLock(tagKey, tagLock);
        }
    }
    /// <summary>
    /// 取得並移除指定 Tag Index，避免同一批 Entry 被重複清除。
    /// </summary>
    private async Task<OutputCacheTagIndexData?> TakeTagIndexAsync(string tagKey, CancellationToken ct)
    {
        OutputTagLockEntry tagLock = await AcquireTagLockAsync(tagKey, ct);
        try
        {
            OutputCacheTagIndexData? index = await ReadTagIndexAsync(tagKey, ct);
            if (index != null) await _cacheRoute.RemoveAsync(tagKey, ReadOptions, ct);
            return index;
        }
        finally
        {
            ReleaseTagLock(tagKey, tagLock);
        }
    }
    /// <summary>
    /// 讀取指定 Tag 的 Entry Registration 清單。
    /// </summary>
    private async Task<OutputCacheTagIndexData?> ReadTagIndexAsync(string tagKey, CancellationToken ct)
    {
        CacheReadResult<OutputCacheTagIndexData> cached = await _cacheRoute.GetAsync<OutputCacheTagIndexData>(tagKey, ReadOptions, ct);
        return cached.IsHit ? cached.Value : null;
    }
    /// <summary>
    /// 保存 Tag Index，沒有有效 Registration 時直接移除。
    /// </summary>
    private async Task SaveTagIndexAsync(string tagKey, OutputCacheTagIndexData index, CancellationToken ct)
    {
        index.Registrations = GetActiveRegistrations(index).ToList();
        if (index.Registrations.Count == 0)
        {
            await _cacheRoute.RemoveAsync(tagKey, ReadOptions, ct);
            return;
        }
        TimeSpan expiration = GetTagIndexExpiration(index);
        await _cacheRoute.SetAsync(tagKey, index, BuildCacheOptions(expiration), ct);
    }
    /// <summary>
    /// 清除仍指向目前 EntryId 的 Response，並同步整理其他 Tag Index。
    /// </summary>
    private async Task RemoveEntryAsync(OutputCacheTagRegistration registration, string sourceTag, CancellationToken ct)
    {
        OutputCacheEntryData? entry = await ReadEntryAsync(registration.EntryKey, ct);
        if (entry == null || entry.EntryId != registration.EntryId) return;
        await _cacheRoute.RemoveAsync(registration.EntryKey, ReadOptions, ct);
        foreach (string tag in entry.Tags.Where(tag => !string.Equals(tag, sourceTag, StringComparison.Ordinal)))
            await RemoveTagRegistrationAsync(tag, registration.EntryKey, registration.EntryId, ct);
    }
    /// <summary>
    /// 只保留尚未過期的 Tag Registration。
    /// </summary>
    private static IEnumerable<OutputCacheTagRegistration> GetActiveRegistrations(OutputCacheTagIndexData index)
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        return index.Registrations.Where(item => item.ExpiresAtUtc > now);
    }
    /// <summary>
    /// 以最晚 Entry 到期時間決定 Tag Index 的有效時間。
    /// </summary>
    private static TimeSpan GetTagIndexExpiration(OutputCacheTagIndexData index)
    {
        DateTimeOffset latest = index.Registrations.Max(item => item.ExpiresAtUtc);
        TimeSpan expiration = latest - DateTimeOffset.UtcNow;
        return expiration > TimeSpan.Zero ? expiration : TimeSpan.FromSeconds(1);
    }
    /// <summary>
    /// 取得並等待目前 Process 內的 Tag Index 操作鎖。
    /// </summary>
    private async Task<OutputTagLockEntry> AcquireTagLockAsync(string tagKey, CancellationToken ct)
    {
        while (true)
        {
            OutputTagLockEntry tagLock = _tagLocks.GetOrAdd(tagKey, _ => new());
            if (!tagLock.TryAddReference())
            {
                await Task.Yield();
                continue;
            }
            if (IsCurrentTagLock(tagKey, tagLock))
            {
                try
                {
                    await tagLock.Semaphore.WaitAsync(ct);
                    return tagLock;
                }
                catch
                {
                    ReleaseTagLockReference(tagKey, tagLock);
                    throw;
                }
            }
            ReleaseTagLockReference(tagKey, tagLock);
        }
    }
    /// <summary>
    /// 釋放 Tag Lock，沒有持有者或等待者時同步回收 Registry。
    /// </summary>
    private void ReleaseTagLock(string tagKey, OutputTagLockEntry tagLock)
    {
        tagLock.Semaphore.Release();
        ReleaseTagLockReference(tagKey, tagLock);
    }
    /// <summary>
    /// 釋放 Tag Lock 引用，最後一個引用負責移除並釋放 Semaphore。
    /// </summary>
    private void ReleaseTagLockReference(string tagKey, OutputTagLockEntry tagLock)
    {
        if (!tagLock.ReleaseReference()) return;
        if (!IsCurrentTagLock(tagKey, tagLock)) return;
        if (!_tagLocks.TryRemove(tagKey, out OutputTagLockEntry? removed)) return;
        if (ReferenceEquals(removed, tagLock)) removed.Semaphore.Dispose();
    }
    /// <summary>
    /// 確認指定 Tag Lock 仍為 Registry 目前使用中的實例。
    /// </summary>
    private bool IsCurrentTagLock(string tagKey, OutputTagLockEntry tagLock)
    {
        return _tagLocks.TryGetValue(tagKey, out OutputTagLockEntry? current)
            && ReferenceEquals(current, tagLock);
    }
    /// <summary>
    /// 建立 OutputCache Response 的隔離 Key。
    /// </summary>
    private string BuildEntryKey(string key)
    {
        return $"{_settings.OutputKeyPrefix}entry:{HashKey(key)}";
    }
    /// <summary>
    /// 建立 OutputCache Tag Index 的隔離 Key。
    /// </summary>
    private string BuildTagKey(string tag)
    {
        return $"{_settings.OutputKeyPrefix}tag:{HashKey(tag)}";
    }
    /// <summary>
    /// 將原始 Key 轉成固定長度的安全識別值。
    /// </summary>
    private static string HashKey(string value)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hash);
    }
    #endregion
}

/// <summary>
/// 保存單一 Output Tag Lock 與其持有／等待引用數。
/// </summary>
internal sealed class OutputTagLockEntry
{
    #region Property
    private int _referenceCount;
    /// <summary>
    /// Tag Index 序列化操作使用的 Semaphore。
    /// </summary>
    internal SemaphoreSlim Semaphore { get; } = new(1, 1);
    #endregion

    #region Internal
    /// <summary>
    /// 嘗試加入持有或等待引用；進入回收狀態後拒絕新引用。
    /// </summary>
    internal bool TryAddReference()
    {
        while (true)
        {
            int count = Volatile.Read(ref _referenceCount);
            if (count < 0) return false;
            if (Interlocked.CompareExchange(ref _referenceCount, count + 1, count) == count)
                return true;
        }
    }
    /// <summary>
    /// 釋放引用，最後一個引用將狀態切換為回收中。
    /// </summary>
    internal bool ReleaseReference()
    {
        int count = Interlocked.Decrement(ref _referenceCount);
        if (count != 0) return false;
        return Interlocked.CompareExchange(ref _referenceCount, -1, 0) == 0;
    }
    #endregion
}

/// <summary>
/// 保存單一 OutputCache Response 與 Tag 資訊。
/// </summary>
internal sealed class OutputCacheEntryData
{
    public Guid EntryId { get; set; }
    public byte[] Payload { get; set; } = [];
    public string[] Tags { get; set; } = [];
    public DateTimeOffset ExpiresAtUtc { get; set; }
}

/// <summary>
/// 保存單一 Tag 對應的 OutputCache Entry Registration。
/// </summary>
internal sealed class OutputCacheTagIndexData
{
    public List<OutputCacheTagRegistration> Registrations { get; set; } = [];
}

/// <summary>
/// 保存 Tag Index 中的 Entry 識別與有效時間。
/// </summary>
internal sealed class OutputCacheTagRegistration
{
    public string EntryKey { get; set; } = string.Empty;
    public Guid EntryId { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
}
