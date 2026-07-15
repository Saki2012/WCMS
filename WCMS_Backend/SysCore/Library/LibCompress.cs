using System.IO.Compression;
using System.Text;
namespace WCMS.SysCore.Library;

/// <summary>
/// 提供共用 Brotli 字串壓縮與解壓縮方法。
/// </summary>
public static class LibCompress
{
    #region Public
    /// <summary>
    /// 將 UTF-8 字串以 Brotli 壓縮為位元組。
    /// </summary>
    public static byte[] BrotliCompressString(string value)
    {
        if (string.IsNullOrEmpty(value)) return [];

        byte[] source = Encoding.UTF8.GetBytes(value);
        using MemoryStream output = new();
        using (BrotliStream brotli = new(output, CompressionLevel.SmallestSize, leaveOpen: true))
        {
            brotli.Write(source);
        }
        return output.ToArray();
    }
    /// <summary>
    /// 將 Brotli 位元組解壓為 UTF-8 字串。
    /// </summary>
    public static string BrotliDecompressString(byte[]? data)
    {
        if (data == null || data.Length == 0) return string.Empty;

        using MemoryStream input = new(data);
        using BrotliStream brotli = new(input, CompressionMode.Decompress);
        using MemoryStream output = new();
        brotli.CopyTo(output);
        return Encoding.UTF8.GetString(output.ToArray());
    }
    #endregion
}
