import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const readBuilt = (locale, page) => {
  const path = '../dist/' + locale + '/' + page + '/index.html';
  const file = new URL(path, import.meta.url);
  return {
    path,
    html: readFileSync(file, 'utf8'),
    bytes: statSync(file).size
  };
};

test('built legal pages contain complete non-empty HTML bodies', () => {
  const expected = [
    ['en', 'privacy', 15, 'Privacy Policy', '/en/privacy'],
    ['en', 'terms', 25, 'Terms of Service', '/en/terms'],
    ['zh-Hant', 'privacy', 15, '隱私權政策', '/zh-Hant/privacy'],
    ['zh-Hant', 'terms', 25, '服務條款', '/zh-Hant/terms']
  ];

  for (const [locale, page, sectionCount, marker, footerPath] of expected) {
    const built = readBuilt(locale, page);
    assert.ok(built.bytes > 5000, built.path + ' should not be a doctype-only shell');
    assert.match(built.html, /<h1\b[^>]*>/iu);
    assert.match(built.html, new RegExp(marker, 'u'));
    assert.match(built.html, /<footer\b/iu);
    assert.match(built.html, new RegExp('href="' + footerPath + '"', 'u'));
    assert.equal((built.html.match(/<h2\b/giu) ?? []).length, sectionCount);
    assert.doesNotMatch(built.html, /\[(?:OPERATOR|EFFECTIVE|PRIVACY|SUPPORT|LEGAL|GOVERNING)_[A-Z_]+\]/u);
    assert.doesNotMatch(built.html, /<!DOCTYPE html>\s*$/iu);
  }
});
