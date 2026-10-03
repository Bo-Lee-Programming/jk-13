import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { minify } from 'terser';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { deflateAsync } from '@gfx/zopfli';
import { Packer } from 'roadroller';
import vm from 'node:vm';
import { deflateRawSync } from 'node:zlib';

const SIZE_LIMIT = 13 * 1024;
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(projectDir, 'src');
const outputDir = path.join(projectDir, 'dist');
const sourceHtmlPath = path.join(sourceDir, 'index.html');
const outputHtmlPath = path.join(outputDir, 'index.html');
const outputZipPath = path.join(outputDir, 'game.zip');

const sourceHtml = await readFile(sourceHtmlPath, 'utf8');
const scriptTags = [...sourceHtml.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script>/gi)];
const sourcedScripts = scriptTags
  .map((match) => ({
    match,
    src: match[1].match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2],
  }))
  .filter(({ src }) => src);

if (sourcedScripts.some(({ src }) => /^(?:[a-z]+:)?\/\//i.test(src))) {
  throw new Error('External scripts are not allowed in a self-contained js13kGames build.');
}

if (sourcedScripts.length !== 1) {
  throw new Error(
    `Expected exactly one local <script src="..."> entry in src/index.html; found ${sourcedScripts.length}. Import other JavaScript files from that entry module.`,
  );
}

const [{ match: entryTag, src: entrySource }] = sourcedScripts;
const cleanEntrySource = entrySource.replace(/[?#].*$/, '');

if (path.isAbsolute(cleanEntrySource) || cleanEntrySource.startsWith('/')) {
  throw new Error(`The JavaScript entry must be relative to src/index.html: ${entrySource}`);
}

const entryPath = path.resolve(sourceDir, cleanEntrySource);
const relativeEntryPath = path.relative(sourceDir, entryPath);

if (relativeEntryPath.startsWith('..') || path.isAbsolute(relativeEntryPath)) {
  throw new Error(`The JavaScript entry must stay inside src/: ${entrySource}`);
}

const esbuildResult = await build({
  entryPoints: [entryPath],
  bundle: true,
  charset: 'utf8',
  format: 'iife',
  legalComments: 'none',
  minifySyntax: true,
  platform: 'browser',
  target: ['es2020'],
  treeShaking: true,
  write: false,
});

const styleStart = sourceHtml.indexOf('<style>');
if (styleStart < 0 || styleStart > entryTag.index) throw Error('Missing inline game styling.');
let markup = sourceHtml.slice(styleStart, entryTag.index).replace(/>\s+</g, '><').trim();
const css = markup.match(/<style>([\s\S]*?)<\/style>/);
markup = markup.replace(css[0], `<style>${(await transform(css[1], { loader: 'css', minify: true })).code.trim()}</style>`);
// The UI shares the decoder's compression model. Avoid document.body: body is a private mesh name.
const bootstrap = `document.querySelector('body').innerHTML=${JSON.stringify(markup)};`;
const terserResult = await minify(bootstrap + esbuildResult.outputFiles[0].text, {
  ecma: 2020,
  compress: {
    passes: 3,
  },
  mangle: {
    toplevel: true,
    properties: {
      // Only private game/renderer fields; never DOM, WebGL or dynamic axis keys.
      regex: /^(count|data|id|lamp|hurt|flat|life|actorFade|resumeState|effects|death|reason|state|release|loc|pulses|squash|flowers|hornMesh|ring|root|lean|body|mane|leg|ear|bob|glow|vx|vy|px|py|link|left|chain|time|trail|actor|forest|keys|cam|horn|speed|ground|mesh|storm|wake|elapsed|songs|bestChain|jumpBuffer|jumpCut|lastAnchor|selected|candidate|weave|islands|stems|loft|island|trunk|bough|leaf|water|best|save|finish|ttl|broken|phase|base|amp|score|collected|attached|particles|enemies|rocks|orbs|vines|rope|plate|gate|fireCd|flash|tail|steps|check|meshes|shadowTex|shadowFB|shadowProgram|blooms|bindTarget|character|respawn|burst|dash|grab|scene|hero|cache|sky|blur|post|hdr|inv|face|jumps|cool|len|nodes|ox|oy|oz|ball|branch|shape|tree|fern|camera|canvas|program|empty|params|target|resize|begin|draw|end|render|update|bind|reset|panel)$/,
    },
  },
  format: {
    ascii_only: true,
    comments: false,
  },
  toplevel: true,
});

if (!terserResult.code) {
  throw new Error('Terser did not produce JavaScript output.');
}

// The decoder ships inside the entry HTML; no network or runtime library is used.
// Keep its temporary model under 50 MB and do not leak decoder variables globally.
const packer = new Packer([{ data: terserResult.code, type: 'js', action: 'eval' }], {
  maxMemoryMB: 50, allowFreeVars: false,
  // Starting model for the bounded release-compression search below.
  sparseSelectors: [0, 1, 2, 3, 6, 7, 13, 21, 25, 42, 50, 105, 4, 5, 9, 17],
  precision: 14, modelMaxCount: 5, modelRecipBaseCount: 10,
  recipLearningRate: 1000, numAbbreviations: 32, dynamicModels: 1,
});
await packer.optimize(1);
const { firstLine, secondLine } = packer.makeDecoder();
const decoder = firstLine + secondLine;
let decoded;
vm.runInNewContext(decoder, { eval: code => { decoded = code; } }, { timeout: 10000 });
const canonical = async code => (await minify(code, {
  compress: false, mangle: false, format: { ascii_only: true, comments: false },
})).code;
if (typeof decoded !== 'string' || await canonical(decoded) !== await canonical(terserResult.code)) {
  throw new Error('Packed JavaScript failed its decode equivalence check.');
}
const inlineScript = decoder.replace(/<\/script/gi, '<\\/script');
const entryTagStart = entryTag.index;
const entryTagEnd = entryTagStart + entryTag[0].length;
let outputHtml = `${sourceHtml.slice(0, styleStart).replace(/<link rel="icon"[^>]*>/, '')}<body><script>${inlineScript}</script>`;

// Keep text-node whitespace intact; only remove comments and gaps between tags.
outputHtml = outputHtml
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .trim();

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(outputHtmlPath, outputHtml);

const htmlBytes = strToU8(outputHtml);
let zipBytes = zipSync(
  {
    'index.html': [
      htmlBytes,
      {
        level: 9,
        mtime: new Date('1980-01-02T00:00:00.000Z'),
      },
    ],
  },
  { level: 9 },
);

// Keep the smallest standard DEFLATE stream, retaining the ZIP CRC and metadata.
// This changes compression only; the verified HTML payload is identical.
const streams = [];
for (const strategy of [0, 1]) for (const memLevel of [6, 8, 9]) streams.push(deflateRawSync(htmlBytes, { level: 9, memLevel, strategy }));
streams.push(await deflateAsync(htmlBytes, { numiterations: 30, blocksplitting: true, blocksplittingmax: 15 }));
for (const raw of streams) {
  const source = Buffer.from(zipBytes);
  const size = source.readUInt32LE(18);
  if (raw.length >= size) continue;
  const start = 30 + source.readUInt16LE(26) + source.readUInt16LE(28);
  const header = Buffer.from(source.subarray(0, start));
  const directory = Buffer.from(source.subarray(start + size));
  header.writeUInt32LE(raw.length, 18);
  directory.writeUInt32LE(raw.length, 20);
  directory.writeUInt32LE(start + raw.length, directory.length - 6);
  zipBytes = Buffer.concat([header, raw, directory]);
}

const unpacked = unzipSync(zipBytes)['index.html'];
if (!unpacked || Buffer.compare(Buffer.from(unpacked), Buffer.from(htmlBytes)) !== 0) {
  throw new Error('ZIP verification failed: index.html did not round-trip.');
}

await writeFile(outputZipPath, zipBytes);

const remaining = SIZE_LIMIT - zipBytes.length;
const status = remaining >= 0 ? 'PASS' : 'FAIL';
console.log(`HTML: ${htmlBytes.length.toLocaleString('en-US')} bytes`);
console.log(`ZIP:  ${zipBytes.length.toLocaleString('en-US')} / ${SIZE_LIMIT.toLocaleString('en-US')} bytes`);
console.log(`${status}: ${Math.abs(remaining).toLocaleString('en-US')} bytes ${remaining >= 0 ? 'remaining' : 'over limit'}`);

if (remaining < 0) {
  process.exitCode = 1;
}
