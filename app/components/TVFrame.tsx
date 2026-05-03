'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { StaticOverlay } from './StaticOverlay';

const TV_ON_IMAGE = '/assets/tv/tv on.png';
const TV_OFF_IMAGE = '/assets/tv/tv off.png';
const LIGHT_SWITCH_IMAGE = '/assets/light switch.png';
const TV_LOADING_GIF = '/assets/tv/tv loading an.gif';
const BOOK_IMAGE = '/assets/book.png';
const CLOCK_IMAGE = '/assets/clock.png';
const PAPER_IMAGE = '/assets/paper 1.png';

// Edit cinema mode darkness here. 0 = no darkness, 1 = full black.
const CINEMA_MODE_DARKNESS = 0.80;

// Edit the TV power light here.
const POWER_LIGHT_STYLE = {
  left: '51%',
  top: '60.4%',
  width: '0.44%',
};
const INITIAL_CLOCK_TIME = new Date(0);

interface TVFrameProps {
  isTurnedOn: boolean;
  isPowerIntro: boolean;
  isStatic: boolean;
  children: ReactNode;
  onPower: () => void;
  onMenu: () => void;
  onLightSwitch: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onBookOpen: () => void;
  onClockOpen: () => void;
  onPaperOpen: () => void;
  isTVOn: boolean;
  isCinemaMode: boolean;
  volume: number;
}

interface ButtonHitZoneProps {
  label: string;
  left: string;
  top: string;
  size?: string;
  disabled?: boolean;
  isPressed?: boolean;
  onClick: () => void;
  onPress: (label: string) => void;
}

function ButtonHitZone({
  label,
  left,
  top,
  size = '4%',
  disabled = false,
  isPressed = false,
  onClick,
  onPress,
}: ButtonHitZoneProps) {
  const handleClick = () => {
    onPress(label);
    onClick();
  };

  return (
    <button
      aria-label={label}
      className={`absolute z-40 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-green-400 disabled:pointer-events-none disabled:cursor-not-allowed ${
        isPressed
          ? 'scale-90 bg-green-500/35 shadow-[0_0_24px_rgba(74,222,128,0.9)] ring-2 ring-green-500'
          : 'bg-transparent'
      }`}
      disabled={disabled}
      onClick={handleClick}
      style={{
        left,
        top,
        width: size,
        aspectRatio: '1 / 1',
      }}
      title={label}
    />
  );
}

