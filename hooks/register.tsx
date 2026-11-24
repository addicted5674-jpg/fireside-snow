import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Context window fill, 0 to 100. Snow piles higher as it rises.
const fill = atom({ plugin: 'fireside-snow', key: 'fill' } as const, 0)

const SCENE = 'fireside-snow'

const { theme, problems } = makeColors({
  label: 'Fireside snow',
  only: 'dark',
  roles: { accent: '#e9a54f', danger: '#e0705f', success: '#9fbf7a', warning: '#e8b45a', pro: '#c49ad8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1c1512',
        'surface-1': '#241b17',
        'surface-2': '#2b211c',
        'surface-3': '#302520',
        'text-primary': '#f6ead8',
        'text-secondary': '#d9c9b2',
        'text-muted': '#b0a08a',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 14, tint: '#1c1512', opacity: 0.55 } },
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// The window: upper left, away from the words in the middle.
const WX = 120
const WY = 110
const WW = 420
const WH = 380

const MAX_FLAKES = 110
const FLAKES = (() => {
  const r = rng(5)
  return Array.from({ length: MAX_FLAKES }, () => ({
    x: WX + r() * WW,
    rad: 1.2 + r() * 2.4,
    fall: 9 + r() * 10,
    sway: (r() - 0.5) * 50,
    delay: -(r() * 20),
  }))
})()

function snowFor(percent: number) {
  const p = Math.max(0, Math.min(100, percent)) / 100
  return {
    flakes: Math.round(30 + p * (MAX_FLAKES - 30)),
    pile: Math.round(14 + p * (WH * 0.78)),
  }
}

function sceneSvg(percent: number) {
  const { flakes, pile } = snowFor(percent)
  const groundY = WY + WH - pile
  let styles = ''
  let snow = ''
  FLAKES.slice(0, flakes).forEach((f, i) => {
    const dist = WH + 20
    styles += `.s${i}{animation:fa${i} ${f.fall.toFixed(1)}s linear ${f.delay.toFixed(1)}s infinite}`
    styles += `@keyframes fa${i}{from{transform:translate(0,0)}50%{transform:translate(${f.sway.toFixed(0)}px,${(dist / 2).toFixed(0)}px)}to{transform:translate(0,${dist}px)}}`
    snow += `<circle class="s${i}" cx="${f.x.toFixed(0)}" cy="${WY - 10}" r="${f.rad.toFixed(1)}" fill="#f4f7ff" opacity="0.9"/>`
  })

  // A soft, lumpy drift that rises with the fill.
  const r = rng(9)
  let drift = `M${WX} ${WY + WH}L${WX} ${groundY + 6}`
  for (let x = WX; x <= WX + WW; x += 35) {
    drift += `Q${x + 17} ${(groundY - 6 - r() * 10).toFixed(0)} ${x + 35} ${(groundY + r() * 6).toFixed(0)}`
  }
  drift += `L${WX + WW} ${WY + WH}Z`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c17"/><stop offset="1" stop-color="#3a261d"/></linearGradient>
<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a33"/><stop offset="1" stop-color="#28385e"/></linearGradient>
<radialGradient id="fireglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff9a3c" stop-opacity="0.55"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
<radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd59a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
<linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1f"/><stop offset="0.6" stop-color="#ffb347"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>
<clipPath id="pane"><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}"/></clipPath>
</defs>
<style>
.glow{animation:gl 4s ease-in-out infinite alternate;opacity:0.9}
@keyframes gl{to{opacity:0.7}}
.fl{transform-box:fill-box;transform-origin:50% 100%}
.fl1{animation:sw 2.4s ease-in-out infinite alternate}
.fl2{animation:sw 3.1s ease-in-out -1s infinite alternate-reverse}
.fl3{animation:sw 2.8s ease-in-out -0.5s infinite alternate}
@keyframes sw{from{transform:scale(1,1) skewX(-4deg)}to{transform:scale(0.92,1.08) skewX(4deg)}}
.lamp{animation:gl 7s ease-in-out infinite alternate}
${styles}
</style>
<rect width="1600" height="900" fill="url(#wall)"/>
<path d="M0 760H1600V900H0Z" fill="#24170f"/>
<path d="M0 760H1600" stroke="#4a3022" stroke-width="6"/>
<!-- window -->
<rect x="${WX - 18}" y="${WY - 18}" width="${WW + 36}" height="${WH + 36}" rx="4" fill="#4b3226"/>
<g clip-path="url(#pane)">
<rect x="${WX}" y="${WY}" width="${WW}" height="${WH}" fill="url(#night)"/>
<circle cx="${WX + WW - 80}" cy="${WY + 70}" r="26" fill="#e9edf7" opacity="0.8"/>
<path d="M${WX} ${WY + WH - 40}L${WX + 90} ${WY + WH - 150}L${WX + 170} ${WY + WH - 40}Z" fill="#14203b"/>
<path d="M${WX + 230} ${WY + WH - 30}L${WX + 320} ${WY + WH - 170}L${WX + 410} ${WY + WH - 30}Z" fill="#14203b"/>
${snow}
<path d="${drift}" fill="#e6ecf6"/>
</g>
<path d="M${WX + WW / 2} ${WY}V${WY + WH}M${WX} ${WY + WH / 2}H${WX + WW}" stroke="#4b3226" stroke-width="12"/>
<rect x="${WX - 34}" y="${WY + WH + 14}" width="${WW + 68}" height="16" rx="3" fill="#5a3c2c"/>
<!-- lamp glow, upper right -->
<circle class="lamp" cx="1420" cy="250" r="260" fill="url(#lampglow)"/>
<path d="M1400 470V300" stroke="#3a281f" stroke-width="8"/>
<path d="M1360 300H1440L1420 240H1380Z" fill="#c9915a"/>
<!-- fireplace, lower right -->
<circle class="glow" cx="1260" cy="700" r="380" fill="url(#fireglow)"/>
<rect x="1060" y="470" width="400" height="290" fill="#5b3a2c"/>
<rect x="1040" y="450" width="440" height="32" rx="4" fill="#6e4733"/>
<path d="M1130 760V600Q1260 520 1390 600V760Z" fill="#120b08"/>
<g>
<path class="fl fl1" d="M1200 735C1185 690 1215 665 1210 625C1240 660 1250 700 1235 735Z" fill="url(#flame)"/>
<path class="fl fl2" d="M1240 735C1225 680 1260 650 1262 600C1295 650 1300 700 1285 735Z" fill="url(#flame)"/>
<path class="fl fl3" d="M1285 735C1275 700 1300 680 1300 645C1325 680 1330 710 1318 735Z" fill="url(#flame)"/>
</g>
<path d="M1170 745L1350 725M1180 728L1340 752" stroke="#3b2418" stroke-width="16" stroke-linecap="round"/>
<!-- rug -->
<ellipse cx="900" cy="840" rx="420" ry="40" fill="#5c2a24" opacity="0.8"/>
</svg>`
}

async function refresh($: Parameters<Parameters<Parameters<Register>[0]>[2]>[0]) {
  try {
    const { context } = await $.session.usage()
    const pct = Math.max(0, Math.min(100, context.percent ?? 0))
    await update($, fill, () => pct)
  } catch {
    // Usage unavailable; leave the snow as it is.
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.log(unpainted)
    }
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.log(set.reason)
    }
    await refresh($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await refresh($)
    return done
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const pct = await read($, fill)
    return (
      <Svg
        source={sceneSvg(pct)}
        alt={`A cozy living room with a fire in the hearth; snow is piled ${pct}% up the window`}
        isInteractive
      />
    )
  })
}
