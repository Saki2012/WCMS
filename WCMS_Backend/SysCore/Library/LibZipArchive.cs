using System.Buffers;
using System.IO.Compression;
namespace WCMS.SysCore.Library;

/// <summary>
/// 定義 ZIP 解壓時的安全限制與篩選條件。
/// </summary>
public sealed class ZipExtractOptions
{
    /// <summary>
    /// 允許處理的最大檔案項目數量。
    /// </summary>
    public int MaxEntryCount { get; init; } = 1000;
    /// <summary>
    /// 單一檔案允許解壓的最大位元組數。
    /// </summary>
    public long MaxEntryLength { get; init; } = 200L * 1024 * 1024;
    /// <summary>
    /// 整份 ZIP 允許解壓的最大位元組數。
    /// </summary>
    public long MaxTotalLength { get; init; } = 1024L * 1024 * 1024;
    /// <summary>
    /// 指示是否允許覆蓋目的地既有檔案。
    /// </summary>
    public bool OverwriteExisting { get; init; }
    /// <summary>
    /// 判斷指定 ZIP 項目是否需要解壓；未設定時會處理全部檔案項目。
    /// </summary>
    public Func<string, bool>? ShouldExtractEntry { get; init; }
}
/// <summary>
/// 表示完成安全解壓後的結果。
/// </summary>
public sealed class ZipExtractResult
{
    /// <summary>
    /// ZIP 壓縮檔的完整路徑。
    /// </summary>
    public string ArchivePath { get; init; } = string.Empty;
    /// <summary>
    /// 解壓目的根目錄的完整路徑。
    /// </summary>
    public string DestinationPath { get; init; } = string.Empty;
    /// <summary>
    /// 實際完成解壓的檔案清單。
    /// </summary>
    public IReadOnlyList<ZipExtractedFile> Files { get; init; } = [];
    /// <summary>
    /// 實際完成解壓的總位元組數。
    /// </summary>
    public long TotalLength { get; init; }
    /// <summary>
    /// 依篩選條件略過的檔案項目數量。
    /// </summary>
    public int SkippedEntryCount { get; init; }
}
/// <summary>
/// 表示單一完成解壓的檔案資訊。
/// </summary>
public sealed class ZipExtractedFile
{
    /// <summary>
    /// ZIP 內原始項目名稱。
    /// </summary>
    public string EntryName { get; init; } = string.Empty;
    /// <summary>
    /// 相對於解壓根目錄的檔案路徑。
    /// </summary>
    public string RelativePath { get; init; } = string.Empty;
    /// <summary>
    /// 解壓後檔案的完整路徑。
    /// </summary>
    public string FullPath { get; init; } = string.Empty;
    /// <summary>
    /// 實際完成解壓的位元組數。
    /// </summary>
    public long Length { get; init; }
}
/// <summary>
/// 提供 ZIP 檔案的安全解壓共用方法。
/// </summary>
public static class LibZipArchive
{
    #region Property
    private const int CopyBufferSize = 81920;
    private const string TemporaryExtension = ".wcms-extracting";
    private const string PortableInvalidCharacters = "<>:\"|?*";
    private static readonly HashSet<string> ReservedWindowsNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    };
    #endregion

    #region Public
    /// <summary>
    /// 將 ZIP 內容安全解壓至指定目錄，並回傳實際產生的檔案資訊。
    /// </summary>
    public static async Task<ZipExtractResult> ExtractAsync(string archivePath, string destinationPath, ZipExtractOptions? options = null, CancellationToken ct = default)
    {
        ZipExtractOptions resolvedOptions = options ?? new ZipExtractOptions();
        ValidateArguments(archivePath, destinationPath, resolvedOptions);
        string archiveFullPath = Path.GetFullPath(archivePath);
        string destinationFullPath = Path.GetFullPath(destinationPath);
        Directory.CreateDirectory(destinationFullPath);
        return await ExtractArchiveAsync(archiveFullPath, destinationFullPath, resolvedOptions, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 開啟 ZIP 並依安全限制完成全部檔案解壓。
    /// </summary>
    private static async Task<ZipExtractResult> ExtractArchiveAsync(string archivePath, string destinationPath, ZipExtractOptions options, CancellationToken ct)
    {
        List<string> createdFiles = [];
        try
        {
            using ZipArchive archive = ZipFile.OpenRead(archivePath);
            ZipPlanResult planResult = BuildExtractPlans(archive, archivePath, destinationPath, options);
            List<ZipExtractedFile> files = await ExtractPlansAsync(planResult.Plans, options, createdFiles, ct);
            return BuildResult(archivePath, destinationPath, files, planResult.SkippedEntryCount);
        }
        catch
        {
            CleanupCreatedFiles(createdFiles);
            throw;
        }
    }

    /// <summary>
    /// 建立所有待解壓項目，並預先檢查項目數量、路徑與宣告容量。
    /// </summary>
    private static ZipPlanResult BuildExtractPlans(ZipArchive archive, string archivePath, string destinationPath, ZipExtractOptions options)
    {
        List<ZipEntryPlan> plans = [];
        HashSet<string> relativePaths = new(StringComparer.OrdinalIgnoreCase);
        int fileEntryCount = 0;
        int skippedEntryCount = 0;
        long declaredTotalLength = 0;
        foreach (ZipArchiveEntry entry in archive.Entries)
            AddExtractPlan(entry, archivePath, destinationPath, options, relativePaths, plans,
                ref fileEntryCount, ref skippedEntryCount, ref declaredTotalLength);
        return new ZipPlanResult(plans, skippedEntryCount);
    }

    /// <summary>
    /// 驗證並加入單一 ZIP 檔案項目的解壓計畫。
    /// </summary>
    private static void AddExtractPlan(ZipArchiveEntry entry, string archivePath, string destinationPath, ZipExtractOptions options, HashSet<string> relativePaths,
        List<ZipEntryPlan> plans, ref int fileEntryCount, ref int skippedEntryCount, ref long declaredTotalLength)
    {
        if (IsDirectoryEntry(entry)) return;
        ValidateEntryCount(++fileEntryCount, options.MaxEntryCount);
        if (options.ShouldExtractEntry?.Invoke(entry.FullName) == false)
        {
            skippedEntryCount++;
            return;
        }
        ValidateDeclaredLength(entry, options, ref declaredTotalLength);
        ZipEntryPlan plan = BuildEntryPlan(entry, archivePath, destinationPath);
        EnsureUniquePath(plan.RelativePath, relativePaths);
        plans.Add(plan);
    }

    /// <summary>
    /// 建立單一 ZIP 項目的安全目的地資訊。
    /// </summary>
    private static ZipEntryPlan BuildEntryPlan(ZipArchiveEntry entry, string archivePath, string destinationPath)
    {
        string relativePath = NormalizeRelativePath(entry.FullName);
        string fullPath = ResolveSafePath(destinationPath, relativePath);
        if (PathsEqual(fullPath, archivePath))
            throw new InvalidDataException($"ZIP 項目不可覆蓋來源壓縮檔：{entry.FullName}");
        return new ZipEntryPlan(entry, relativePath, fullPath);
    }

    /// <summary>
    /// 依序解壓全部計畫項目並累計實際容量。
    /// </summary>
    private static async Task<List<ZipExtractedFile>> ExtractPlansAsync(IReadOnlyList<ZipEntryPlan> plans, ZipExtractOptions options, List<string> createdFiles, CancellationToken ct)
    {
        List<ZipExtractedFile> files = [];
        long totalLength = 0;
        foreach (ZipEntryPlan plan in plans)
        {
            ZipExtractedFile file = await ExtractEntryAsync(plan, options, totalLength, createdFiles, ct);
            totalLength += file.Length;
            files.Add(file);
        }
        return files;
    }

    /// <summary>
    /// 將單一 ZIP 項目寫入暫存檔，通過容量檢查後再移至正式路徑。
    /// </summary>
    private static async Task<ZipExtractedFile> ExtractEntryAsync(ZipEntryPlan plan, ZipExtractOptions options, long currentTotalLength, List<string> createdFiles, CancellationToken ct)
    {
        string directory = Path.GetDirectoryName(plan.FullPath)!;
        Directory.CreateDirectory(directory);
        bool existedBefore = File.Exists(plan.FullPath);
        ValidateOverwrite(plan.FullPath, existedBefore, options.OverwriteExisting);
        string temporaryPath = BuildTemporaryPath(plan.FullPath);
        try
        {
            long length = await WriteTemporaryFileAsync(plan, temporaryPath, options, currentTotalLength, ct);
            File.Move(temporaryPath, plan.FullPath, options.OverwriteExisting);
            if (!existedBefore) createdFiles.Add(plan.FullPath);
            return BuildExtractedFile(plan, length);
        }
        finally
        {
            DeleteFileSilently(temporaryPath);
        }
    }

    /// <summary>
    /// 將 ZIP 項目內容寫入暫存檔並限制單檔與總解壓容量。
    /// </summary>
    private static async Task<long> WriteTemporaryFileAsync(
        ZipEntryPlan plan,
        string temporaryPath,
        ZipExtractOptions options,
        long currentTotalLength,
        CancellationToken ct)
    {
        await using Stream source = plan.Entry.Open();
        await using FileStream destination = new(
            temporaryPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            CopyBufferSize,
            FileOptions.Asynchronous | FileOptions.SequentialScan);
        return await CopyWithLimitsAsync(source, destination, plan.Entry.FullName,
            options, currentTotalLength, ct);
    }

    /// <summary>
    /// 複製項目內容並依實際輸出量即時阻擋 ZIP Bomb。
    /// </summary>
    private static async Task<long> CopyWithLimitsAsync(Stream source, Stream destination, string entryName, ZipExtractOptions options, long currentTotalLength, CancellationToken ct)
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(CopyBufferSize);
        long entryLength = 0;
        try
        {
            int read;
            while ((read = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
            {
                entryLength += read;
                ValidateActualLength(entryName, entryLength, currentTotalLength, options);
                await destination.WriteAsync(buffer.AsMemory(0, read), ct);
            }
            return entryLength;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }
    /// <summary>
    /// 驗證輸入路徑與安全限制設定是否可使用。
    /// </summary>
    private static void ValidateArguments(string archivePath, string destinationPath, ZipExtractOptions options)
    {
        if (string.IsNullOrWhiteSpace(archivePath)) throw new ArgumentException("ZIP 壓縮檔路徑不可為空。", nameof(archivePath));
        if (string.IsNullOrWhiteSpace(destinationPath)) throw new ArgumentException("解壓目的路徑不可為空。", nameof(destinationPath));
        if (!File.Exists(archivePath)) throw new FileNotFoundException("找不到 ZIP 壓縮檔。", archivePath);
        if (options.MaxEntryCount <= 0) throw new ArgumentOutOfRangeException(nameof(options.MaxEntryCount));
        if (options.MaxEntryLength <= 0) throw new ArgumentOutOfRangeException(nameof(options.MaxEntryLength));
        if (options.MaxTotalLength <= 0) throw new ArgumentOutOfRangeException(nameof(options.MaxTotalLength));
    }
    /// <summary>
    /// 驗證 ZIP 中的檔案項目數量未超出限制。
    /// </summary>
    private static void ValidateEntryCount(int entryCount, int maxEntryCount)
    {
        if (entryCount > maxEntryCount) throw new InvalidDataException($"ZIP 檔案項目數量超過限制：{maxEntryCount}");
    }
    /// <summary>
    /// 驗證 ZIP 宣告的單檔與累計解壓容量。
    /// </summary>
    private static void ValidateDeclaredLength(ZipArchiveEntry entry, ZipExtractOptions options, ref long totalLength)
    {
        if (entry.Length > options.MaxEntryLength) throw new InvalidDataException($"ZIP 項目超過單檔容量限制：{entry.FullName}");
        totalLength = checked(totalLength + entry.Length);
        if (totalLength > options.MaxTotalLength) throw new InvalidDataException($"ZIP 解壓總容量超過限制：{options.MaxTotalLength} bytes");
    }
    /// <summary>
    /// 驗證實際解壓容量未超出單檔與總量限制。
    /// </summary>
    private static void ValidateActualLength(string entryName, long entryLength, long currentTotalLength, ZipExtractOptions options)
    {
        if (entryLength > options.MaxEntryLength) throw new InvalidDataException($"ZIP 項目超過單檔容量限制：{entryName}");
        if (currentTotalLength + entryLength > options.MaxTotalLength) throw new InvalidDataException($"ZIP 解壓總容量超過限制：{options.MaxTotalLength} bytes");
    }
    /// <summary>
    /// 將 ZIP 項目路徑正規化為可跨平台使用的相對路徑。
    /// </summary>
    private static string NormalizeRelativePath(string entryName)
    {
        ValidateEntryName(entryName);
        string[] segments = entryName.Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries);
        foreach (string segment in segments) ValidatePathSegment(segment, entryName);
        return Path.Combine(segments);
    }
    /// <summary>
    /// 驗證 ZIP 項目名稱不得包含根路徑或空值。
    /// </summary>
    private static void ValidateEntryName(string entryName)
    {
        bool startsFromRoot = entryName.StartsWith('/') || entryName.StartsWith('\\');
        if (string.IsNullOrWhiteSpace(entryName) || startsFromRoot || Path.IsPathRooted(entryName))
            throw new InvalidDataException($"ZIP 項目路徑不合法：{entryName}");
    }
    /// <summary>
    /// 驗證單一路徑片段不含上層目錄、保留名稱或跨平台非法字元。
    /// </summary>
    private static void ValidatePathSegment(string segment, string entryName)
    {
        string baseName = Path.GetFileNameWithoutExtension(segment);
        bool invalid = segment is "." or ".."
            || segment.EndsWith(' ') || segment.EndsWith('.')
            || ReservedWindowsNames.Contains(baseName)
            || segment.Any(IsInvalidPathCharacter);
        if (invalid) throw new InvalidDataException($"ZIP 項目路徑不合法：{entryName}");
    }
    /// <summary>
    /// 判斷字元是否為控制字元或跨平台檔名非法字元。
    /// </summary>
    private static bool IsInvalidPathCharacter(char value)
    {
        return value == '\0' || char.IsControl(value) || PortableInvalidCharacters.Contains(value);
    }
    /// <summary>
    /// 解析目的完整路徑並確認仍位於指定解壓根目錄內。
    /// </summary>
    private static string ResolveSafePath(string destinationPath, string relativePath)
    {
        string rootPath = Path.GetFullPath(destinationPath);
        string fullPath = Path.GetFullPath(Path.Combine(rootPath, relativePath));
        string rootPrefix = rootPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;
        if (fullPath.StartsWith(rootPrefix, GetPathComparison())) return fullPath;
        throw new InvalidDataException($"ZIP 項目路徑超出解壓目錄：{relativePath}");
    }
    /// <summary>
    /// 確保 ZIP 中沒有兩個項目指向相同目的路徑。
    /// </summary>
    private static void EnsureUniquePath(string relativePath, HashSet<string> relativePaths)
    {
        if (!relativePaths.Add(relativePath)) throw new InvalidDataException($"ZIP 內含重複目的路徑：{relativePath}");
    }
    /// <summary>
    /// 驗證既有檔案是否可依目前設定覆蓋。
    /// </summary>
    private static void ValidateOverwrite(string fullPath, bool exists, bool overwriteExisting)
    {
        if (exists && !overwriteExisting) throw new IOException($"目的檔案已存在：{fullPath}");
    }
    /// <summary>
    /// 建立位於同一目錄內的唯一暫存檔路徑。
    /// </summary>
    private static string BuildTemporaryPath(string fullPath)
    {
        return $"{fullPath}.{Guid.NewGuid():N}{TemporaryExtension}";
    }
    /// <summary>
    /// 建立單一解壓檔案的回傳資訊。
    /// </summary>
    private static ZipExtractedFile BuildExtractedFile(ZipEntryPlan plan, long length)
    {
        return new ZipExtractedFile
        {
            EntryName = plan.Entry.FullName,
            RelativePath = plan.RelativePath.Replace(Path.DirectorySeparatorChar, '/'),
            FullPath = plan.FullPath,
            Length = length
        };
    }

    /// <summary>
    /// 建立整份 ZIP 解壓結果。
    /// </summary>
    private static ZipExtractResult BuildResult(string archivePath, string destinationPath, IReadOnlyList<ZipExtractedFile> files, int skippedEntryCount)
    {
        return new ZipExtractResult
        {
            ArchivePath = archivePath,
            DestinationPath = destinationPath,
            Files = files,
            TotalLength = files.Sum(file => file.Length),
            SkippedEntryCount = skippedEntryCount
        };
    }
    /// <summary>
    /// 判斷 ZIP 項目是否只代表目錄。
    /// </summary>
    private static bool IsDirectoryEntry(ZipArchiveEntry entry)
    {
        return string.IsNullOrEmpty(entry.Name);
    }
    /// <summary>
    /// 判斷兩個完整路徑是否指向相同位置。
    /// </summary>
    private static bool PathsEqual(string left, string right)
    {
        return string.Equals(left, right, GetPathComparison());
    }
    /// <summary>
    /// 取得符合目前作業系統檔案路徑規則的比較方式。
    /// </summary>
    private static StringComparison GetPathComparison()
    {
        return OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
    }
    /// <summary>
    /// 刪除本次失敗流程中新建立的檔案，避免留下不完整結果。
    /// </summary>
    private static void CleanupCreatedFiles(IEnumerable<string> createdFiles)
    {
        foreach (string file in createdFiles.Reverse()) DeleteFileSilently(file);
    }
    /// <summary>
    /// 嘗試刪除指定檔案，清理階段不覆蓋原始例外。
    /// </summary>
    private static void DeleteFileSilently(string filePath)
    {
        try
        {
            if (File.Exists(filePath)) File.Delete(filePath);
        }
        catch
        {
            // 清理失敗不取代原始解壓例外。
        }
    }
    /// <summary>
    /// 保存 ZIP 項目預檢後的解壓計畫與略過數量。
    /// </summary>
    private sealed class ZipPlanResult(List<ZipEntryPlan> plans, int skippedEntryCount)
    {
        /// <summary>
        /// 通過預檢並等待解壓的項目。
        /// </summary>
        public IReadOnlyList<ZipEntryPlan> Plans { get; } = plans;
        /// <summary>
        /// 依篩選條件略過的檔案項目數量。
        /// </summary>
        public int SkippedEntryCount { get; } = skippedEntryCount;
    }
    /// <summary>
    /// 保存單一 ZIP 項目的來源與安全目的路徑。
    /// </summary>
    private sealed class ZipEntryPlan(ZipArchiveEntry entry, string relativePath, string fullPath)
    {
        /// <summary>
        /// 原始 ZIP 項目。
        /// </summary>
        public ZipArchiveEntry Entry { get; } = entry;
        /// <summary>
        /// 正規化後的相對路徑。
        /// </summary>
        public string RelativePath { get; } = relativePath;
        /// <summary>
        /// 驗證後的完整目的路徑。
        /// </summary>
        public string FullPath { get; } = fullPath;
    }
    #endregion
}