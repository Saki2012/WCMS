//執行方式:npx tsx generate-fields.ts
import { Project } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路徑設定
const apiPath = path.resolve(__dirname, 'api.d.ts');
const outputPath = path.resolve(__dirname, 'SchemaFields.ts');

const project = new Project();
const sourceFile = project.addSourceFileAtPath(apiPath);

// 嘗試取得 interface 或 type components
let componentsType = sourceFile.getInterface('components');
if (!componentsType) {
  componentsType = sourceFile.getTypeAlias('components');
}

if (!componentsType) {
  console.error('❌ 找不到 interface 或 type components 定義');
  process.exit(1);
}

// 嘗試取得 schemas property
const schemasProp = componentsType.getType().getProperty('schemas');
if (!schemasProp) {
  console.error('❌ 找不到 components.schemas 屬性');
  process.exit(1);
}

// 取得 schemas 裡的所有 schema 定義
const schemas = schemasProp.getTypeAtLocation(schemasProp.getDeclarations()[0]!).getProperties();
if (schemas.length === 0) {
  console.warn('⚠️ components.schemas 下沒有任何型別定義');
  process.exit(0);
}

// 組出輸出內容
let output = `// ✅ 自動產生，請勿手動修改\n\n`;

schemas.forEach(schema => {
  const schemaName = schema.getName();
  const schemaType = schema.getTypeAtLocation(schema.getDeclarations()[0]!);
  const keys = schemaType.getProperties().map(p => p.getName());

  if (keys.length === 0) return;

  output += `export const ${schemaName}Fields = {\n`;
  keys.forEach(k => {
    output += `  ${k}: '${k}',\n`;
  });
  output += `} as const;\n\n`;

  output += `export type ${schemaName}FieldKey = keyof typeof ${schemaName}Fields;\n\n`;

  console.log(`✅ ${schemaName}: ${keys.length} fields`);
});

// 輸出到 SchemaFields.ts
fs.writeFileSync(outputPath, output.trimStart(), 'utf-8');
console.log(`\n🎉 SchemaFields.ts 已產生，總共 ${schemas.length} 個 schema`);
