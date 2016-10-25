
# The use of CSS classes

## Timeline options
`(no class)` – default

`.flow-slim` – slim timeline

`.flow-full` – timeline above the buttons (YouTube style)

`.flow-fat` – tall timeline (Wistia style)


## Modifiers
`.flow-edgy` – no border radius in any element


## Iconsets (coming soon)
`(no class)` – solid white

`.flow-outlined` – outline only

`.flow-edgy` – solid, no rounding

`.flow-outlined.flow-edgy` – outlined, no rounding



## Stripping out elements
`.flow-fullscreen { display: none }`

`.flow-volume { display: none }`

etc...


## Brand coloring
`.flow-controls { background-color: #373484 }` – controlbar background color

`.flow-color { background-color: #373484, fill: #ec6c4c }` – progress bars, play button & active menu items

No stronger selector or `!important` is needed.

## Skins

**functional** = default settings
**playful** = `.flow-fat`, 2 brand colors, play button background
**minimal** = `.flow-minimal`

The minimal mode is a highly stripped mode when *not* in fullscreen mode. The timeline is not even clickable. In fullscreen all the configured buttons are visible and timeline is usable. Uses outlined icons.

Playful skin uses Flowplayer colors by default:

- `#016682` for controlbar
- `#ec6c4c` as "flow-color"




## Effects

`-grayscale` – apply "grayscale" effect for the video
`-sepia` – apply "sepia" effect for the video
`-blur` – apply "blur" effect for the video


## Internal use
`.flow-ui-shown` – controls are always shown when mouseovered, paused

`.no-flex` – no flexbox support

`.is-rtl` – RTL support

`.flow-play.flow-visible` – while master play button is showing for 300ms


