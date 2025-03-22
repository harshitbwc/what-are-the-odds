"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import BottomNav from "./components/BottomNav";
import "./styles.css";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../lib/constants";
import { useEthersProvider } from "../lib/ethers";

export default function Home() {
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [amount, setAmount] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const provider = useEthersProvider();
  const lastFetchTime = useRef(0);

  const fetchBets = useCallback(async () => {
    if (!isConnected || !provider) return;
    setLoading(true);
    setError(null);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - 10000, 0);
      const createdEvents = await contract.queryFilter("BetCreated", fromBlock, "latest");
      const betList = await Promise.all(
        createdEvents.map(async (event) => {
          const betId = event.args.betId.toNumber();
          const bet = await contract.bets(betId);
          const userBetFor = account ? await contract.betsFor(betId, account) : ethers.BigNumber.from(0);
          const userBetAgainst = account ? await contract.betsAgainst(betId, account) : ethers.BigNumber.from(0);
          return formatBet(bet, betId, userBetFor, userBetAgainst);
        })
      );

      setBets(betList);
      applyFilter(betList, filter);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error("Error fetching bets:", error);
      setError("Failed to load bets.");
    }
    setLoading(false);
  }, [isConnected, provider, account, filter]);

  const formatBet = (bet, betId, userBetFor, userBetAgainst) => {
    const totalFor = ethers.utils.formatEther(bet.totalFor);
    const totalAgainst = ethers.utils.formatEther(bet.totalAgainst);
    const totalPool = ethers.utils.formatEther(bet.totalPool);
    const forOdds =
      totalFor >= 0 && totalAgainst >= 0
        ? (parseFloat(totalAgainst) / parseFloat(totalFor)).toFixed(2)
        : "N/A";
    const againstOdds =
      totalFor >= 0 && totalAgainst >= 0
        ? (parseFloat(totalFor) / parseFloat(totalAgainst)).toFixed(2)
        : "N/A";
    const forPayout =
      totalFor >= 0 ? (parseFloat(totalPool) / parseFloat(totalFor)).toFixed(2) : "N/A";
    const againstPayout =
      totalAgainst >= 0 ? (parseFloat(totalPool) / parseFloat(totalAgainst)).toFixed(2) : "N/A";

    return {
      id: betId,
      description: bet.description,
      creator: bet.creator,
      totalPool,
      isActive: bet.isActive,
      forWins: bet.forWins,
      forOdds: forOdds === "NaN" ? "1" : forOdds,
      againstOdds: againstOdds === "NaN" ? "1" : againstOdds,
      forPayout: forPayout === "NaN" ? "1" : forPayout,
      againstPayout: againstPayout === "NaN" ? "1" : againstPayout,
      userBetFor: ethers.utils.formatEther(userBetFor),
      userBetAgainst: ethers.utils.formatEther(userBetAgainst),
    };
  };

  const applyFilter = (betList, filterValue) => {
    const filtered = betList.filter((bet) => {
      if (filterValue === "open") return bet.isActive;
      if (filterValue === "closed") return !bet.isActive;
      return true;
    });
    setFilteredBets(filtered);
  };

  const placeBet = async (betId, forOutcome) => {
    if (!isConnected || !amount || parseFloat(amount) <= 0) {
      setError(!isConnected ? "Please connect your wallet." : "Please enter a valid bet amount.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "placeBet",
        args: [betId, forOutcome],
        value: ethers.utils.parseEther(amount),
      });
      alert("Bet placed successfully!");
      setAmount("");
      await fetchBets();
    } catch (error) {
      console.error("Error placing bet:", error);
      setError(error.reason || "Error placing bet.");
    }
    setLoading(false);
  };

  const handleScroll = useCallback(() => {
    if (window.scrollY === 0 && !loading) {
      fetchBets();
    }
  }, [fetchBets, loading]);

  useEffect(() => {
    if (isConnected && provider) {
      fetchBets();
      window.addEventListener("scroll", handleScroll);

      const syncInterval = setInterval(() => {
        if (Date.now() - lastFetchTime.current >= 10000) {
          fetchBets();
        }
      }, 10000);

      return () => {
        clearInterval(syncInterval);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [isConnected, provider, fetchBets, handleScroll]);

  const memoizedBets = useMemo(() => {
    return filteredBets.map((bet) => (
      <div key={bet.id} className="bet-card">
        <h2>{bet.description}</h2>
        <div className="bet-details">
          <div className="detail-item">
            <span>Total Pool</span>
            <span>{bet.totalPool} ETH</span>
          </div>
          <div className="odds-table">
            <div className="odds-header">
              <span>Yes</span>
              <span>No</span>
            </div>
            <div className="odds-values">
              <span>{bet.forOdds}</span>
              <span>{bet.againstOdds}</span>
            </div>
          </div>
          <div className="detail-item">
            <span>Creator</span>
            <span>{bet.creator.slice(0, 6)}...</span>
          </div>
          {!bet.isActive && (
            <div className="detail-item">
              <span>Outcome</span>
              <span>{bet.forWins ? "Yes Wins" : "No Wins"}</span>
            </div>
          )}
        </div>
        <span className={`status-dot ${bet.isActive ? "active" : "closed"}`}></span>
        {bet.isActive && (
          <div className="bet-actions">
            <input
              type="number"
              placeholder="Enter ETH amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="eth-input"
            />
            <div className="bet-buttons-wrapper">
              <span className="payout-multiplier">{bet.forPayout}x</span>
              <div className="bet-buttons">
                <button
                  className="action-btn for-btn"
                  onClick={() => placeBet(bet.id, true)}
                  disabled={loading}
                >
                  {loading ? <div className="loader-small"></div> : "Yes"}
                </button>
                <button
                  className="action-btn against-btn"
                  onClick={() => placeBet(bet.id, false)}
                  disabled={loading}
                >
                  {loading ? <div className="loader-small"></div> : "No"}
                </button>
              </div>
              <span className="payout-multiplier">{bet.againstPayout}x</span>
            </div>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    ));
  }, [filteredBets, loading, amount, placeBet]);

  return (
    <div className="feed-container">
      {loading && <div className="top-loader"></div>}
      {!isConnected ? (
        <div className="connect-screen">
          <ConnectButton />
        </div>
      ) : (
        <>
          <div className="bet-feed">
            {filteredBets.length === 0 ? (
              <div className="bet-card no-bets">
                <p>No bets available</p>
                {error && <p className="error">{error}</p>}
              </div>
            ) : (
              memoizedBets
            )}
          </div>
          <BottomNav
            activePage="home"
            onFilterClick={() => setShowFilterModal(!showFilterModal)}
          />
          {showFilterModal && (
            <div className="filter-modal">
              <button
                className="filter-option"
                onClick={() => {
                  setFilter("all");
                  setShowFilterModal(false);
                }}
              >
                All
              </button>
              <button
                className="filter-option"
                onClick={() => {
                  setFilter("open");
                  setShowFilterModal(false);
                }}
              >
                Open
              </button>
              <button
                className="filter-option"
                onClick={() => {
                  setFilter("closed");
                  setShowFilterModal(false);
                }}
              >
                Closed
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}