import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";

const labels = {
    "zh-tw": {
        LinkDataTitle: "相關連結",
        AboutUsTitle: "關於我們",
        AdmissionsTitle: "招生入學",
        AdmissionsContent: "本學程招收國內生 6 名，外籍生(春季班與秋季班)皆不限名額，歡迎具國際興趣的同學報名。",
        NewsTitle: "最新消息",
        AlbumTitle: "活動相簿",
        MoreInfo: "更多資訊",
    },
    en: {
        LinkDataTitle: "Links",
        AboutUsTitle: "About Us",
        AdmissionsTitle: "Admissions",
        AdmissionsContent:
            "The program admits 6 domestic students; international students (spring/fall) are not limited in number. Applicants with international interests are welcome.",
        NewsTitle: "News",
        AlbumTitle: "Event",
        MoreInfo: "More Info",
    },
    "zh-cn": { LinkDataTitle: "", AboutUsTitle: "", AdmissionsTitle: "", AdmissionsContent: "", NewsTitle: "", AlbumTitle: "", MoreInfo: "" },
} as const satisfies Record<Lang, {}>;

export const IndexLabel = (lang?: Lang) => labels[lang ?? DefaultLang] ?? labels[DefaultLang];