export function TVFrame({
  isTurnedOn,
  isPowerIntro,
  isStatic,
  children,
  onPower,
  onMenu,
  onLightSwitch,
  onChannelUp,
  onChannelDown,
  onVolumeUp,
  onVolumeDown,
  onBookOpen,
  onClockOpen,
  onPaperOpen,
  isCinemaMode,
  isTVOn,
}: TVFrameProps) {
  const [pressedButton, setPressedButton] = useState('');
  const [clockTime, setClockTime] = useState(INITIAL_CLOCK_TIME);
  const pressTimeoutRef = useRef<number | null>(null);
  const hourHandAngle = (clockTime.getHours() % 12) * 30 + clockTime.getMinutes() * 0.5;
  const minuteHandAngle = clockTime.getMinutes() * 6 + clockTime.getSeconds() * 0.1;
  const secondHandAngle = clockTime.getSeconds() * 6;

  useEffect(() => {
    setClockTime(new Date());

    const intervalId = window.setInterval(() => {
      setClockTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const showButtonPress = (label: string) => {
    setPressedButton(label);

    if (pressTimeoutRef.current) {
      window.clearTimeout(pressTimeoutRef.current);
    }

    pressTimeoutRef.current = window.setTimeout(() => {
      setPressedButton('');
      pressTimeoutRef.current = null;
    }, 220);
  };

  return (
    <div className="relative aspect-[1672/941] w-screen max-w-[calc(100vh*1672/941)]">
      <div
        className="relative h-full w-full overflow-hidden bg-cover bg-center shadow-2xl"
        style={{
          aspectRatio: '1672 / 941',
          backgroundImage: `url("${isTurnedOn ? TV_ON_IMAGE : TV_OFF_IMAGE}")`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-black"
          style={{ opacity: isCinemaMode ? CINEMA_MODE_DARKNESS : 0 }}
        />
        <div
          className="absolute z-20 overflow-hidden bg-black"
          style={{
            left: '35.35%',
            top: '22.2%',
            width: '28.3%',
            height: '32.5%',
          }}
        >
          {isTurnedOn && (
            <>
              <div className="relative h-full w-full">{children}</div>
              {isPowerIntro && (
                <div
                  aria-hidden="true"
                  className="tv-power-intro pointer-events-none absolute inset-0 z-[80] bg-black"
                >
                  <img
                    alt=""
                    className="tv-power-intro-logo absolute inset-0 h-full w-full object-cover"
                    src={TV_LOADING_GIF}
                  />
                  <div className="tv-power-intro-lines" />
                  <div className="tv-power-intro-noise" />
                </div>
              )}
              <StaticOverlay isActive={isStatic} intensity={0.4} />
            </>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 2px
              )`,
            }}
          />
        </div>

        <ButtonHitZone label="Power (Space)" left="37.4%" top="61.1%" isPressed={pressedButton === 'Power (Space)'} onClick={onPower} onPress={showButtonPress} />
        <ButtonHitZone label="Menu" left="41.1%" top="61.1%" disabled={!isTVOn} isPressed={pressedButton === 'Menu'} onClick={onMenu} onPress={showButtonPress} />
        <ButtonHitZone label="Channel Down (Arrow Up)" left="54.9%" top="61.1%" disabled={!isTVOn} isPressed={pressedButton === 'Channel Down (Arrow Up)'} onClick={onChannelDown} onPress={showButtonPress} />
        <ButtonHitZone label="Channel Up (Arrow Down)" left="58%" top="61.1%" disabled={!isTVOn} isPressed={pressedButton === 'Channel Up (Arrow Down)'} onClick={onChannelUp} onPress={showButtonPress} />
        <ButtonHitZone label="Volume Down (Arrow Left)" left="44.2%" top="61.1%" disabled={!isTVOn} isPressed={pressedButton === 'Volume Down (Arrow Left)'} onClick={onVolumeDown} onPress={showButtonPress} />
        <ButtonHitZone label="Volume Up (Arrow Right)" left="47.1%" top="61.1%" disabled={!isTVOn} isPressed={pressedButton === 'Volume Up (Arrow Right)'} onClick={onVolumeUp} onPress={showButtonPress} />
        <button
          aria-label="Open paper"
          className="absolute z-[8] outline-none transition duration-200 hover:scale-105 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-200"
          onClick={onPaperOpen}
          style={{
            left: '35.2%',
            top: '79.8%',
            width: '5.8%',
            transform: 'rotate(-10deg)',
          }}
          title="Open paper"
          type="button"
        >
          <img
            alt=""
            className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.38)]"
            src={PAPER_IMAGE}
          />
        </button>
        <button
          aria-label="Open book"
          className="absolute z-[9] outline-none transition duration-200 hover:scale-105 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-200"
          onClick={onBookOpen}
          style={{
            left: '43%',
            top: '78.5%',
            width: '10.5%',
            transform: 'rotate(-8deg)',
          }}
          title="Open book"
          type="button"
        >
          <img
            alt=""
            className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)]"
            src={BOOK_IMAGE}
          />
        </button>
        <button
          aria-label="Open clock"
          className="absolute z-[9] rounded-full outline-none transition duration-200 hover:scale-105 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-200"
          onClick={onClockOpen}
          style={{
            left: '53.5%',
            top: '70.5%',
            width: '7.8%',
            aspectRatio: '1 / 1',
          }}
          title="Open clock"
          type="button"
        >
          <span className="table-clock-face">
            <img
              alt=""
              className="h-full w-full rounded-full object-cover drop-shadow-[0_10px_12px_rgba(0,0,0,0.5)]"
              src={CLOCK_IMAGE}
            />
            <span
              aria-hidden="true"
              className="table-clock-hand table-clock-hand-hour"
              style={{ transform: `translateX(-50%) rotate(${hourHandAngle}deg)` }}
            />
            <span
              aria-hidden="true"
              className="table-clock-hand table-clock-hand-minute"
              style={{ transform: `translateX(-50%) rotate(${minuteHandAngle}deg)` }}
            />
            <span
              aria-hidden="true"
              className="table-clock-hand table-clock-hand-second"
              style={{ transform: `translateX(-50%) rotate(${secondHandAngle}deg)` }}
            />
            <span aria-hidden="true" className="table-clock-hand-pin" />
          </span>
        </button>
        <button
          aria-label="Cinema room light"
          className={`absolute z-40 bg-transparent outline-none transition duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#00ff00] ${
            isCinemaMode ? 'brightness-75' : 'brightness-100'
          }`}
          onClick={onLightSwitch}
          style={{
            left: '74%',
            top: '35%',
            width: '3.2%',
            aspectRatio: '530 / 780',
          }}
          title="Cinema room light"
        >
          <img
            alt=""
            className="h-full w-full object-contain"
            src={LIGHT_SWITCH_IMAGE}
            style={{
              transform: isCinemaMode ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
        <div
          aria-label={isTurnedOn ? 'TV is on' : 'TV is off'}
          className={`pointer-events-none absolute z-30 rounded-full border border-black/75 transition-colors duration-300 ${
            isTurnedOn ? 'shadow-[0_0_7px_rgba(0,255,0,0.85)]' : 'shadow-[0_0_6px_rgba(255,0,0,0.8)]'
          }`}
          style={{
            ...POWER_LIGHT_STYLE,
            aspectRatio: '1 / 1',
            backgroundColor: isTurnedOn ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)',
          }}
        />
      </div>

      <div
        className={`pointer-events-none absolute -inset-8 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 ${
          isTurnedOn ? 'opacity-30' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
        }}
      />
    </div>
  );
}
