"use client";

import BottomNav from "../components/BottomNav";
import "../../app/styles.css";
import { FaInstagram, FaTwitter } from "react-icons/fa";

export default function Info() {
  return (
    <div className="feed-container">
      <div className="bet-card">
        <h3>What are the odds?</h3>

        <div className="bet-details" style={{ marginTop: "1rem" }}>
          <div className="detail-item">
            <span>About</span>
            <span>Decentralized betting on Base.</span>
          </div>

          <div className="detail-item">
            <span>How to Use</span>
            <span>
              Create bets on Create page. <br />
              Bet Yes/No on Home. <br />
              If you start a bet, you have to close it. <br />
              If you bet, you have to wait for creator to close it.
            </span>
          </div>

          <div className="detail-item">
            <span>Rules</span>
            <span>
              No refunds. <br />
              Creators set outcomes. <br />
              10% fee on winnings.
            </span>
          </div>

          <div className="detail-item">
            <span>Support</span>
            <span>
              <a href="https://instagram.com/blockchainworldco" target={"_blank"}><FaInstagram /></a>  <br />
              <a href="https://x.com/harsheth_web3" target="_blank"><FaTwitter /></a> <br />
            </span>
          </div>
        </div>

        <BottomNav activePage="info" onFilterClick={() => {}} />
      </div>
    </div>
  );
}