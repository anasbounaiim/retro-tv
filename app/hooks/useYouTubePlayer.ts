"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getDuration: () => number;
  getVideoData: () => { author?: string; title?: string; video_id?: string };
  getVideoUrl: () => string;
  loadVideoById: (video: { videoId: string; startSeconds?: number }) => void;
  loadPlaylist: (playlist: {
    list: string;
    listType: 'playlist';
    index?: number;
    startSeconds?: number;
  }) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setShuffle: (shuffle: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YouTubePlayerOptions {
  onTuneStart?: () => void;
  randomStartPositions?: boolean;
}

type YouTubeChannelSource =
  | { type: 'playlist'; id: string; weight?: number; cooldown?: number }
  | { type: 'video'; id: string; weight?: number; cooldown?: number };

function normalizeSources(input: string | string[] | YouTubeChannelSource[]): YouTubeChannelSource[] {
  if (!Array.isArray(input)) {
    return [{ type: 'playlist', id: input }];
  }

  return input.map((source) => {
    if (typeof source === 'string') {
      return { type: 'playlist', id: source };
    }

    return source;
  });
}

function getSafeVideoData(target: YouTubePlayer) {
  try {
    return target.getVideoData() ?? {};
  } catch {
    return {};
  }
}

function getSafeDuration(target: YouTubePlayer) {
  try {
    return target.getDuration() || 0;
  } catch {
    return 0;
  }
}

function getSafeVideoUrl(target: YouTubePlayer) {
  try {
    return target.getVideoUrl() || '';
  } catch {
    return '';
  }
}

function getSourceKey(source: YouTubeChannelSource) {
  return `${source.type}:${source.id}`;
}

function shuffleSources(sources: YouTubeChannelSource[]) {
  const shuffledSources = [...sources];

  for (let i = shuffledSources.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledSources[i], shuffledSources[j]] = [shuffledSources[j], shuffledSources[i]];
  }

  return shuffledSources;
}

function getWeightedSources(sources: YouTubeChannelSource[]) {
  return sources.flatMap((source) => {
    const weight = Math.max(1, Math.floor(source.weight ?? 1));
    return Array.from({ length: weight }, () => source);
  });
}

function getSourceCooldown(source: YouTubeChannelSource, sourceCount: number) {
  return Math.max(0, Math.min(source.cooldown ?? sourceCount - 1, sourceCount - 1));
}

function getHighlightedSources(sources: YouTubeChannelSource[]) {
  return sources.filter((source) => (source.weight ?? 1) > 1);
}

