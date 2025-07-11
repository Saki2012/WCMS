using MessagePack;
using System.IO.Compression;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// 壓縮
    /// </summary>
    public static class LibCompress
    {
        /// <summary>
        /// 壓縮Json格式資料
        /// 之後再處理，流程為:
        /// 縮短欄位名稱（Key Minify）
        /// 移除縮排與空白（Minify JSON）
        /// 轉成二進位格式（MessagePack / Protobuf）
        /// 再 Gzip 壓縮（選擇性，針對大型資料）
        /// 還有AES256加密，達到最佳完整資料儲存
        /// </summary>
        /// <param name="json"></param>
        /// <returns></returns>
        public static byte[] CompressJsonData(string json)
        {
            return null;
        }
        /// <summary>
        /// 解壓Json格式資料
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        //public static string DeCompressJsonData(byte[] data)
        //{
        //    //var rawData = MessagePackSerializer.Serialize(versionData);
        //    //using var output = new MemoryStream();
        //    //using (var brotli = new BrotliStream(output, CompressionLevel.Optimal))
        //    //{
        //    //    brotli.Write(rawData, 0, rawData.Length);
        //    //}
        //    //return output.ToArray();
        //}


        #region Public
        /// <summary>
        /// 將傳入的字串以GZip演算法壓縮後，傳回Base64編碼字串
        /// </summary>
        /// <param name="rawString">要壓縮的字串</param>
        /// <returns>壓縮後的字串(Base64)</returns>
        public static string GZipCompressString(string rawString)
        {
            if (string.IsNullOrEmpty(rawString) || rawString.Length == 0)
            {
                return "";
            }
            else
            {
                byte[] rawData = Encoding.UTF8.GetBytes(rawString.ToString());
                byte[] zippedData = Compress(rawData);
                return Convert.ToBase64String(zippedData);
            }

        }
        /// <summary>
        /// GZip壓縮
        /// </summary>
        /// <param name="rawData"></param>
        /// <returns></returns>
        public static byte[] Compress(byte[] rawData)
        {
            MemoryStream ms = new MemoryStream();
            using GZipStream compressedzipStream = new GZipStream(ms, CompressionMode.Compress, true);
            compressedzipStream.Write(rawData, 0, rawData.Length);
            compressedzipStream.Close();
            return ms.ToArray();
        }
        /// <summary>
        /// 將傳入的二進位字串資料以GZip演算法解壓縮
        /// </summary>
        /// <param name="zippedString">傳入經GZip壓縮後的二進位字串資料</param>
        /// <returns>傳回原後的未壓縮原始字串資料</returns>
        public static string GZipDecompressString(string zippedString)
        {
            if (string.IsNullOrEmpty(zippedString) || zippedString.Length == 0)
                return string.Empty;
            else
            {
                byte[] zippedData = Convert.FromBase64String(zippedString.ToString());
                return Encoding.UTF8.GetString(Decompress(zippedData));
            }
        }
        /// <summary>
        /// GZip解壓縮
        /// </summary>
        /// <param name="zippedData"></param>
        /// <returns></returns>
        public static byte[] Decompress(byte[] zippedData)
        {
            MemoryStream ms = new MemoryStream(zippedData);
            GZipStream compressedzipStream = new GZipStream(ms, CompressionMode.Decompress);
            using MemoryStream outBuffer = new MemoryStream();
            byte[] block = new byte[1024];
            while (true)
            {
                int bytesRead = compressedzipStream.Read(block, 0, block.Length);
                if (bytesRead <= 0)
                    break;
                else
                    outBuffer.Write(block, 0, bytesRead);
            }
            compressedzipStream.Close();
            return outBuffer.ToArray();
        }
        #endregion
    }
}
