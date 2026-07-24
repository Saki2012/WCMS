using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Tag;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;
using WCMS.SysCore.I18n;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

/// <summary>
/// 期刊
/// </summary>
public class SpecJournal : HeaderModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 期刊目次代號
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
    [ForeignKey(nameof(JournalIndexId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecJournalIndex? _JournalIndex { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.Spec_JournalIndexId)]
    public string? JournalIndexId { get; set; }
    /// <summary>
    /// 卷期代號 (期刊目次明細行主鍵)
    /// 注:期刊目次代號或卷期代號為null時，代表該期刊為預刊本
    /// </summary>
    [ForeignKey($@"{nameof(JournalIndexId)},{nameof(JournalIndexRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecJournalIndexDetail? _JournalIndexDetail { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_JournalIndexRowId)]
    public int? JournalIndexRowId { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 英文標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.Spec_Title_en)]
    public string Title_en { get; set; } = string.Empty;
    /// <summary>
    /// 起訖頁(起)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_PageStart)]
    public int PageStart { get; set; }
    /// <summary>
    /// 起訖頁(訖)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_PageEnd)]
    public int PageEnd { get; set; }
    /// <summary>
    /// DOI網址
    /// e.x.: https://doi.org/10.6120/JoEMLS.202307_60(2).editorial
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.Spec_DOI)]
    public string DOIUrl { get; set; } = string.Empty;
    /// <summary>
    /// 期刊檔案
    /// </summary>
    [ForeignKey(nameof(JournalFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? JournalFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_JournalFieldId)]
    public string? JournalFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_JournalFileName)]
    public string JournalFileName { get; set; } = string.Empty;
    /// <summary>
    /// 捷點InSight Point 檔案
    /// </summary>
    [ForeignKey(nameof(InsightPointFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? InsightPointFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_InsightPointFileId)]
    public string? InsightPointFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_InsightPointFileName)]
    public string InsightPointFileName { get; set; } = string.Empty;
    /// <summary>
    /// 文章語言
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_ArticleLang)]
    public LangCode ArticleLang { get; set; }= LangCode.zhtw;
    /// <summary>
    /// 摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Memo)]
    public string Memo { get; set; } = string.Empty;
    /// <summary>
    /// 英文摘要
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_Memo_en)]
    public string Memo_en { get; set; } = string.Empty;
    /// <summary>
    /// 參考文獻
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecBibliography)]
    public string Bibliography { get; set; } = string.Empty;

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
public class SpecJournalAuthor : FormDetailModel
{
    /// <summary>
    /// 期刊目次代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 期刊作者類型
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_AuthorType)]
    public SpecAuthorType AuthorType { get; set; }
    /// <summary>
    /// ORCID
    /// e.x.:
    /// 存 0000-0002-2312-7480
    /// 用 -> https://orcid.org/0000-0002-2312-7480
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.Spec_ORCID)]
    public string ORCID { get; set; } = string.Empty;
    /// <summary>
    /// 中文姓名
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, SpecModelDisplayName.Spec_AuthorName)]
    public string AuthorName { get; set; } = string.Empty;
    /// <summary>
    /// 英文姓名
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name_Eng, SpecModelDisplayName.Spec_AuthorName_en)]
    public string AuthorName_en { get; set; } = string.Empty;
    /// <summary>
    /// 職稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.Spec_JobTitle)]
    public string JobTitle { get; set; } = string.Empty;
    /// <summary>
    /// 單位
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.Spec_Unit)]
    public string Unit { get; set; } = string.Empty;
    /// <summary>
    /// 英文單位
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.Spec_Unit_en)]
    public string Unit_en { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Email, DisplayName.Common_Email)]
    public string Email { get; set; } = string.Empty;
    /// <summary>
    /// 地區/國家
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.Common_Country)]
    public string Country { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 引文格式
/// </summary>
public class SpecJournalRefFormat : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 引文格式標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Spec_RefFormatTitle)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 引文格式內容
    /// 注:(文字編輯器，大量內容，不限長度)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_RefFormatContent)]
    public string Content { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-開放觀點檔案列表
/// </summary>
public class SpecJournalOpenPointFiles : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 開放觀點檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_OpenPointFileName)]
    public string OpenPointFileName { get; set; } = string.Empty;
    /// <summary>
    /// 開放觀點檔案來源
    /// </summary>
    [ForeignKey(nameof(OpenPointFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? OpenPointFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_OpenPointFileId)]
    public string? OpenPointFileId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-相關檔案列表
/// </summary>
public class SpecJournalRefFiles : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 相關檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_RefFileName)]
    public string RefFileName { get; set; } = string.Empty;
    /// <summary>
    /// 相關檔案來源
    /// </summary>
    [ForeignKey(nameof(RefFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? RefFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_RefFileId)]
    public string? RefFileId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}

/// <summary>
/// 期刊-說明文件列表
/// </summary>
public class SpecJournalDocument : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 說明檔案類型
    /// </summary>

    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_DocumentType)]
    public SpecDocumentType DocumentType { get; set; }
    
    /// <summary>
    /// 說明檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_DocumentName)]
    public string DocumentName { get; set; } = string.Empty;
    /// <summary>
    /// 說明檔案來源
    /// </summary>
    [ForeignKey(nameof(DocumentId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Document { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_DocumentId)]
    public string? DocumentId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}

/// <summary>
/// 期刊-類型列表
/// </summary>
public class SpecJournalTypes : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 類型
    /// 注:用Feature的標籤處理
    /// </summary>
    [ForeignKey(nameof(TagId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public TagData? Tag { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.Spec_TagId)]
    public string? TagId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}
/// <summary>
/// 期刊-關鍵詞列表
/// </summary>
public class SpecJournalKeywords : FormDetailModel
{
    /// <summary>
    /// 期刊代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalId)]
    [Key]
    public string JournalId { get; set; } = string.Empty;
    /// <summary>
    /// 關鍵詞語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode LangCode { get; set; }
    /// <summary>
    /// 關鍵詞
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Spec_Keyword)]
    public string Keyword { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(JournalId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournal? _SpecJournal { get; set; }
    #endregion
}
