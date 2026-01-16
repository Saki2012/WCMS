export const SpecPGID = {
    SpecJournalIndex: "SpecJournalIndex",
    SpecJournal: "SpecJournal",
} as const;
export type Program = typeof SpecPGID[keyof typeof SpecPGID];
export type ProgramKey = keyof typeof SpecPGID;
