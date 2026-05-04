'use client';

import { CSSProperties, ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { TVFrame } from './components/TVFrame';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { suppressTrackingWarnings } from './lib/suppressWarnings';

const CHANNEL_SOURCES = [
  { type: 'playlist' as const, id: 'PL12maSalsZwochzJ4WV7IDq9SKjFq6PH3', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PL7j8fIfWProPmvmURRv_0xYdzwVELYh5R', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PLkDfh3JIbsF0OueucpLlKY9FBfXwzGiby', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PLQy1j8Ed7GZWX5CXY5JRUfWT_HV86YWKQ', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PLbt09tWqepBRYcl3jIaAUhLKEpNjGSf2B', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PLepvMV5u2rq-hynJpSFhJE2ni2Tdg7FAa', weight: 2, cooldown: 4 },
  { type: 'playlist' as const, id: 'PLWSdaAk9w6V-XJn4R0pigf3xSJTEC9OwS', weight: 2, cooldown: 4 },
  { type: 'video' as const, id: '8O9nwEEwv2Y' },
  { type: 'video' as const, id: 'NjQpkbIzdlU' },
  { type: 'playlist' as const, id: 'PLMRKdK25AuPVjHl9Kdb-gkBy0Cm7Zi2xo' },
  { type: 'playlist' as const, id: 'PLxH6Eg4Kj04rdhBycZCECehHe4z4B3g5R' },
  { type: 'playlist' as const, id: 'PLosVHzQ8pf-rPkeJYC260yXoIfqLsJQkw' },
  { type: 'playlist' as const, id: 'PLlHwJ0wIGQ8L8v0UppoYMvN0DT3LZ2yFK' },
  { type: 'playlist' as const, id: 'PLZs0gQed9tMQcnKBoXtgJW7mq_LNtfB9g' },
  { type: 'playlist' as const, id: 'PLgJ6aTbORHA0GplKHXTm3h9EJujqLLu3g' },
  { type: 'playlist' as const, id: 'PLRlD7oY6eIqx6Hg8qsysAfURC9fN1X8SQ' },
  { type: 'playlist' as const, id: 'PL6Rb9JTdSidHEx8ZNuoLscy_MsUQJMsOl' },
  { type: 'playlist' as const, id: 'PL1Twa3JQ8CtZW23YZWYqLOyhxW1sPDWDc' },
  { type: 'playlist' as const, id: 'PLNWRqRwSX5lO_eNL96J4hVq9kmOZ2VPTs' },
  { type: 'playlist' as const, id: 'PLoKPP86iRYSxYIfz1QDf-0F-Ch_dRCKt5' },
  { type: 'playlist' as const, id: 'PLiIrUBPGrEViPAWqwpfixO8oGjJ9cEU95' },
  { type: 'playlist' as const, id: 'PLQ_voP4Q3cfcxaaEo-rXWEl8wPJQwCUOo' },
  { type: 'playlist' as const, id: 'PLKBichqIpPt5qsnwphJtfr8WEmVw89bM1' },
  { type: 'playlist' as const, id: 'PLAHouvaC4CkOnubOV5uCev8pa7iFYYhmc' },
  { type: 'playlist' as const, id: 'PLlVlyGVtvuVniS7jx4DyESaKRUANIzyhE' },
];
const YOUTUBE_CHROME_FADE_MS = 4200;
const TUNING_STATIC_FALLBACK_MS = 9500;
const POWER_INTRO_MS = 3000;
const CHANNEL_TITLE_MS = 4000;
const VOLUME_OVERLAY_MS = 1800;
const DEFAULT_TV_ZOOM = 1;
const MIN_TV_ZOOM = 1;
const MAX_TV_ZOOM = 1.65;
const TV_ZOOM_STEP = 0.05;
const TV_ZOOM_CENTER = {
  x: 50,
  y: 30,
};
const GARAGE_LOADING_IMAGE = '/assets/garage_texture_4k.png';
const ROOM_PRELOAD_IMAGES = [
  '/assets/tv/tv off.png',
  '/assets/tv/tv on.png',
  '/assets/light switch.png',
  '/assets/zoom control.png',
  '/assets/book.png',
  '/assets/clock.png',
  '/assets/paper 1.png',
  '/assets/tv/tv loading an.gif',
];

export default function Home() {
  const [isSiteLoading, setIsSiteLoading] = useState(true);
  const [isGarageAnimationStarted, setIsGarageAnimationStarted] = useState(false);
  const [isTVOn, setIsTVOn] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isStatic, setIsStatic] = useState(false);
  const [isPowerIntro, setIsPowerIntro] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [visibleChannelTitle, setVisibleChannelTitle] = useState('');
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [isCreditsMenuOpen, setIsCreditsMenuOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [clockTime, setClockTime] = useState(() => new Date());
  const [tvZoom, setTvZoom] = useState(DEFAULT_TV_ZOOM);
  const tuningTimeoutRef = useRef<number | null>(null);
  const staticPlaybackSignalRef = useRef(0);
  const playbackReadySignalRef = useRef(0);
  const powerIntroTimeoutRef = useRef<number | null>(null);
  const titleTimeoutRef = useRef<number | null>(null);
  const volumeTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTuningSound = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;

    const duration = 0.28;
    const sampleCount = Math.floor(audioContext.sampleRate * duration);
    const noiseBuffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    const oscillatorGain = audioContext.createGain();
    const now = audioContext.currentTime;

    noise.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + duration);
    filter.Q.setValueAtTime(0.8, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(95, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + duration);
    oscillatorGain.gain.setValueAtTime(0.03, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(audioContext.destination);

    noise.start(now);
    oscillator.start(now);
    noise.stop(now + duration);
    oscillator.stop(now + duration);
  }, []);

  const { containerRef, player, isReady, playbackReadySignal, currentTitle, tuneToRandomChannel } = useYouTubePlayer(CHANNEL_SOURCES, {
    onTuneStart: playTuningSound,
    randomStartPositions: true,
  });
  const zoomProgress = ((tvZoom - MIN_TV_ZOOM) / (MAX_TV_ZOOM - MIN_TV_ZOOM)) * 100;
  const zoomThumbTop = 63 - zoomProgress * 0.40;

  useEffect(() => {
    suppressTrackingWarnings();
  }, []);

  useEffect(() => {
    window.alert('Click F11 for a better experience');
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let finishTimeoutId: number | null = null;

    const startGarageAnimation = () => {
      if (isCancelled) return;

      setIsGarageAnimationStarted(true);

      ROOM_PRELOAD_IMAGES.forEach((src) => {
        const image = new Image();
        image.src = src;
      });

      if (finishTimeoutId) {
        window.clearTimeout(finishTimeoutId);
      }

      finishTimeoutId = window.setTimeout(() => {
        setIsSiteLoading(false);
      }, 3200);
    };

    const garageImage = new Image();
    garageImage.onload = startGarageAnimation;
    garageImage.onerror = startGarageAnimation;
    garageImage.src = GARAGE_LOADING_IMAGE;

    const fallbackTimeoutId = window.setTimeout(startGarageAnimation, 900);

    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackTimeoutId);

      if (finishTimeoutId) {
        window.clearTimeout(finishTimeoutId);
      }
    };
  }, []);

  useEffect(() => {
    playbackReadySignalRef.current = playbackReadySignal;
  }, [playbackReadySignal]);

  const showStaticUntilPlaybackSettles = useCallback(() => {
    staticPlaybackSignalRef.current = playbackReadySignalRef.current;
    setIsStatic(true);

    if (tuningTimeoutRef.current) {
      window.clearTimeout(tuningTimeoutRef.current);
    }

    tuningTimeoutRef.current = window.setTimeout(() => {
      setIsStatic(false);
      tuningTimeoutRef.current = null;
    }, TUNING_STATIC_FALLBACK_MS);
  }, []);

  useEffect(() => {
    if (!isStatic) return;
    if (playbackReadySignal <= staticPlaybackSignalRef.current) return;

    if (tuningTimeoutRef.current) {
      window.clearTimeout(tuningTimeoutRef.current);
    }

    tuningTimeoutRef.current = window.setTimeout(() => {
      setIsStatic(false);
      tuningTimeoutRef.current = null;
    }, YOUTUBE_CHROME_FADE_MS);
  }, [isStatic, playbackReadySignal]);

  useEffect(() => {
    return () => {
      if (tuningTimeoutRef.current) {
        window.clearTimeout(tuningTimeoutRef.current);
      }
      if (powerIntroTimeoutRef.current) {
        window.clearTimeout(powerIntroTimeoutRef.current);
      }
      if (titleTimeoutRef.current) {
        window.clearTimeout(titleTimeoutRef.current);
      }
      if (volumeTimeoutRef.current) {
        window.clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  const showVolumeOverlay = useCallback(() => {
    setIsVolumeVisible(true);

    if (volumeTimeoutRef.current) {
      window.clearTimeout(volumeTimeoutRef.current);
    }

    volumeTimeoutRef.current = window.setTimeout(() => {
      setIsVolumeVisible(false);
      volumeTimeoutRef.current = null;
    }, VOLUME_OVERLAY_MS);
  }, []);

  useEffect(() => {
    if (!isTVOn || !currentTitle) return;

    setVisibleChannelTitle(currentTitle);

    if (titleTimeoutRef.current) {
      window.clearTimeout(titleTimeoutRef.current);
    }

    titleTimeoutRef.current = window.setTimeout(() => {
      setVisibleChannelTitle('');
      titleTimeoutRef.current = null;
    }, CHANNEL_TITLE_MS);
  }, [currentTitle, isTVOn]);

  const handlePower = useCallback(() => {
    const nextIsTVOn = !isTVOn;
    setIsTVOn(nextIsTVOn);

    if (!nextIsTVOn) {
      setIsStatic(false);
      setIsPowerIntro(false);
      setIsCreditsMenuOpen(false);
      if (powerIntroTimeoutRef.current) {
        window.clearTimeout(powerIntroTimeoutRef.current);
        powerIntroTimeoutRef.current = null;
      }
      player?.pauseVideo();
      return;
    }

    setIsStatic(false);
    setIsPowerIntro(true);
    playTuningSound();

    powerIntroTimeoutRef.current = window.setTimeout(() => {
      setIsPowerIntro(false);
      powerIntroTimeoutRef.current = null;
    }, POWER_INTRO_MS);
  }, [isTVOn, playTuningSound, player]);

  useEffect(() => {
    if (!player || !isReady || !isTVOn) return;
    if (isPowerIntro) return;

    showStaticUntilPlaybackSettles();

    const timeoutId = window.setTimeout(() => tuneToRandomChannel(player), 500);
    return () => window.clearTimeout(timeoutId);
  }, [player, isReady, isTVOn, isPowerIntro, showStaticUntilPlaybackSettles, tuneToRandomChannel]);

  const handleChannelUp = useCallback(() => {
    if (!isTVOn || !player || !isReady) return;

    showStaticUntilPlaybackSettles();
    tuneToRandomChannel(player);
  }, [isTVOn, player, isReady, showStaticUntilPlaybackSettles, tuneToRandomChannel]);

  const handleChannelDown = useCallback(() => {
    if (!isTVOn || !player || !isReady) return;

    showStaticUntilPlaybackSettles();
    tuneToRandomChannel(player);
  }, [isTVOn, player, isReady, showStaticUntilPlaybackSettles, tuneToRandomChannel]);

  const handleMenu = useCallback(() => {
    if (!isTVOn) return;
    setIsCreditsMenuOpen((isOpen) => !isOpen);
  }, [isTVOn]);

  const handleLightSwitch = useCallback(() => {
    setIsCinemaMode((isEnabled) => !isEnabled);
  }, []);

  const handleBookOpen = useCallback(() => {
    setIsBookModalOpen(true);
  }, []);

  const handleBookClose = useCallback(() => {
    setIsBookModalOpen(false);
  }, []);

  const handlePaperOpen = useCallback(() => {
    setIsPaperModalOpen(true);
  }, []);

  const handlePaperClose = useCallback(() => {
    setIsPaperModalOpen(false);
  }, []);

  const handleClockOpen = useCallback(() => {
    setClockTime(new Date());
    setIsClockModalOpen(true);
  }, []);

  const handleClockClose = useCallback(() => {
    setIsClockModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isClockModalOpen) return;

    const intervalId = window.setInterval(() => {
      setClockTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isClockModalOpen]);

  const handleZoomChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTvZoom(Number(e.target.value));
  }, []);

  const handleZoomStep = useCallback((direction: 1 | -1) => {
    setTvZoom((currentZoom) => {
      const nextZoom = currentZoom + direction * TV_ZOOM_STEP;
      return Math.min(MAX_TV_ZOOM, Math.max(MIN_TV_ZOOM, nextZoom));
    });
  }, []);

  const handleVolumeUp = useCallback(() => {
    if (!isTVOn || !player || !isReady) return;

    const newVolume = Math.min(100, volume + 5);
    setVolume(newVolume);
    player.setVolume(newVolume);
    showVolumeOverlay();
  }, [isTVOn, player, isReady, showVolumeOverlay, volume]);

  const handleVolumeDown = useCallback(() => {
    if (!isTVOn || !player || !isReady) return;

    const newVolume = Math.max(0, volume - 5);
    setVolume(newVolume);
    player.setVolume(newVolume);
    showVolumeOverlay();
  }, [isTVOn, player, isReady, showVolumeOverlay, volume]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePower();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleChannelDown();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleChannelUp();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleVolumeDown();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleVolumeUp();
          break;
        case 'Escape':
          setIsBookModalOpen(false);
          setIsClockModalOpen(false);
          setIsPaperModalOpen(false);
          setIsCreditsMenuOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePower, handleChannelUp, handleChannelDown, handleVolumeUp, handleVolumeDown]);

  return (
    <main className="min-h-screen overflow-hidden bg-black">
      <div className="flex min-h-screen w-full items-center justify-center">
        <div
          className="relative w-fit origin-center transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `scale(${tvZoom})`,
            transformOrigin: `${TV_ZOOM_CENTER.x}% ${TV_ZOOM_CENTER.y}%`,
          }}
        >
          <TVFrame
            isTurnedOn={isTVOn}
            isPowerIntro={isPowerIntro}
            isStatic={isStatic}
            onPower={handlePower}
            onMenu={handleMenu}
            onLightSwitch={handleLightSwitch}
            onChannelUp={handleChannelUp}
            onChannelDown={handleChannelDown}
            onVolumeUp={handleVolumeUp}
            onVolumeDown={handleVolumeDown}
            onBookOpen={handleBookOpen}
            onClockOpen={handleClockOpen}
            onPaperOpen={handlePaperOpen}
            isCinemaMode={isCinemaMode}
            isTVOn={isTVOn}
            volume={volume}
          >
            {isTVOn && (
              <>
                <div
                  ref={containerRef}
                  className="absolute inset-0 bg-black"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-20"
                />
                {visibleChannelTitle && (
                  <div className="pixel-ui pointer-events-none absolute left-5 top-5 z-30 max-w-[70%] bg-black/50 px-3 py-1.5 text-[#00ff00]">
                    <p className="truncate text-sm">{visibleChannelTitle}</p>
                  </div>
                )}
                {isVolumeVisible && (
                  <div className="pixel-ui pointer-events-none absolute bottom-6 left-1/2 z-30 w-[58%] -translate-x-1/2 bg-black/50 px-3 py-2 text-xs text-[#00ff00]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <i aria-hidden="true" className={volume === 0 ? 'hn hn-sound-mute' : 'hn hn-sound-on'} />
                        <span>VOLUME</span>
                      </span>
                      <span>{volume}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i aria-hidden="true" className="hn hn-minus text-[#00ff00]" />
                      <div className="h-2 flex-1 overflow-hidden border border-[#00ff00]/70 bg-black">
                        <div
                          className="h-full bg-[#00ff00] transition-all duration-200"
                          style={{ width: `${volume}%` }}
                        />
                      </div>
                      <i aria-hidden="true" className="hn hn-plus text-[#00ff00]" />
                    </div>
                  </div>
                )}
                {isCreditsMenuOpen && (
                  <div className="pixel-ui absolute inset-0 z-40 flex items-center justify-center bg-black/50 px-6">
                    <div className="w-full max-w-sm border border-[#00ff00]/60 bg-black/80 p-4 text-sm text-[#00ff00] shadow-2xl">
                      <p className="mb-3 text-base">CREDITS</p>
                      <h2 className="flex items-center gap-2 text-lg">
                        <i aria-hidden="true" className="hn hn-user" />
                        ANAS BOUNAIM
                      </h2>
                      <p className="mt-3 text-xs">
                        Moroccan Retro TV Experience
                      </p>
                      <div className="mt-5 space-y-3 text-xs">
                        <a
                          className="flex items-center gap-2 bg-[#00ff00]/10 px-3 py-2 font-bold text-[#00ff00] transition hover:bg-[#00ff00]/20"
                          href="https://www.linkedin.com/in/anas-bounaim-37450621a/?skipRedirect=true"
                          rel="noreferrer"
                          target="_blank"
                        >
                          <i aria-hidden="true" className="hn hn-linkedin" />
                          LINKEDIN
                        </a>
                        <a
                          className="flex items-center gap-2 bg-[#00ff00]/10 px-3 py-2 font-bold text-[#00ff00] transition hover:bg-[#00ff00]/20"
                          href="https://github.com/anasbounaiim"
                          rel="noreferrer"
                          target="_blank"
                        >
                          <i aria-hidden="true" className="hn hn-github" />
                          GITHUB
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TVFrame>
        </div>

        <aside
          aria-label="TV zoom remote"
          className="tv-zoom-control fixed bottom-10 right-0 z-[100] sm:bottom-12 sm:right-2"
          style={{
            '--tv-zoom-progress': `${zoomProgress}%`,
            '--tv-zoom-thumb-top': `${zoomThumbTop}%`,
          } as CSSProperties}
        >
          <img
            alt=""
            aria-hidden="true"
            className="tv-zoom-remote-image"
            src="/assets/zoom control.png"
          />
          <div aria-hidden="true" className="tv-zoom-remote-track" />
          <div aria-hidden="true" className="tv-zoom-remote-thumb" />
          <button
            aria-label="Zoom in"
            className="tv-zoom-remote-button tv-zoom-remote-button-top"
            onClick={() => handleZoomStep(1)}
            type="button"
          />
          <input
            aria-label="TV zoom"
            className="tv-zoom-slider"
            max={MAX_TV_ZOOM}
            min={MIN_TV_ZOOM}
            onChange={handleZoomChange}
            step="0.01"
            type="range"
            value={tvZoom}
          />
          <button
            aria-label="Zoom out"
            className="tv-zoom-remote-button tv-zoom-remote-button-bottom"
            onClick={() => handleZoomStep(-1)}
            type="button"
          />
        </aside>
        {isBookModalOpen && (
          <div
            aria-modal="true"
            className="book-modal-backdrop fixed inset-0 z-[140] flex items-center justify-center px-4"
            onClick={handleBookClose}
            role="dialog"
          >
            <div
              className="book-modal-content relative w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Close book"
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/80 text-xl leading-none text-black shadow-lg transition hover:bg-white"
                onClick={handleBookClose}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-times-solid" />
              </button>
              <img
                alt="Open book showing site controls"
                className="book-modal-image w-full object-contain"
                src="/assets/book open.png"
              />
            </div>
          </div>
        )}
        {isClockModalOpen && (
          <div
            aria-modal="true"
            className="clock-modal-backdrop fixed inset-0 z-[140] flex items-center justify-center px-4"
            onClick={handleClockClose}
            role="dialog"
          >
            <div
              className="clock-modal-content relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Close clock"
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/80 text-xl leading-none text-black shadow-lg transition hover:bg-white"
                onClick={handleClockClose}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-times-solid" />
              </button>
              <div
                aria-label={clockTime.toLocaleTimeString()}
                className="clock-face"
                role="img"
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="clock-modal-image"
                  src="/assets/clock.png"
                />
                <span
                  aria-hidden="true"
                  className="clock-hand clock-hand-hour"
                  style={{
                    transform: `translateX(-50%) rotate(${
                      (clockTime.getHours() % 12) * 30 +
                      clockTime.getMinutes() * 0.5
                    }deg)`,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="clock-hand clock-hand-minute"
                  style={{
                    transform: `translateX(-50%) rotate(${
                      clockTime.getMinutes() * 6 + clockTime.getSeconds() * 0.1
                    }deg)`,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="clock-hand clock-hand-second"
                  style={{
                    transform: `translateX(-50%) rotate(${clockTime.getSeconds() * 6}deg)`,
                  }}
                />
                <span aria-hidden="true" className="clock-hand-pin" />
              </div>
            </div>
          </div>
        )}
        {isPaperModalOpen && (
          <div
            aria-modal="true"
            className="paper-modal-backdrop fixed inset-0 z-[140] flex items-center justify-center px-4"
            onClick={handlePaperClose}
            role="dialog"
          >
            <div
              className="paper-modal-content relative w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Close paper"
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/80 text-xl leading-none text-black shadow-lg transition hover:bg-white"
                onClick={handlePaperClose}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-times-solid" />
              </button>
              <img
                alt="Paper note"
                className="paper-modal-image w-full object-contain"
                src="/assets/paper 2.png"
              />
            </div>
          </div>
        )}
        {isSiteLoading && (
          <div
            aria-label="Loading retro TV room"
            aria-live="polite"
            className={`garage-loading pointer-events-none fixed inset-0 z-[220] overflow-hidden ${
              isGarageAnimationStarted ? 'garage-loading-ready' : ''
            }`}
            role="status"
          >
            <img
              alt=""
              aria-hidden="true"
              className={`garage-loading-curtain ${
                isGarageAnimationStarted ? 'garage-loading-curtain-active' : ''
              }`}
              src={GARAGE_LOADING_IMAGE}
            />
          </div>
        )}
      </div>
    </main>
  );
}