export function useYouTubePlayer(
  channelInput: string | string[] | YouTubeChannelSource[],
  options: YouTubePlayerOptions = {}
) {
  const { onTuneStart, randomStartPositions } = options;
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackReadySignal, setPlaybackReadySignal] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingPlayerRef = useRef<YouTubePlayer | null>(null);
  const isReadyRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const activeChannelSourceKeyRef = useRef<string | null>(null);
  const activeVideoKeyRef = useRef<string | null>(null);
  const lastRandomizedVideoRef = useRef<string | null>(null);
  const channelSourceQueueRef = useRef<YouTubeChannelSource[]>([]);
  const recentlyPlayedSourceKeysRef = useRef<string[]>([]);
  const shouldStartWithHighlightedSourcesRef = useRef(true);
  const isTuningRef = useRef(false);
  const tuningIdRef = useRef(0);
  const channelSources = useMemo(
    () => normalizeSources(channelInput),
    [channelInput]
  );

  const tuneToRandomChannelRef = useRef<(target?: YouTubePlayer) => void>(() => {});

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const resetPlayerState = useCallback(() => {
    clearScheduledTimeouts();
    playerRef.current = null;
    pendingPlayerRef.current = null;
    isReadyRef.current = false;
    activeChannelSourceKeyRef.current = null;
    activeVideoKeyRef.current = null;
    lastRandomizedVideoRef.current = null;
    channelSourceQueueRef.current = [];
    recentlyPlayedSourceKeysRef.current = [];
    shouldStartWithHighlightedSourcesRef.current = true;
    isTuningRef.current = false;
    setPlayer(null);
    setIsReady(false);
    setIsPlaying(false);
    setPlaybackReadySignal(0);
    setCurrentTitle('');
  }, [clearScheduledTimeouts]);

  const destroyPlayer = useCallback(() => {
    const playerToDestroy = playerRef.current ?? pendingPlayerRef.current;
    resetPlayerState();

    try {
      playerToDestroy?.destroy();
    } catch (e) {
      console.warn('Error destroying player:', e);
    }
  }, [resetPlayerState]);

  const seekToRandomPosition = useCallback((target = playerRef.current, force = false, attempt = 0) => {
    if (!target || !isReadyRef.current) return;

    const videoData = getSafeVideoData(target);
    const videoKey = videoData.video_id || getSafeVideoUrl(target);
    const duration = getSafeDuration(target);

    if ((!videoKey || !duration || duration < 20) && attempt < 20) {
      scheduleTimeout(() => seekToRandomPosition(target, force, attempt + 1), 300);
      return;
    }

    if (!videoKey || !duration || duration < 20) {
      return;
    }

    if (!force && lastRandomizedVideoRef.current === videoKey) return;

    const earliestStart = duration > 180 ? 45 : 5;
    const latestStart = Math.max(earliestStart, duration * 0.85);
    const randomSecond = Math.floor(
      earliestStart + Math.random() * (latestStart - earliestStart)
    );
    lastRandomizedVideoRef.current = videoKey;
    target.seekTo(randomSecond, true);
  }, [scheduleTimeout]);

  const getNextChannelSource = useCallback(() => {
    if (channelSources.length === 0) return null;

    if (channelSourceQueueRef.current.length === 0) {
      const activeKey = activeChannelSourceKeyRef.current;
      const highlightedSources = getHighlightedSources(channelSources);
      const shouldUseHighlightedStart =
        shouldStartWithHighlightedSourcesRef.current && highlightedSources.length > 0;
      const nextQueue = shouldUseHighlightedStart
        ? shuffleSources(highlightedSources)
        : shuffleSources(getWeightedSources(channelSources));

      if (shouldUseHighlightedStart) {
        shouldStartWithHighlightedSourcesRef.current = false;
      }

      if (
        activeKey &&
        nextQueue.length > 1 &&
        getSourceKey(nextQueue[0]) === activeKey
      ) {
        nextQueue.push(nextQueue.shift() as YouTubeChannelSource);
      }

      channelSourceQueueRef.current = nextQueue;
    }

    const activeKey = activeChannelSourceKeyRef.current;

    if (
      activeKey &&
      channelSourceQueueRef.current.length > 1 &&
      getSourceKey(channelSourceQueueRef.current[0]) === activeKey
    ) {
      const nextDifferentSourceIndex = channelSourceQueueRef.current.findIndex(
        (source) => getSourceKey(source) !== activeKey
      );

      if (nextDifferentSourceIndex > 0) {
        const [nextDifferentSource] = channelSourceQueueRef.current.splice(nextDifferentSourceIndex, 1);
        channelSourceQueueRef.current.unshift(nextDifferentSource);
      }
    }

    const recentSourceKeys = recentlyPlayedSourceKeysRef.current;
    const isSourcePastCooldown = (source: YouTubeChannelSource) => {
      const sourceKey = getSourceKey(source);
      const lastPlayedIndex = recentSourceKeys.lastIndexOf(sourceKey);

      if (lastPlayedIndex === -1) return true;

      const playsSinceLastUse = recentSourceKeys.length - lastPlayedIndex - 1;
      return playsSinceLastUse >= getSourceCooldown(source, channelSources.length);
    };
    const nextFreshSourceIndex = channelSourceQueueRef.current.findIndex(
      isSourcePastCooldown
    );

    const nextSource =
      nextFreshSourceIndex > 0
        ? channelSourceQueueRef.current.splice(nextFreshSourceIndex, 1)[0]
        : channelSourceQueueRef.current.shift() ?? null;

    if (nextSource) {
      const nextSourceKey = getSourceKey(nextSource);
      const recentSourceLimit = Math.max(0, channelSources.length - 1);

      recentlyPlayedSourceKeysRef.current = [
        ...recentSourceKeys.filter((sourceKey) => sourceKey !== nextSourceKey),
        nextSourceKey,
      ].slice(-recentSourceLimit);
    }

    return nextSource;
  }, [channelSources]);

  const tuneToRandomChannel = useCallback((target = playerRef.current) => {
    if (!target || !isReadyRef.current || channelSources.length === 0) return;

    const source = getNextChannelSource();
    if (!source) return;

    const randomIndex = Math.floor(Math.random() * 35);
    const sourceKey = getSourceKey(source);
    activeChannelSourceKeyRef.current = sourceKey;
    activeVideoKeyRef.current = null;
    lastRandomizedVideoRef.current = null;
    isTuningRef.current = true;
    tuningIdRef.current += 1;
    const tuningId = tuningIdRef.current;
    setError(null);
    onTuneStart?.();

    if (source.type === 'video') {
      target.loadVideoById({ videoId: source.id });
    } else {
      target.loadPlaylist({
        list: source.id,
        listType: 'playlist',
        index: randomIndex,
      });
    }

    scheduleTimeout(() => {
      if (playerRef.current !== target || !isReadyRef.current) return;

      target.playVideo();
      seekToRandomPosition(target, true);
      scheduleTimeout(() => {
        if (tuningIdRef.current === tuningId) {
          isTuningRef.current = false;
        }
      }, 1200);
    }, 800);
  }, [channelSources.length, getNextChannelSource, onTuneStart, scheduleTimeout, seekToRandomPosition]);

  useEffect(() => {
    tuneToRandomChannelRef.current = tuneToRandomChannel;
  }, [tuneToRandomChannel]);

  useEffect(() => {
    channelSourceQueueRef.current = [];
    activeChannelSourceKeyRef.current = null;
    recentlyPlayedSourceKeysRef.current = [];
    shouldStartWithHighlightedSourcesRef.current = true;
  }, [channelSources]);

  const updateCurrentTitle = useCallback((target: YouTubePlayer) => {
    const title = getSafeVideoData(target).title?.trim();
    if (title) {
      setCurrentTitle(title);
    }
  }, []);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current || pendingPlayerRef.current) return;
    if (!(window as any).YT?.Player) return;

    try {
      const ytPlayer = new (window as any).YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: channelSources.find((source) => source.type === 'playlist')?.id ?? '',
          autoplay: 0,
          autohide: 1,
          cc_load_policy: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            try {
              if (!containerRef.current) {
                event.target.destroy();
                return;
              }

              const iframeElement = event.target.getIframe();
              if (iframeElement) {
                iframeElement.classList.add('youtube-display-only');
                iframeElement.setAttribute(
                  'allow',
                  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                );
                iframeElement.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                iframeElement.setAttribute('tabindex', '-1');
                iframeElement.setAttribute('title', 'Retro TV video');
              }
              pendingPlayerRef.current = null;
              playerRef.current = event.target;
              isReadyRef.current = true;
              setPlayer(event.target);
              setIsReady(true);
              setError(null);
              // Set initial volume
              event.target.setVolume(70);
              event.target.setShuffle(false);
              console.log('YouTube Player Ready');
            } catch (e) {
              setError('Failed to configure player');
              console.error('Player configuration error:', e);
            }
          },
          onStateChange: (event: any) => {
            if (event.target !== playerRef.current || !isReadyRef.current) return;

            // 1 = playing, 0 = ended, 2 = paused, 3 = buffering, 5 = cued
            setIsPlaying(event.data === 1);
            if (event.data === 1) {
              setPlaybackReadySignal((signal) => signal + 1);
            }

            if (event.data === 0 && !isTuningRef.current) {
              tuneToRandomChannel(event.target);
              return;
            }

            if (randomStartPositions && event.data === 1) {
              const videoKey = getSafeVideoData(event.target).video_id || getSafeVideoUrl(event.target);

              if (videoKey) {
                activeVideoKeyRef.current = videoKey;
              }

              updateCurrentTitle(event.target);
              seekToRandomPosition(event.target, false);
            }
          },
          onError: (event: any) => {
            if (event.target !== playerRef.current || !isReadyRef.current) return;

            const errorMessages: { [key: number]: string } = {
              2: 'Invalid parameter',
              5: 'HTML5 player error',
              100: 'Video not found',
              101: 'Video not allowed to be played',
              150: 'Video not allowed to be played',
            };
            const errorMsg = errorMessages[event.data] || 'Unknown error';
            setError(`YouTube Error: ${errorMsg}`);

            console.warn('YouTube Player Error:', event.data);
          },
        },
      });
      pendingPlayerRef.current = ytPlayer;
    } catch (e) {
      setError('Failed to initialize YouTube player');
      console.error('Player initialization error:', e);
    }
  }, [channelSources, randomStartPositions, scheduleTimeout, seekToRandomPosition, tuneToRandomChannel, updateCurrentTitle]);

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;

      if (!node) {
        destroyPlayer();
        return;
      }

      if (node && (window as any).YT?.Player) {
        initializePlayer();
      }
    },
    [destroyPlayer, initializePlayer]
  );

  useEffect(() => {
    if ((window as any).YT?.Player) {
      initializePlayer();
      return;
    }

    (window as any).onYouTubeIframeAPIReady = initializePlayer;

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      setError('Failed to load YouTube API');
      console.error('Failed to load YouTube IFrame API');
    };

    document.body.appendChild(script);
  }, [initializePlayer]);

  useEffect(() => {
    return destroyPlayer;
  }, [destroyPlayer]);

  return {
    containerRef: setContainerRef,
    player,
    isReady,
    isPlaying,
    playbackReadySignal,
    currentTitle,
    error,
    seekToRandomPosition,
    tuneToRandomChannel,
  };
}
