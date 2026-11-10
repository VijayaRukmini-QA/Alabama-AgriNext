import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import '../../../config/env'; // loads .env

// TC-L-57 static scan, no browser.
// SCOPE: source dirs tests/ pages/ utils/ fixtures/ test-data/ config/ (*.ts, *.js, *.json, *.md) and reports/*.json.
// OUT OF SCOPE: docs/ and qa/ (finding H5 concerns long digit strings in the documents, not code), traces (zip),
// node_modules. Findings print file:line only, never the matched value.

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE_DIRS = ['tests', 'pages', 'utils', 'fixtures', 'test-data', 'config'];
const SOURCE_EXT = /\.(ts|js|json|md)$/;

const SSN_DASHED = /\b\d{3}-\d{2}-\d{4}\b/;
const SSN_BARE_QUOTED = /(['"`])\d{9}\1/;

function walk(dir: string, accept: (f: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, accept, out);
    } else if (accept(full)) out.push(full);
  }
  return out;
}

function sourceFiles(): string[] {
  return SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d), (f) => SOURCE_EXT.test(f)));
}

function reportJsonFiles(): string[] {
  const dir = path.join(ROOT, 'reports');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
}

/** file:line of every line matching `isHit`; never returns the line content. */
function findLines(file: string, isHit: (line: string) => boolean): string[] {
  const hits: string[] = [];
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (isHit(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
  });
  return hits;
}

test.describe('Customer Loan Application - data hygiene', () => {
  test('TC-L-57 @customer @loan @regression no SSN-shaped literal in source, test data or reports', () => {
    const files = [...sourceFiles(), ...reportJsonFiles()];
    expect(files.length, 'files scanned').toBeGreaterThan(0);
    const hits = files.flatMap((f) => findLines(f, (l) => SSN_DASHED.test(l) || SSN_BARE_QUOTED.test(l)));
    expect(hits, 'SSN-shaped literals (file:line)').toEqual([]);
  });

  test('TC-L-57 @customer @loan @regression the LOAN_TEST_SSN value does not appear in source, test data or reports', () => {
    const ssn = process.env.LOAN_TEST_SSN?.trim();
    test.skip(!ssn, 'LOAN_TEST_SSN is not set, the env-value scan has nothing to look for');
    const digits = ssn!.replace(/\D/g, '');
    const needles = [ssn!, ...(digits.length >= 9 ? [digits] : [])];
    const files = [...sourceFiles(), ...reportJsonFiles()];
    const hits = files.flatMap((f) => findLines(f, (l) => needles.some((n) => l.includes(n))));
    expect(hits, 'files containing the SSN value (file:line)').toEqual([]);
  });
});
