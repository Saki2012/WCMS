using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Tag;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;
using WCMS.SysCore.I18n;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

/// <summary>
/// 期刊表單
/// </summary>
public class SpecJournalSet : ITSet
{
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournal)]
public SpecJournalModel SpecJournal { get; set; }= new ();
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalAuthor)]
public List<SpecJournalAuthor> SpecJournalAuthor { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalRefFormat)]
public List<SpecJournalRefFormat> SpecJournalRefFormat { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalOpenPointFiles)]
public List<SpecJournalOpenPointFiles> SpecJournalOpenPointFiles { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalRefFiles)]
public List<SpecJournalRefFiles> SpecJournalRefFiles { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalDocument)]
public List<SpecJournalDocument> SpecJournalDocument { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalTypes)]
public List<SpecJournalTypes> SpecJournalTypes { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalKeywords)]
public List<SpecJournalKeywords> SpecJournalKeywords { get; set; }= [];
}
/// <summary>
/// 期刊
/// </summary>
public class SpecJournalModel : MasterDataModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 期刊目次代號
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
[ForeignKey(nameof(JournalIndexId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalIndexModel? _JournalIndex { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, SpecDisplayName.Spec_JournalIndexId)]
public string? JournalIndexId { get; set; }
    /// <summary>
    /// 卷期代號 (期刊目次明細行主鍵)
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
[ForeignKey($@"{nameof(JournalIndexId)},{nameof(JournalIndexRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalIndexDetail? _JournalIndexDetail { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_JournalIndexRowId)]
public int JournalIndexRowId { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string Title { get; set; }= string.Empty;
    /// <summary>
    /// 英文標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.Spec_Title_en)]
public string Title_en { get; set; }= string.Empty;
    /// <summary>
    /// 起訖頁(起)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_PageStart)]
public int PageStart { get; set; }
    /// <summary>
    /// 起訖頁(訖)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_PageEnd)]
public int PageEnd { get; set; }
    /// <summary>
    /// DOI網址
    /// e.x.: https://doi.org/10.6120/JoEMLS.202307_60(2).editorial
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.Spec_DOI)]
public string DOIUrl { get; set; }= string.Empty;
    /// <summary>
    /// 期刊檔案
    /// </summary>
[ForeignKey(nameof(JournalFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? JournalFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_JournalFieldId)]
public string? JournalFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_JournalFileName)]
public string JournalFileName { get; set; }= string.Empty;
    /// <summary>
    /// 捷點InSight Point 檔案
    /// </summary>
[ForeignKey(nameof(InsightPointFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? InsightPointFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_InsightPointFileId)]
public string? InsightPointFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_InsightPointFileName)]
public string InsightPointFileName { get; set; }= string.Empty;
    /// <summary>
    /// 文章語言
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_ArticleLang)]
public LangCode ArticleLang { get; set; }= LangCode.zhtw;
    /// <summary>
    /// 摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Memo)]
public string Memo { get; set; }= string.Empty;
    /// <summary>
    /// 英文摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_Memo_en)]
public string Memo_en { get; set; }= string.Empty;
    /// <summary>
    /// 參考文獻
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecBibliography)]
public string Bibliography { get; set; }= string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(SpecJournalAuthor._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalAuthor> _SpecJournalAuthor { get; set; } = [];
[InverseProperty(nameof(SpecJournalRefFormat._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalRefFormat> _SpecJournalRefFormat { get; set; } = [];
[InverseProperty(nameof(SpecJournalOpenPointFiles._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalOpenPointFiles> _SpecJournalOpenPointFiles { get; set; } = [];
[InverseProperty(nameof(SpecJournalRefFiles._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalRefFiles> _SpecJournalRefFiles { get; set; } = [];
[InverseProperty(nameof(SpecJournalDocument._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalDocument> _SpecJournalDocument { get; set; } = [];
[InverseProperty(nameof(SpecJournalTypes._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalTypes> _SpecJournalTypes { get; set; } = [];
[InverseProperty(nameof(SpecJournalKeywords._SpecJournal))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalKeywords> _SpecJournalKeywords { get; set; } = [];
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 期刊作者類型
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_AuthorType)]
public SpecAuthorType AuthorType { get; set; }
    /// <summary>
    /// ORCID
    /// e.x.:
    /// 存 0000-0002-2312-7480
    /// 用 -> https://orcid.org/0000-0002-2312-7480
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, SpecDisplayName.Spec_ORCID)]
public string ORCID { get; set; }= string.Empty;
    /// <summary>
    /// 中文姓名
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_AuthorName)]
public string AuthorName { get; set; }= string.Empty;
    /// <summary>
    /// 英文姓名
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name_Eng, SpecDisplayName.Spec_AuthorName_en)]
public string AuthorName_en { get; set; }= string.Empty;
    /// <summary>
    /// 職稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_JobTitle)]
public string JobTitle { get; set; }= string.Empty;
    /// <summary>
    /// 單位
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Unit)]
public string Unit { get; set; }= string.Empty;
    /// <summary>
    /// 英文單位
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.Spec_Unit_en)]
public string Unit_en { get; set; }= string.Empty;
    /// <summary>
    /// Email
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Email, DisplayName.Common_Email)]
public string Email { get; set; }= string.Empty;
    /// <summary>
    /// 地區/國家
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, DisplayName.Common_Country)]
public string Country { get; set; }= string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 引文格式標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Spec_RefFormatTitle)]
public string Title { get; set; }= string.Empty;
    /// <summary>
    /// 引文格式內容
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_RefFormatContent)]
public string Content { get; set; }= string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 開放觀點檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_OpenPointFileName)]
public string OpenPointFileName { get; set; }= string.Empty;
    /// <summary>
    /// 開放觀點檔案來源
    /// </summary>
[ForeignKey(nameof(OpenPointFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? OpenPointFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_OpenPointFileId)]
public string? OpenPointFileId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 相關檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_RefFileName)]
public string RefFileName { get; set; }= string.Empty;
    /// <summary>
    /// 相關檔案來源
    /// </summary>
[ForeignKey(nameof(RefFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? RefFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_RefFileId)]
public string? RefFileId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 說明檔案類型
    /// </summary>

[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_DocumentType)]
public SpecDocumentType DocumentType { get; set; }
    
    /// <summary>
    /// 說明檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_DocumentName)]
public string DocumentName { get; set; }= string.Empty;
    /// <summary>
    /// 說明檔案來源
    /// </summary>
[ForeignKey(nameof(DocumentId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? Document { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_DocumentId)]
public string? DocumentId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 類型
    /// 注:用Feature的標籤處理
    /// </summary>
[ForeignKey(nameof(TagId))]
[LibField(ApiFieldMode.ReadOnly)]
public TagData? Tag { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, SpecDisplayName.Spec_TagId)]
public string? TagId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalId)]
public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 關鍵詞語系
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode LangCode { get; set; }
    /// <summary>
    /// 關鍵詞
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Spec_Keyword)]
public string Keyword { get; set; }= string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(JournalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalModel _SpecJournal { get; set; }
    #endregion
}
