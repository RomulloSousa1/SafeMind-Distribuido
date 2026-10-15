import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 300;
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
const IGNORED_FILES = new Set(['package-lock.json']);
const TARGET_EXTENSIONS = new Set(['.ts', '.js', '.json', '.md']);

function scanDirectory(dir) {
  let fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileList = fileList.concat(scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (TARGET_EXTENSIONS.has(ext) && !IGNORED_FILES.has(entry.name)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

function checkLimits() {
  console.log(`===============================================================`);
  console.log(`VERIFICADOR DE LIMITE DE LINHAS DE CÓDIGO (MÁX: ${MAX_LINES} LINHAS)`);
  console.log(`===============================================================\n`);

  const files = scanDirectory(process.cwd());
  let violations = 0;
  const inspected = [];

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lineCount = content.split(/\r?\n/).length;

    inspected.push({ file: relPath, lines: lineCount });

    if (lineCount > MAX_LINES) {
      console.error(`[ERRO] VIOLAÇÃO: '${relPath}' tem ${lineCount} linhas (máximo permitido: ${MAX_LINES})`);
      violations++;
    }
  }

  inspected.sort((a, b) => b.lines - a.lines);

  console.log(`Top 10 maiores arquivos no repositório:`);
  inspected.slice(0, 10).forEach((item, index) => {
    const status = item.lines <= MAX_LINES ? 'OK' : 'EXCEDEU';
    console.log(`  ${index + 1}. [${status}] ${item.lines} linhas - ${item.file}`);
  });

  console.log(`\nTotal de arquivos inspecionados: ${inspected.length}`);

  if (violations > 0) {
    console.error(`\n[FALHA] Foram encontradas ${violations} violações de limite de linhas.`);
    process.exit(1);
  } else {
    console.log(`\n[SUCESSO] Todos os arquivos respeitam a diretriz de até ${MAX_LINES} linhas!`);
    console.log(`===============================================================\n`);
  }
}

checkLimits();
