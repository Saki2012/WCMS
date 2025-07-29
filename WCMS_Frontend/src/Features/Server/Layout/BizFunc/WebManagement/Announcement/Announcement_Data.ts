import  type { components } from "../../../../../../types/api";
type AnnouncementSet = components["schemas"]["AnnouncementSet"]

export const emptyData:AnnouncementSet={
    Announcement:{},
    AnnouncementDetail:[]
}