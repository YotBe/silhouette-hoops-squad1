import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  videoFileName,
  videoAssetFor,
  hasPlayableVideo,
  playersWithVideo,
  resolveVideoUrl,
  applyVideoPolicy,
  shouldAttemptVideo,
  canPlayCodec,
  videoCoverage,
  MIN_VIDEO_POOL,
} from '@/utils/videoHelper';
import { PLAYERS } from '@/data/players';

const p = (videoFile: string) => ({ videoFile });

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
    expect(hasPlayableVideo(p('/videos/curry.mp4'))).toBe(true);
    expect(videoAssetFor('/videos/curry.mp4')?.codec).toBe('h264');
  });

  it('rejects an HEVC clip — it is blank in Firefox', () => {
    expect(videoAssetFor('/videos/durant.mov')?.codec).toBe('hevc');
    expect(hasPlayableVideo(p('/videos/durant.mov'))).toBe(false);
  });

  it('rejects a clip the data claims but disk does not have', () => {
    expect(hasPlayableVideo(p('/videos/jokic.mp4'))).toBe(false);
  });

  it('rejects a player with no video', () => {
    expect(hasPlayableVideo(p(''))).toBe(false);
  });

  it('trusts an absolute URL it cannot inspect', () => {
    expect(hasPlayableVideo(p('https://cdn.example.com/jokic.mp4'))).toBe(true);
  });
});

describe('resolveVideoUrl', () => {
  it('passes through a local path when no CDN is configured', () => {
    expect(resolveVideoUrl('/videos/curry.mp4')).toBe('/videos/curry.mp4');
  });

  it('passes through an absolute URL untouched', () => {
    expect(resolveVideoUrl('https://cdn.example.com/x.mp4')).toBe('https://cdn.example.com/x.mp4');
  });

  it('is empty for no video', () => {
    expect(resolveVideoUrl(undefined)).toBe('');
  });
});

describe('applyVideoPolicy', () => {
  const pool = [p('/videos/curry.mp4'), p('/videos/durant.mov'), p('')];

  it('leaves the pool alone under "any"', () => {
    expect(applyVideoPolicy(pool, 'any')).toHaveLength(3);
  });

  it('keeps only playable clips under "video-only"', () => {
    expect(applyVideoPolicy(pool, 'video-only')).toEqual([p('/videos/curry.mp4')]);
  });

  it('returns an empty pool under "video-only" when nothing is playable', () => {
    expect(applyVideoPolicy([p(''), p('/videos/durant.mov')], 'video-only')).toEqual([]);
  });

  it('falls back to the full pool under "video-first" rather than stalling', () => {
    expect(applyVideoPolicy([p(''), p('/videos/jokic.mp4')], 'video-first')).toHaveLength(2);
  });
});

describe('shouldAttemptVideo', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('does not request a clip that is not on disk', () => {
    expect(shouldAttemptVideo('/videos/jokic.mp4')).toBe(false);
  });

  it('requests a universally playable clip', () => {
    expect(shouldAttemptVideo('/videos/curry.mp4')).toBe(true);
  });

  it('requests an HEVC clip only where the browser can decode it', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    expect(canPlayCodec('hevc')).toBe(true);
    expect(shouldAttemptVideo('/videos/durant.mov')).toBe(true);

    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    expect(canPlayCodec('hevc')).toBe(false);
    expect(shouldAttemptVideo('/videos/durant.mov')).toBe(false);
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
      return playersWithVideo([{ videoFile: `/videos/${stem}.mp4` }]).length > 0;
    });
    expect(offenders.map(o => o.id)).toEqual([]);
  });

  it('flips to video-first only once there is enough content to avoid repeats', () => {
    expect(MIN_VIDEO_POOL).toBeGreaterThan(1);
    expect(applyVideoPolicy(PLAYERS, 'video-only').length).toBe(videoCoverage(PLAYERS).withPlayableVideo);
  });
});
