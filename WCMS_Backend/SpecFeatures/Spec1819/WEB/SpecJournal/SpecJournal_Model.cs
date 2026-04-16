using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Tag;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

/// <summary>
/// 期刊表單
/// </summary>
public class SpecJournalSet : ITSet
{
    [LibDesc(SpecModelDisplayName.SpecJournal)] public SpecJournalModel SpecJournal { get; set; } = new ();
    [LibDesc(SpecModelDisplayName.SpecJournalAuthor)] public List<SpecJournalAuthor> SpecJournalAuthor { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalRefFormat)]public List<SpecJournalRefFormat> SpecJournalRefFormat { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalOpenPointFiles)]public List<SpecJournalOpenPointFiles> SpecJournalOpenPointFiles { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalRefFiles)]public List<SpecJournalRefFiles> SpecJournalRefFiles { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalDocument)]public List<SpecJournalDocument> SpecJournalDocument { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalTypes)] public List<SpecJournalTypes> SpecJournalTypes { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecJournalKeywords)] public List<SpecJournalKeywords> SpecJournalKeywords { get; set; } = [];
}
/// <summary>
/// 期刊
/// </summary>
public class SpecJournalModel : MasterDataModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 期刊目次代號
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
    [ForeignKey(nameof(JournalIndexId))] public SpecJournalIndexModel? _JournalIndex { get; set; } 
    [LibDesc(SpecModelDisplayName.Spec_JournalIndexId), StringLength(SysLengthParam.ID)] public string? JournalIndexId { get; set; }
    /// <summary>
    /// 卷期代號 (期刊目次明細行主鍵)
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
    [ForeignKey($@"{nameof(JournalIndexId)},{nameof(JournalIndexRowId)}")] public SpecJournalIndexDetail? _JournalIndexDetail { get; set; } 
    [LibDesc(SpecModelDisplayName.Spec_JournalIndexRowId)]public int? JournalIndexRowId { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 英文標題
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Title_en), StringLength(SysLengthParam.Title_en)] public string Title_en { get; set; } = string.Empty;
    /// <summary>
    /// 起訖頁(起)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_PageStart)]public int PageStart { get; set; }
    /// <summary>
    /// 起訖頁(訖)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_PageEnd)] public int PageEnd { get; set; }
    /// <summary>
    /// DOI網址
    /// e.x.: https://doi.org/10.6120/JoEMLS.202307_60(2).editorial
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_DOI), StringLength(SysLengthParam.Url)] public string DOIUrl { get; set; } = string.Empty;
    /// <summary>
    /// 期刊檔案
    /// </summary>
    [ForeignKey(nameof(JournalFileId))] public FileManageModel? JournalFile { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_JournalFieldId), StringLength(SysLengthParam.InternalId)] public string? JournalFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalFileName), StringLength(SysLengthParam.FileName)] public string JournalFileName { get; set; } = string.Empty;
    /// <summary>
    /// 捷點InSight Point 檔案
    /// </summary>
    [ForeignKey(nameof(InsightPointFileId))] public FileManageModel? InsightPointFile { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_InsightPointFileId), StringLength(SysLengthParam.InternalId)] public string? InsightPointFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_InsightPointFileName), StringLength(SysLengthParam.FileName)] public string InsightPointFileName { get; set; } = string.Empty;
    /// <summary>
    /// 文章語言
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ArticleLang)] public LangCode ArticleLang { get; set; } = LangCode.zhtw;
    /// <summary>
    /// 摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Memo)]public string Memo { get; set; } = string.Empty;
    /// <summary>
    /// 英文摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Memo_en)]public string Memo_en { get; set; } = string.Empty;
    /// <summary>
    /// 參考文獻
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecBibliography)] public string Bibliography { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(SpecJournalAuthor._SpecJournal))] public List<SpecJournalAuthor> _SpecJournalAuthor { get; set; }
    [InverseProperty(nameof(SpecJournalRefFormat._SpecJournal))] public List<SpecJournalRefFormat> _SpecJournalRefFormat { get; set; }
    [InverseProperty(nameof(SpecJournalOpenPointFiles._SpecJournal))] public List<SpecJournalOpenPointFiles> _SpecJournalOpenPointFiles { get; set; }
    [InverseProperty(nameof(SpecJournalRefFiles._SpecJournal))] public List<SpecJournalRefFiles> _SpecJournalRefFiles { get; set; }
    [InverseProperty(nameof(SpecJournalDocument._SpecJournal))] public List<SpecJournalDocument> _SpecJournalDocument { get; set; }
    [InverseProperty(nameof(SpecJournalTypes._SpecJournal))] public List<SpecJournalTypes> _SpecJournalTypes { get; set; }
    [InverseProperty(nameof(SpecJournalKeywords._SpecJournal))] public List<SpecJournalKeywords> _SpecJournalKeywords { get; set; }
    #endregion
}
/// <summary>
/// 期刊-作者列表
/// </summary>
public class SpecJournalAuthor : DetailRowModel
{
    /// <summary>
    /// 期刊目次代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 期刊作者類型
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_AuthorType)] public SpecAuthorType AuthorType { get; set; }
    /// <summary>
    /// ORCID
    /// e.x.:
    /// 存 0000-0002-2312-7480
    /// 用 -> https://orcid.org/0000-0002-2312-7480
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ORCID), StringLength(SysLengthParam.ID)] public string ORCID{ get; set; } = string.Empty;
    /// <summary>
    /// 中文姓名
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_AuthorName), StringLength(SysLengthParam.Name)] public string AuthorName { get; set; } = string.Empty;
    /// <summary>
    /// 英文姓名
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_AuthorName_en), StringLength(SysLengthParam.Name_Eng)] public string AuthorName_en { get; set; } = string.Empty;
    /// <summary>
    /// 職稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JobTitle), StringLength(SysLengthParam.Info)] public string JobTitle { get; set; } = string.Empty;
    /// <summary>
    /// 單位
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Unit), StringLength(SysLengthParam.Info)] public string Unit { get; set; } = string.Empty;
    /// <summary>
    /// 英文單位
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Unit_en), StringLength(SysLengthParam.Memo)] public string Unit_en { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Email), StringLength(SysLengthParam.Email)] public string Email { get; set; } = string.Empty;
    /// <summary>
    /// 地區/國家
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Country), StringLength(SysLengthParam.Info)]public string Country { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 引文格式
/// </summary>
public class SpecJournalRefFormat : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId),Key] public int RowId { get; set; }
    /// <summary>
    /// 引文格式標題
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_RefFormatTitle), StringLength(SysLengthParam.Title)] public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 引文格式內容
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_RefFormatContent)]public string Content { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-開放觀點檔案列表
/// </summary>
public class SpecJournalOpenPointFiles : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 開放觀點檔案名稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_OpenPointFileName), StringLength(SysLengthParam.FileName)] public string OpenPointFileName { get; set; } = string.Empty;
    /// <summary>
    /// 開放觀點檔案來源
    /// </summary>
    [ForeignKey(nameof(OpenPointFileId))] public FileManageModel? OpenPointFile { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_OpenPointFileId), StringLength(SysLengthParam.InternalId)] public string? OpenPointFileId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-相關檔案列表
