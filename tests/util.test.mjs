import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, safeUrl, pct, avg, driveInfo } from '../src/lib/util.js';

test('esc encodes HTML-sensitive characters', () => {
  assert.equal(esc('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
});

test('safeUrl accepts only absolute HTTP and HTTPS URLs', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('/relative/path'), '');
});

test('pct handles normal, zero and empty totals', () => {
  assert.equal(pct(3, 4), 75);
  assert.equal(pct(0, 0), 0);
});

test('avg returns rounded average and handles empty arrays', () => {
  assert.equal(avg([70, 80, 90]), 80);
  assert.equal(avg([]), 0);
});

test('driveInfo accepts Drive file links and rejects unrelated hosts', () => {
  const info = driveInfo('https://drive.google.com/file/d/abc_123/view');
  assert.equal(info.ok, true);
  assert.equal(info.id, 'abc_123');
  assert.match(info.embed, /\/preview$/);
  assert.equal(driveInfo('https://example.com/file/d/abc').ok, false);
});
