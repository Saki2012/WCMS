// 執行方式:npx tsx ./src/types/generate-fields.ts
import * as fs from "fs";
import * as path from "path";
import { InterfaceDeclaration, Project, TypeAliasDeclaration } from "ts-morph";
import type { Symbol, Type } from "ts-morph";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路徑設定
const apiPath = path.resolve(__dirname, "api.d.ts");
const outputPath = path.resolve(__dirname, "SchemaFields.ts");

/** 取得 components 定義（interface 或 type alias） */
const getComponentsType = (sourceFile: any) =>
{
    // 宣告變數
    let t: InterfaceDeclaration | TypeAliasDeclaration | undefined = sourceFile.getInterface("components");
    if (!t) t = sourceFile.getTypeAlias("components");

    // return xxx
    return t;
};

/** 從 components.schemas 取得 schema symbols */
const getSchemas = (componentsType: InterfaceDeclaration | TypeAliasDeclaration) =>
{
    // 宣告變數
    const schemasProp = componentsType.getType().getProperty("schemas");
    if (!schemasProp) return [];

    // 執行 function
    const decl = schemasProp.getDeclarations()[0]!;
    const schemas = schemasProp.getTypeAtLocation(decl).getProperties();

    // return xxx
    return schemas;
};

/** 從 api.d.ts(text) 抽出所有 /Service/{Controller}/... 的 Controller 名稱 */
const extractControllers = (dtsText: string): string[] =>
{
    // 宣告變數
    const rx = /^\s*"\/Service\/([^/"]+)\/[^"]+"\s*:/gm;
    const set = new Set<string>();

    // 執行 function
    for (const m of dtsText.matchAll(rx))
    {
        const c = (m[1] ?? "").trim();
        if (c) set.add(c);
    }

    // return xxx
    return Array.from(set).sort((a, b) => a.localeCompare(b));
};

/** 產生 PGID record 的 TS 物件內容 */
const buildPgidRecordLines = (controllers: string[]): string =>
{
    // 宣告變數
    const isId = (s: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s);

    // 執行 function
    const lines = controllers.map(c =>
    {
        const key = isId(c) ? c : JSON.stringify(c);
        return `    ${key}: "${c}",`;
    });

    // return xxx
    return lines.join("\n");
};
const getSchemaOwnKeys = (schemaType: Type, apiFilePath: string): string[] =>
{
    // 宣告變數
    const keys = schemaType.getProperties()
        .filter((p: Symbol) => p.getDeclarations().some((d) => d.getSourceFile().getFilePath() === apiFilePath))
        .map((p: Symbol) => p.getName())
        .filter((k: string) => !k.startsWith("__@")); // 避免 iterator 之類的怪鍵

    // return xxx
    return Array.from(new Set(keys));
};
const main = (): void =>
{
    // 宣告變數
    const apiDtsText = fs.readFileSync(apiPath, "utf-8");
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(apiPath);
    const emittedSchemas = new Set<string>();
    const apiFilePath = sourceFile.getFilePath();

    // 執行 function：讀 components.schemas
    const componentsType = getComponentsType(sourceFile);
    if (!componentsType)
    {
        console.error("❌ 找不到 interface 或 type components 定義");
        process.exit(1);
    }

    const schemas = getSchemas(componentsType);
    if (schemas.length === 0)
    {
        console.warn("⚠️ components.schemas 下沒有任何型別定義");
        process.exit(0);
    }

    // ✅ 組出輸出內容（Fields + PGID）
    let output = `// ✅ 自動產生，請勿手動修改\n\n`;

    // 1) Schema Fields
    schemas.forEach(schema =>
    {
        const schemaName = schema.getName().replace(/_DTO$/, "");
        const schemaType = schema.getTypeAtLocation(schema.getDeclarations()[0]!);
        const keys = getSchemaOwnKeys(schemaType, apiFilePath);
        if (keys.length === 0) return;

        // 避免重複輸出
        if (emittedSchemas.has(schemaName)) return;
        emittedSchemas.add(schemaName);

        output += `export const ${schemaName}Fields = {\n`;

        const seen = new Set<string>();
        for (const k of keys)
        {
            if (seen.has(k)) continue;
            seen.add(k);
            output += `  ${k}: '${k}',\n`;
        }

        output += `} as const;\n\n`;
        output += `export type ${schemaName}FieldKey = keyof typeof ${schemaName}Fields;\n\n`;
    });

    // 2) PGID（從 paths 自動推導 union + 自動產生 runtime Record）
    const controllers = extractControllers(apiDtsText);
    const pgidLines = buildPgidRecordLines(controllers);

    output += `// ==============================\n`;
    output += `// ✅ PGID (from OpenAPI paths)\n`;
    output += `// ==============================\n\n`;

    // 用 type-only import 避免 runtime 依賴
    output += `type ServicePath = keyof import("./api").paths;\n`;
    output += `type ServiceRelPath = ServicePath extends \`/Service/\${infer P}\` ? P : never;\n\n`;
    output += `export type PGID = ServiceRelPath extends \`\${infer C}/\${string}\` ? C : never;\n\n`;

    output += `export const PGID = {\n${pgidLines}\n} as const satisfies Record<string, PGID>;\n\n`;
    output += `export type PGIDKey = keyof typeof PGID;\n`;
    output += `export type PGIDValue = typeof PGID[PGIDKey];\n`;

    // 輸出到 SchemaFields.ts
    fs.writeFileSync(outputPath, output.trimStart(), "utf-8");
    console.log(`\n🎉 SchemaFields.ts 已產生：schemas=${schemas.length}, pgid=${controllers.length}`);
};

main();
