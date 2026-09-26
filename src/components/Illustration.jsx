// Petite scène « ourson + lampe + livres » dessinée en SVG, dans la palette de l'appli.
export default function Illustration() {
  return (
    <div className="illustration">
      <svg viewBox="0 0 320 170" role="img" aria-label="Un ourson en peluche, une lampe et des livres">
        <ellipse cx="160" cy="160" rx="150" ry="10" fill="#EADBCD" />
        {/* feuillage */}
        <g fill="#8FAE8B" opacity=".85">
          <ellipse cx="292" cy="95" rx="9" ry="26" transform="rotate(20 292 95)" />
          <ellipse cx="278" cy="100" rx="8" ry="24" transform="rotate(-15 278 100)" />
          <ellipse cx="302" cy="115" rx="7" ry="20" transform="rotate(45 302 115)" />
          <ellipse cx="20" cy="105" rx="8" ry="22" transform="rotate(-25 20 105)" />
          <ellipse cx="34" cy="98" rx="8" ry="24" transform="rotate(10 34 98)" />
        </g>
        {/* livres */}
        <rect x="18" y="128" width="70" height="12" rx="2" fill="#A8CBE0" />
        <rect x="24" y="116" width="62" height="12" rx="2" fill="#D9BFAF" />
        <rect x="14" y="140" width="80" height="14" rx="2" fill="#F5EBDD" stroke="#E2D2C1" />
        {/* lampe */}
        <path d="M236 40h48l14 42h-76z" fill="#FFF8EE" stroke="#E6D6C4" />
        <rect x="256" y="82" width="6" height="30" fill="#7A5A48" />
        <ellipse cx="259" cy="132" rx="20" ry="22" fill="#6B584F" />
        <ellipse cx="253" cy="124" rx="5" ry="9" fill="#8C776D" />
        {/* ourson */}
        <g>
          <circle cx="140" cy="54" r="13" fill="#C99A72" />
          <circle cx="196" cy="54" r="13" fill="#C99A72" />
          <circle cx="140" cy="54" r="7" fill="#E8C9A8" />
          <circle cx="196" cy="54" r="7" fill="#E8C9A8" />
          <ellipse cx="168" cy="128" rx="38" ry="30" fill="#C99A72" />
          <ellipse cx="168" cy="132" rx="22" ry="20" fill="#E3C19E" />
          <ellipse cx="128" cy="146" rx="16" ry="11" fill="#C99A72" />
          <ellipse cx="208" cy="146" rx="16" ry="11" fill="#C99A72" />
          <ellipse cx="124" cy="148" rx="8" ry="7" fill="#E3C19E" />
          <ellipse cx="212" cy="148" rx="8" ry="7" fill="#E3C19E" />
          <ellipse cx="136" cy="116" rx="11" ry="17" fill="#C99A72" transform="rotate(25 136 116)" />
          <ellipse cx="200" cy="116" rx="11" ry="17" fill="#C99A72" transform="rotate(-25 200 116)" />
          <circle cx="168" cy="74" r="32" fill="#CFA27A" />
          <ellipse cx="168" cy="86" rx="14" ry="11" fill="#EBD0B0" />
          <ellipse cx="168" cy="81" rx="5" ry="3.5" fill="#4A3027" />
          <path d="M163 90q5 4 10 0" stroke="#4A3027" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="156" cy="68" r="3.2" fill="#3B2720" />
          <circle cx="180" cy="68" r="3.2" fill="#3B2720" />
        </g>
      </svg>
      <p className="etiquette-manuscrite">
        Des objets d’aujourd’hui,
        <br />
        une seconde vie demain ♡
      </p>
    </div>
  )
}
