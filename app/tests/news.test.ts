import test from 'node:test';
import assert from 'node:assert/strict';
import { recentNews } from '../lib/news.mjs';
test('news excludes stale, future, invalid, unsafe and duplicate entries regardless of relevance', () => {
  const now=Date.parse('2026-09-07T12:00:00Z');
  const items=[
    {pubDate:'2026-01-19',link:'https://source.example/old',relevance:999},
    {pubDate:'2026-09-01',link:'https://source.example/one',relevance:10},
    {pubDate:'2026-09-06',link:'https://source.example/two',relevance:1},
    {pubDate:'2026-09-01',link:'https://source.example/one',relevance:10},
    {pubDate:'2026-09-08',link:'https://source.example/future'},
    {pubDate:'invalid',link:'https://source.example/invalid'},
    {pubDate:'2026-09-06',link:'javascript:alert(1)'},
  ];
  assert.deepEqual(recentNews(items,now).map(i => i.link),['https://source.example/two','https://source.example/one']);
});
