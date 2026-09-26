const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) => (props) => (
  <svg {...base} {...props} aria-hidden="true">
    {paths}
  </svg>
)

export const IconClock = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const IconDiamond = make(<><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M12 21 8 9l4-6 4 6-4 12" /></>)
export const IconPeople = make(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c3.2-.8 6.5 1.2 6.5 4.8" /></>)
export const IconCamera = make(<><path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="4" /></>)
export const IconHome = make(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></>)
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>)
export const IconPlus = make(<path d="M12 5v14M5 12h14" />)
export const IconHeart = make(<path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z" />)
export const IconUser = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>)
export const IconBack = make(<path d="m15 5-7 7 7 7" />)
export const IconChevron = make(<path d="m9 5 7 7-7 7" />)
export const IconFlash = make(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />)
export const IconCheck = make(<path d="m5 12 5 5 9-10" />)
export const IconMic = make(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>)
export const IconChat = make(<><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>)
export const IconKeyboard = make(<><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" /></>)
export const IconTag = make(<><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></>)
export const IconDoc = make(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>)
export const IconCopy = make(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>)
export const IconShare = make(<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>)
export const IconSave = make(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></>)
export const IconSparkle = make(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 7c.5 3 2 4.5 5 5-3 .5-4.5 2-5 5-.5-3-2-4.5-5-5 3-.5 4.5-2 5-5z" /></>)
export const IconTrash = make(<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>)
export const IconEdit = make(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>)
export const IconStop = make(<rect x="6" y="6" width="12" height="12" rx="2" />)
export const IconBulb = make(<><path d="M9 17h6M10 20.5h4" /><path d="M8 14a6 6 0 1 1 8 0c-.8.7-1 1.5-1 2.5V17H9v-.5c0-1-.2-1.8-1-2.5z" /><path d="M12 1.5V3M4.2 4.7l1 1M19.8 4.7l-1 1M1.5 11H3M21 11h1.5" /></>)
export const IconDiamondSparkle = make(<><path d="M5 7h11l3.5 5L10.5 22 1.5 12z" /><path d="M1.5 12h18M10.5 22 7 12l3.5-5 3.5 5-3.5 10" /><path d="M20 1.5v4M18 3.5h4" /></>)

export const IconHomeFilled = (props) => (
  <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 3.2 2.5 11a1 1 0 0 0 1.3 1.5l.7-.6V20a1 1 0 0 0 1 1h4.5v-6h4v6H18.5a1 1 0 0 0 1-1v-8.1l.7.6A1 1 0 0 0 21.5 11z" fill="currentColor" />
  </svg>
)

export const IconPeopleFilled = (props) => (
  <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <g fill="currentColor">
      <circle cx="12" cy="6.5" r="3.3" />
      <circle cx="5" cy="8.5" r="2.5" />
      <circle cx="19" cy="8.5" r="2.5" />
      <path d="M5.5 19c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5z" />
      <path d="M4.3 18H.8c0-3 1.8-5 4.2-5 .8 0 1.5.2 2.1.5A8 8 0 0 0 4.3 18zM19.7 18h3.5c0-3-1.8-5-4.2-5-.8 0-1.5.2-2.1.5a8 8 0 0 1 2.8 4.5z" />
    </g>
  </svg>
)
export const IconGallery = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="m3.5 18 5.5-5.5 4 4 2.5-2.5 5 5" /></>)
