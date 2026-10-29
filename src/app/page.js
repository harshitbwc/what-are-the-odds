import Link from "next/link";
import {
  FaPlus,
  FaListUl,
  FaBolt,
  FaTrophy,
  FaWallet,
  FaMobileAlt,
  FaChartLine,
  FaInstagram,
  FaTwitter,
  FaGithub,
} from "react-icons/fa";
import InstallButton from "./components/InstallButton";
import "./landing.css";

const STEPS = [
  { icon: <FaPlus />, title: "Post a bet", text: "Type a dare or a prediction. That's the whole form." },
  { icon: <FaListUl />, title: "Scroll & pick", text: "Swipe through bets, one per screen. Tap Yes or No and put your stake on it." },
  { icon: <FaTrophy />, title: "Get paid", text: "The creator closes the bet and winners claim their payout. No chasing anyone." },
];

const FEATURES = [
  { icon: <FaPlus />, title: "Create in seconds", text: "Turn any \"bet you can't…\" into a bet with a plain-text description." },
  { icon: <FaBolt />, title: "Scroll like TikTok", text: "A live feed with one bet per screen. A new one every swipe." },
  { icon: <FaChartLine />, title: "Your dashboard", text: "Track the bets you made, the ones you joined, and what you've won." },
  { icon: <FaTrophy />, title: "One-tap payouts", text: "Winners claim straight from the app." },
  { icon: <FaWallet />, title: "Wallet sign-in", text: "No accounts, no passwords. Connect a wallet and go." },
  { icon: <FaMobileAlt />, title: "Install it", text: "Add it to your home screen and it opens like a native app." },
];

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <span className="lp-logo">What are the odds?</span>
        <Link href="/app" className="lp-btn lp-btn-sm">Launch app</Link>
      </header>

      <section className="lp-hero">
        <h1 className="lp-sr">What are the odds? Dare your friends. Settle it on-chain.</h1>
        <video
          className="lp-hero-media"
          src="/hero.mp4"
          poster="/hero.png"
          aria-label="What are the odds? Scroll through bets, tap Yes or No, and winners get paid automatically."
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </section>

      <section id="how" className="lp-section">
        <h2>Like TikTok, but for bets</h2>
        <p className="lp-lead">
          No learning curve. Open the app, scroll, and a new bet shows up every swipe.
        </p>
        <div className="lp-grid lp-grid-3">
          {STEPS.map((s, i) => (
            <div className="lp-card" key={s.title}>
              <div className="lp-step">{i + 1}</div>
              <div className="lp-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2>Everything you need, nothing you don&rsquo;t</h2>
        <div className="lp-grid lp-grid-3">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <div className="lp-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-why">
        <h2>Why I built it</h2>
        <p>
          We all say &ldquo;bet you can&rsquo;t&hellip;&rdquo; a dozen times a day. Most of those deals
          are verbal agreements, and verbal agreements lead to arguments. So I put the bet on&#8209;chain
          and let crypto handle the money. It&rsquo;s easy, it&rsquo;s fun, and nobody has to chase
          anyone.
        </p>
        <p className="lp-small">Built end to end, smart contract included, in one night.</p>
      </section>

      <section className="lp-section lp-install">
        <h2>Get the app</h2>
        <p className="lp-lead">Add it to your home screen and it opens like any other app.</p>
        <div className="lp-cta lp-center">
          <Link href="/app" className="lp-btn">Launch app</Link>
          <InstallButton />
        </div>
      </section>

      <footer className="lp-footer">
        <span>Built by Harshit Sharmaa</span>
        <span className="lp-social">
          <a href="https://github.com/harshitbwc/what-are-the-odds" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>
          <a href="https://x.com/harsheth_web3" target="_blank" rel="noreferrer" aria-label="X"><FaTwitter /></a>
          <a href="https://instagram.com/blockchainworldco" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
        </span>
      </footer>
    </div>
  );
}