/// </summary>
public class SpecJournalRefFiles : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 相關檔案名稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_RefFileName), StringLength(SysLengthParam.FileName)] public string RefFileName { get; set; } = string.Empty;
    /// <summary>
    /// 相關檔案來源
    /// </summary>
    [ForeignKey(nameof(RefFileId))] public FileManageModel? RefFile { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_RefFileId), StringLength(SysLengthParam.InternalId)] public string? RefFileId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}

/// <summary>
/// 期刊-說明文件列表
/// </summary>
public class SpecJournalDocument : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 說明檔案類型
    /// </summary>

    [LibDesc(SpecModelDisplayName.Spec_DocumentType)] public SpecDocumentType DocumentType { get; set; }
    
    /// <summary>
    /// 說明檔案名稱
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_DocumentName), StringLength(SysLengthParam.FileName)] public string DocumentName { get; set; } = string.Empty;
    /// <summary>
    /// 說明檔案來源
    /// </summary>
    [ForeignKey(nameof(DocumentId))] public FileManageModel? Document { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_DocumentId), StringLength(SysLengthParam.InternalId)] public string? DocumentId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}

/// <summary>
/// 期刊-類型列表
/// </summary>
public class SpecJournalTypes : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 類型
    /// 注:用Feature的標籤處理
    /// </summary>
    [ForeignKey(nameof(TagId))] public TagData? Tag { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_TagId), StringLength(SysLengthParam.ID)] public string? TagId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-關鍵詞列表
/// </summary>
public class SpecJournalKeywords : DetailRowModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalId), Key, StringLength(SysLengthParam.ID)] public string JournalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 關鍵詞語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)]public LangCode LangCode { get; set; }
    /// <summary>
    /// 關鍵詞
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Keyword), StringLength(SysLengthParam.Title)] public string Keyword{ get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))] public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
