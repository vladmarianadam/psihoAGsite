/**
 * Fundalul „lumină care respiră”: un strat fix în spatele întregului site, cu patru lumini din
 * paleta temei care plutesc lent. Stilurile (și varianta pentru mobil) sunt în index.css, `.aurora`.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}
