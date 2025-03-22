import Link from "next/link";
import { FaHome, FaPlus, FaInfoCircle, FaUser, FaFilter } from "react-icons/fa";
import "../../app/styles.css";

export default function BottomNav({ activePage, onFilterClick }) {
  return (
    <div className="bottom-nav">
      <Link href="/" prefetch>
        <button className={`nav-btn home-btn ${activePage === "home" ? "active" : ""}`}>
          <FaHome />
        </button>
      </Link>
      <button
        className="nav-btn filter-btn"
        onClick={onFilterClick}
      >
        <FaFilter />
      </button>
      <Link href="/create" prefetch>
        <button className={`nav-btn create-btn ${activePage === "create" ? "active" : ""}`}>
          <FaPlus />
        </button>
      </Link>
      <Link href="/info" prefetch>
        <button className={`nav-btn info-btn ${activePage === "info" ? "active" : ""}`}>
          <FaInfoCircle />
        </button>
      </Link>
      <Link href="/dashboard" prefetch>
        <button className={`nav-btn dashboard-btn ${activePage === "dashboard" ? "active" : ""}`}>
          <FaUser />
        </button>
      </Link>
    </div>
  );
}