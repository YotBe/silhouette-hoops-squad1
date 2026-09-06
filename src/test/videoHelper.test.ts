import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  videoFileName,
  videoAssetFor,
  hasPlayableVideo,
  resolveVideoUrl,
  applyVideoPolicy,
  selectablePool,
  shouldAttemptVideo,
  canPlayCodec,
  videoCoverage,
  videoAssetForPlayer,
  recommendedPolicy,
  DEFAULT_VIDEO_POLICY,
} from '@/utils/videoHelper';
import { PLAYERS } from '@/data/players';

/** A minimal player. Clips resolve by id, so the id is what matters. */
const p = (id: string, videoFile = `/videos/${id}.mp4`) => ({ id, videoFile });

describe('videoFileName', () => {
  it('takes the basename', () => {
    expect(videoFileName('/videos/curry.mp4')).toBe('curry.mp4');
    expect(videoFileName('https://cdn.example.com/a/b/kyrie.mp4?v=2')).toBe('kyrie.mp4');
  });

  it('handles an absent video', () => {
    expect(videoFileName('')).toBe('');
    expect(videoFileName(undefined)).toBe('');
  });
});

describe('hasPlayableVideo', () => {
  it('accepts a clip that exists in a universally supported codec', () => {
    expect(hasPlayableVideo(p('curry'))).toBe(true);
    expect(videoAssetFor('/videos/curry.mp4')?.codec).toBe('h264');
  });

  it('rejects an HEVC clip — it is blank in Firefox', () => {
    expect(videoAssetFor('/videos/durant.mov')?.codec).toBe('hevc');
    expect(hasPlayableVideo(p('durant', '/videos/durant.mov'))).toBe(false);
  });

  it('rejects a clip the data claims but disk does not have', () => {
    expect(hasPlayableVideo(p('jokic'))).toBe(false);
  });

  it('rejects a player with no video', () => {
    expect(hasPlayableVideo({ id: 'nobody', videoFile: '' })).toBe(false);
  });

  it('trusts an absolute URL it cannot inspect', () => {
    expect(hasPlayableVideo({ id: 'jokic', videoFile: 'https://cdn.example.com/jokic.mp4' })).toBe(true);
  });
});

describe('resolveVideoUrl', () => {
  it('resolves a local clip by player id', () => {
    expect(resolveVideoUrl(p('curry'))).toBe('/videos/curry.mp4');
  });

  it('passes through an absolute URL untouched', () => {
    expect(resolveVideoUrl({ id: 'x', videoFile: 'https://cdn.example.com/x.mp4' })).toBe('https://cdn.example.com/x.mp4');
  });

  it('prefers what is on disk over a stale declared path', () => {
    // players.ts still says .mov for a player whose .mp4 was added later.
    expect(resolveVideoUrl({ id: 'kyrie', videoFile: '/videos/kyrie.mov' })).toBe('/videos/kyrie.mp4');
  });

  it('is empty for a player with no clip anywhere', () => {
    expect(resolveVideoUrl({ id: 'nobody', videoFile: '' })).toBe('');
  });
});

describe('applyVideoPolicy', () => {
  const pool = [p('curry'), p('durant', '/videos/durant.mov'), { id: 'nobody', videoFile: '' }];

  it('leaves the pool alone under "any"', () => {
    expect(applyVideoPolicy(pool, 'any')).toHaveLength(3);
  });

  it('keeps only playable clips under "video-only"', () => {
    expect(applyVideoPolicy(pool, 'video-only')).toEqual([p('curry')]);
  });

  it('returns an empty pool under "video-only" when nothing is playable', () => {
    expect(applyVideoPolicy([{ id: 'nobody', videoFile: '' }, p('durant', '/videos/durant.mov')], 'video-only')).toEqual([]);
  });

  it('falls back to the full pool under "video-first" rather than stalling', () => {
    expect(applyVideoPolicy([{ id: 'nobody', videoFile: '' }, p('jokic')], 'video-first')).toHaveLength(2);
  });
});

describe('shouldAttemptVideo', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('does not request a clip that is not on disk', () => {
    expect(shouldAttemptVideo(p('jokic'))).toBe(false);
  });

  it('requests a universally playable clip', () => {
    expect(shouldAttemptVideo(p('curry'))).toBe(true);
  });

  it('requests an HEVC clip only where the browser can decode it', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    expect(canPlayCodec('hevc')).toBe(true);
    expect(shouldAttemptVideo(p('durant', '/videos/durant.mov'))).toBe(true);

    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    expect(canPlayCodec('hevc')).toBe(false);
    expect(shouldAttemptVideo(p('durant', '/videos/durant.mov'))).toBe(false);
  });
});

describe('real content coverage', () => {
  it('reports the roster honestly', () => {
    const coverage = videoCoverage(PLAYERS);
    expect(coverage.totalPlayers).toBe(PLAYERS.length);
    expect(coverage.withPlayableVideo + coverage.claimingBrokenVideo + coverage.withoutVideo)
      .toBe(coverage.totalPlayers);
  });

  it('no player points at an unplayable file that has a playable sibling', () => {
    // This is the curry.mov / kyrie.mov bug class: an H.264 version sat right
    // next to the HEVC one the data referenced.
    const offenders = PLAYERS.filter(pl => {
      const asset = videoAssetFor(pl.videoFile);
      if (!asset || asset.playable) return false;
      const stem = asset.file.replace(/\.[^.]+$/, '');
      return videoAssetFor(`/videos/${stem}.mp4`)?.playable === true;
    });
    expect(offenders.map(o => o.id)).toEqual([]);
  });

  it('serves only players with clips by default', () => {
    expect(DEFAULT_VIDEO_POLICY).toBe('video-only');
    expect(recommendedPolicy()).toBe('video-only');
    expect(applyVideoPolicy(PLAYERS, 'video-only').length).toBe(videoCoverage(PLAYERS).withPlayableVideo);
  });

  it('never hands a round an empty pool to draw from', () => {
    expect(selectablePool(PLAYERS).length).toBeGreaterThan(0);
    // Even a pool with nothing playable still yields something to ask about.
    const noClips = [{ id: 'nobody', videoFile: '' }, p('jokic')];
    expect(selectablePool(noClips)).toHaveLength(2);
  });

  it('resolves a clip by naming convention, so a dropped-in file needs no data edit', () => {
    // giannis.mp4 is on disk; the lookup goes through the id, not the path.
    expect(videoAssetForPlayer({ id: 'giannis', videoFile: '' })?.file).toBe('giannis.mp4');
    expect(hasPlayableVideo({ id: 'giannis', videoFile: '' })).toBe(true);
  });
});
