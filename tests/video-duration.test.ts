import assert from 'node:assert/strict';
import test from 'node:test';
import { formatVideoDuration, parseVideoDuration } from '../src/lib/video-utils';
import {
  lengthFromWatchPage,
  lookUpYouTubeDuration,
  secondsFromIsoDuration,
  youTubeIdFromUrl,
} from '../src/lib/youtube-duration';

const watchPage = (id: string, secs: number) =>
  `<script>var ytInitialPlayerResponse = {"videoDetails":{"videoId":"${id}","title":"Factory \\"tour\\"","lengthSeconds":"${secs}","keywords":[]}};</script>`;

const page = (body: string, ok = true, status = 200) => ({ ok, status, text: async () => body });

test('typed durations read as seconds', () => {
  assert.equal(parseVideoDuration('2:10'), 130);
  assert.equal(parseVideoDuration(' 0:09 '), 9);
  assert.equal(parseVideoDuration('130'), 130);
  assert.equal(parseVideoDuration('1:02:03'), 3723);
  for (const bad of ['', '0:00', '2:75', '1:75:00', 'abc', '2.5', '1:2:3:4', null, undefined]) {
    assert.equal(parseVideoDuration(bad), null, String(bad));
  }
});

test('a saved duration shows in the CMS form and saves back unchanged', () => {
  for (const secs of [9, 59, 60, 130, 139, 3723]) {
    assert.equal(parseVideoDuration(formatVideoDuration(secs)), secs);
  }
});

test('YouTube links of every shape give the video id', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=OHepQW8Ngww',
    'https://youtu.be/OHepQW8Ngww',
    'https://www.youtube.com/shorts/OHepQW8Ngww?feature=share',
    'https://www.youtube.com/embed/OHepQW8Ngww',
  ]) {
    assert.equal(youTubeIdFromUrl(url), 'OHepQW8Ngww', url);
  }
  assert.equal(youTubeIdFromUrl('https://vimeo.com/987654321'), '');
  assert.equal(youTubeIdFromUrl('not a url'), '');
});

test('YouTube Data API durations read as seconds', () => {
  assert.equal(secondsFromIsoDuration('PT2M10S'), 130);
  assert.equal(secondsFromIsoDuration('PT45S'), 45);
  assert.equal(secondsFromIsoDuration('PT1H2M3S'), 3723);
  assert.equal(secondsFromIsoDuration('P0D'), null);
  assert.equal(secondsFromIsoDuration(''), null);
});

test('the watch page length is read for the requested video only', () => {
  const html = `{"videoDetails":{"videoId":"other123456","lengthSeconds":"9"}} ${watchPage('OHepQW8Ngww', 130)}`;
  assert.equal(lengthFromWatchPage(html, 'OHepQW8Ngww'), 130);
  assert.equal(lengthFromWatchPage(html, 'missing1234'), null);
});

test('without an API key the length comes from the watch page', async () => {
  const asked: string[] = [];
  const secs = await lookUpYouTubeDuration('https://youtu.be/OHepQW8Ngww', {
    env: {},
    fetchImpl: async (input) => {
      asked.push(input);
      return page(watchPage('OHepQW8Ngww', 130));
    },
  });
  assert.equal(secs, 130);
  assert.deepEqual(asked, ['https://www.youtube.com/watch?v=OHepQW8Ngww']);
});

test('with an API key the Data API answers first, and the watch page covers a failure', async () => {
  const api = JSON.stringify({ items: [{ contentDetails: { duration: 'PT2M19S' } }] });
  const viaApi = await lookUpYouTubeDuration('https://www.youtube.com/watch?v=1ngTFbwm8dk', {
    env: { YOUTUBE_API_KEY: 'test-key' },
    fetchImpl: async (input) => page(input.includes('googleapis.com') ? api : watchPage('1ngTFbwm8dk', 1)),
  });
  assert.equal(viaApi, 139);

  const fallback = await lookUpYouTubeDuration('https://www.youtube.com/watch?v=1ngTFbwm8dk', {
    env: { YOUTUBE_API_KEY: 'test-key' },
    fetchImpl: async (input) => (input.includes('googleapis.com') ? page('', false, 403) : page(watchPage('1ngTFbwm8dk', 139))),
  });
  assert.equal(fallback, 139);
});

test('other links and failed lookups give no duration', async () => {
  let fetched = false;
  const vimeo = await lookUpYouTubeDuration('https://vimeo.com/987654321', {
    env: {},
    fetchImpl: async () => {
      fetched = true;
      return page('');
    },
  });
  assert.equal(vimeo, null);
  assert.equal(fetched, false);

  const offline = await lookUpYouTubeDuration('https://youtu.be/OHepQW8Ngww', {
    env: {},
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  assert.equal(offline, null);

  const refused = await lookUpYouTubeDuration('https://youtu.be/OHepQW8Ngww', { env: {}, fetchImpl: async () => page('', false, 429) });
  assert.equal(refused, null);
});
