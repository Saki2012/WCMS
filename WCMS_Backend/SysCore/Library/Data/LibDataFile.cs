using MimeDetective;
using MimeDetective.Storage;
using System.Security.Cryptography;
using System.Text;
using WCMS.SysCore.PlatformServices.FileManagement;
using static MimeDetective.Definitions.DefaultDefinitions;
namespace WCMS.SysCore.Library;

/// <summary>
/// 提供 Stream、檔案雜湊、格式與 MIME Type 辨識。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 將 Stream 讀取為位元組陣列並重設至開頭。
    /// </summary>
    public static byte[] StreamToBytes(this Stream stream)
    {
        byte[] bytes = new byte[stream.Length];
        stream.Read(bytes, 0, bytes.Length);
        stream.Seek(0, SeekOrigin.Begin);
        return bytes;
    }
    /// <summary>
    /// 取得上傳檔案內容的 SHA-256 雜湊值。
    /// </summary>
    public static string GetFileSHA256(IFormFile file)
    {
        ValidateUploadFile(file);
        using var ms = new MemoryStream();
        file.CopyTo(ms);
        ms.Position = 0;
        return GetFileSHA256(ms);
    }
    /// <summary>
    /// 取得指定檔案的 SHA-256 雜湊值。
    /// </summary>
    public static string GetFileSHA256(string filePath)
    {
        using var hashStream = File.OpenRead(filePath);
        hashStream.Position = 0;
        return GetFileSHA256(hashStream);
    }
    /// <summary>
    /// 取得 Stream 內容的 SHA-256 雜湊值。
    /// </summary>
    public static string GetFileSHA256(Stream stream)
    {
        var hashBytes = SHA256.HashData(stream);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }
    /// <summary>
    /// 依 Stream 內容辨識檔案副檔名。
    /// </summary>
    public static string GetFileExtenstion(Stream stream)
    {
        stream.Position = 0;
        var inspector = new ContentInspectorBuilder() { Definitions = All() }.Build();
        FileType fileType = inspector.Inspect(stream).OrderByDescending(p => p.Points).FirstOrDefault()?.Definition.File;
        stream.Position = 0;
        if (fileType != null) return fileType.Extensions.FirstOrDefault().ToLowerInvariant();
        return string.Empty;
    }
    /// <summary>
    /// 依 Stream 內容辨識 MIME Type。
    /// </summary>
    public static string GetFileMimeType(Stream stream)
    {
        stream.Position = 0;
        var inspector = new ContentInspectorBuilder() { Definitions = All() }.Build();
        FileType fileType = inspector.Inspect(stream).OrderByDescending(p => p.Points).FirstOrDefault()?.Definition.File;
        stream.Position = 0;
        if (fileType != null) return fileType.MimeType.ToLowerInvariant();
        return string.Empty;
    }
    /// <summary>
    /// 取得上傳檔案格式與 MIME Type，並處理 Office 格式例外。
    /// </summary>
    public static (string Extension, string MimeType) GetUploadFileMeta(Stream stream, string fileName)
    {
        string detectedExtension = GetFileExtenstion(stream);
        string detectedMimeType = GetFileMimeType(stream);
        string clientExtension = GetClientFileExtension(fileName);
        if (ShouldUseEncryptedOfficeMeta(stream, detectedExtension, clientExtension)) return (clientExtension, GetOfficeOpenXmlMimeType(clientExtension));
        if (ShouldUseLegacyOfficeMeta(stream, detectedExtension, clientExtension)) return (clientExtension, GetOfficeLegacyMimeType(clientExtension));
        return (detectedExtension, detectedMimeType);
    }
    #endregion

    #region Private
    /// <summary>
    /// 防止內部流程將缺少或空白的上傳檔案送入檔案雜湊處理。
    /// </summary>
    private static void ValidateUploadFile(IFormFile? file)
    {
        if (file == null) throw new ArgumentNullException(nameof(file), "Upload file cannot be null.");
        if (file.Length <= 0) throw new ArgumentException("Upload file cannot be empty.", nameof(file));
    }
    /// <summary>
    /// 取得使用者上傳檔名副檔名。
    /// </summary>
    private static string GetClientFileExtension(string fileName)
    {
        string extension = Path.GetExtension(fileName) ?? string.Empty;
        return extension.Trim().TrimStart('.').ToLowerInvariant();
    }
    /// <summary>
    /// 判斷是否應使用加密 Office OpenXML 格式資訊。
    /// </summary>
    private static bool ShouldUseEncryptedOfficeMeta(Stream stream, string detectedExtension, string clientExtension)
    {
        if (!string.IsNullOrWhiteSpace(detectedExtension)) return false;
        if (!IsOfficeOpenXmlExtension(clientExtension)) return false;
        return IsEncryptedOfficeOpenXml(stream);
    }
    /// <summary>
    /// 判斷是否應使用舊版 Office 二進位格式資訊。
    /// </summary>
    private static bool ShouldUseLegacyOfficeMeta(Stream stream, string detectedExtension, string clientExtension)
    {
        if (!string.IsNullOrWhiteSpace(detectedExtension)) return false;
        if (!IsOfficeLegacyExtension(clientExtension)) return false;
        return IsCompoundFileBinary(stream);
    }
    /// <summary>
    /// 判斷是否為舊版 Office 二進位副檔名。
    /// </summary>
    private static bool IsOfficeLegacyExtension(string extension)
    {
        return extension switch
        {
            FileExtensions.DOC => true,
            FileExtensions.XLS => true,
            _ => false,
        };
    }
    /// <summary>
    /// 依舊版 Office 副檔名取得 MIME Type。
    /// </summary>
    private static string GetOfficeLegacyMimeType(string extension)
    {
        return extension switch
        {
            FileExtensions.DOC => MimeTypes.APPLICATION_MSWORD,
            FileExtensions.XLS => MimeTypes.APPLICATION_VND_EXCEL,
            _ => string.Empty,
        };
    }
    /// <summary>
    /// 判斷是否為 Office OpenXML 副檔名。
    /// </summary>
    private static bool IsOfficeOpenXmlExtension(string extension)
    {
        return extension switch
        {
            FileExtensions.DOCX => true,
            FileExtensions.XLSX => true,
            FileExtensions.PPTX => true,
            _ => false,
        };
    }
    /// <summary>
    /// 判斷是否為加密 Office OpenXML 檔案。
    /// </summary>
    private static bool IsEncryptedOfficeOpenXml(Stream stream)
    {
        if (!IsCompoundFileBinary(stream)) return false;
        byte[] content = ReadStreamBytes(stream);
        bool hasEncryptedPackage = ContainsUtf16Text(content, "EncryptedPackage");
        bool hasEncryptionInfo = ContainsUtf16Text(content, "EncryptionInfo");
        return hasEncryptedPackage && hasEncryptionInfo;
    }
    /// <summary>
    /// 判斷 Stream 是否為 CFB 檔案格式。
    /// </summary>
    private static bool IsCompoundFileBinary(Stream stream)
    {
        byte[] signature = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
        byte[] buffer = new byte[signature.Length];
        long position = stream.Position;
        stream.Position = 0;
        int readLength = stream.Read(buffer, 0, buffer.Length);
        stream.Position = position;
        return readLength == signature.Length && buffer.SequenceEqual(signature);
    }
    /// <summary>
    /// 完整讀取 Stream 位元組並還原原始位置。
    /// </summary>
    private static byte[] ReadStreamBytes(Stream stream)
    {
        long position = stream.Position;
        try
        {
            stream.Position = 0;
            using var memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);
            return memoryStream.ToArray();
        }
        finally
        {
            stream.Position = position;
        }
    }
    /// <summary>
    /// 判斷內容是否包含指定 UTF-16 文字。
    /// </summary>
    private static bool ContainsUtf16Text(byte[] content, string text)
    {
        byte[] pattern = Encoding.Unicode.GetBytes(text);
        return content.AsSpan().IndexOf(pattern) >= 0;
    }
    /// <summary>
    /// 依 Office OpenXML 副檔名取得 MIME Type。
    /// </summary>
    private static string GetOfficeOpenXmlMimeType(string extension)
    {
        return extension switch
        {
            FileExtensions.DOCX => MimeTypes.APPLICATION_VND_OPENXML_WORD,
            FileExtensions.XLSX => MimeTypes.APPLICATION_VND_OPENXML_EXCEL,
            FileExtensions.PPTX => MimeTypes.APPLICATION_VND_OPENXML_POWERPOINT,
            _ => string.Empty,
        };
    }
    #endregion
}
