"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import BottomNav from "../components/BottomNav";
import "../../app/styles.css";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../lib/constants";
import { useEthersProvider } from "../../lib/ethers";

export default function Dashboard() {
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("created");
  const [selectedBet, setSelectedBet] = useState(null);
  const [amount, setAmount] = useState("");
  const [closingOutcome, setClosingOutcome] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const provider = useEthersProvider();
  const lastFetchTime = useRef(0);

  const fetchUserBets = useCallback(async (mode) => {
    if (!isConnected || !provider || !account) return;
    setLoading(true);
    setError(null);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      let betList = [];
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - 10000, 0);

      if (mode === "created") {
        const createdEvents = await contract.queryFilter("BetCreated", fromBlock, "latest");
        betList = await Promise.all(
          createdEvents
            .filter((event) => event.args.creator.toLowerCase() === account.toLowerCase())
            .map(async (event) => {
              const betId = event.args.betId.toNumber();
              const bet = await contract.bets(betId);
              const userBetFor = await contract.betsFor(betId, account);
              const userBetAgainst = await contract.betsAgainst(betId, account);
              return formatBet(bet, betId, userBetFor, userBetAgainst);
            })
        );
      } else if (mode === "participated") {
        const placedEvents = await contract.queryFilter("BetPlaced", fromBlock, "latest");
        const betIds = [
          ...new Set(
            placedEvents
              .filter((event) => event.args.bettor.toLowerCase() === account.toLowerCase())
              .map((event) => event.args.betId.toNumber())
          ),
        ];
        betList = await Promise.all(
          betIds.map(async (betId) => {
            const bet = await contract.bets(betId);
            const userBetFor = await contract.betsFor(betId, account);
            const userBetAgainst = await contract.betsAgainst(betId, account);
            return formatBet(bet, betId, userBetFor, userBetAgainst);
          })
        );
      }

      setUserBets(betList);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error(`Error fetching ${mode} bets:`, error);
      setError(`Failed to load ${mode === "created" ? "predictions" : "bets"}.`);
    }
    setLoading(false);
  }, [isConnected, provider, account]);

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
      await fetchUserBets(viewMode);
    } catch (error) {
      console.error("Error placing bet:", error);
      setError(error.reason || "Error placing bet.");
    }
    setLoading(false);
  };

  const closeBet = async (betId, forWins) => {
    setLoading(true);
    setError(null);
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "closeBet",
        args: [betId, forWins],
      });
      alert(`Bet closed with ${forWins ? "Yes" : "No"} as the winner!`);
      setClosingOutcome(null);
      await fetchUserBets(viewMode);
    } catch (error) {
      console.error("Error closing bet:", error);
      setError(error.reason || "Error closing bet.");
    }
    setLoading(false);
  };

  const claimAward = async (betId) => {
    setLoading(true);
    setError(null);
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimAward",
        args: [betId],
      });
      alert("Award claimed successfully! (10% fee deducted to treasury)");
      await fetchUserBets(viewMode);
    } catch (error) {
      console.error("Error claiming award:", error);
      setError(error.reason || "Error claiming award.");
    }
    setLoading(false);
  };

  const isEligibleToClaim = useCallback((bet) => {
    if (bet.isActive) return false;
    return (
      (bet.forWins && parseFloat(bet.userBetFor) > 0) ||
      (!bet.forWins && parseFloat(bet.userBetAgainst) > 0)
    );
  }, []);

  const handleScroll = useCallback(() => {
    if (window.scrollY === 0 && !loading) {
      fetchUserBets(viewMode);
    }
  }, [fetchUserBets, loading, viewMode]);

  useEffect(() => {
    if (isConnected && provider) {
      fetchUserBets(viewMode);
      window.addEventListener("scroll", handleScroll);

      const syncInterval = setInterval(() => {
        if (Date.now() - lastFetchTime.current >= 10000) {
          fetchUserBets(viewMode);
        }
      }, 10000);

      return () => {
        clearInterval(syncInterval);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [isConnected, provider, account, viewMode, fetchUserBets, handleScroll]);

  const memoizedBets = useMemo(() => {
    return userBets.map((bet) => (
      <div
        key={bet.id}
        className="bet-item"
        onClick={() => setSelectedBet(bet)}
        style={{ cursor: "pointer" }}
      >
        <span>{bet.description}</span>
        <span>{bet.totalPool} ETH</span>
        <span className={`status-dot ${bet.isActive ? "active" : "closed"}`}></span>
      </div>
    ));
  }, [userBets]);

  return (
    <div className="feed-container">
      {loading && <div className="top-loader"></div>}
      {!isConnected ? (
        <div className="connect-screen">
          <button className="action-btn connect-btn">Connect Wallet</button>
        </div>
      ) : (
        <div className="bet-card">
          <h2>Your Dashboard</h2>
          <div className="dashboard-header">
            <div className="bet-details">
              <div className="detail-item">
                <span>Wallet</span>
                <span>{account ? `${account.slice(0, 6)}...` : "N/A"}</span>
              </div>
              <div className="detail-item">
                <span>{viewMode === "created" ? "My Predictions" : "My Bets"}</span>
                <span>{userBets.length}</span>
              </div>
            </div>
            <div className="slider-container">
              <span className="slider-label">My Predictions</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={viewMode === "participated"}
                  onChange={(e) => setViewMode(e.target.checked ? "participated" : "created")}
                />
                <span className="slider"></span>
              </label>
              <span className="slider-label">My Bets</span>
            </div>
          </div>
          {userBets.length === 0 ? (
            <p className="no-bets">
              No {viewMode === "created" ? "predictions" : "bets"} found.
            </p>
          ) : (
            <div className="user-bets">{memoizedBets}</div>
          )}
          {error && !selectedBet && <p className="error">{error}</p>}
          {selectedBet && (
            <div className="modal-backdrop" onClick={() => setSelectedBet(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{selectedBet.description}</h3>
                <div className="bet-details">
                  <div className="detail-item">
                    <span>Total Pool</span>
                    <span>{selectedBet.totalPool} ETH</span>
                  </div>
                  <div className="odds-table">
                    <div className="odds-header">
                      <span>Yes</span>
                      <span>No</span>
                    </div>
                    <div className="odds-values">
                      <span>{selectedBet.forOdds}</span>
                      <span>{selectedBet.againstOdds}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>Creator</span>
                    <span>{selectedBet.creator.slice(0, 6)}...</span>
                  </div>
                  {!selectedBet.isActive && (
                    <div className="detail-item">
                      <span>Outcome</span>
                      <span>{selectedBet.forWins ? "Yes Wins" : "No Wins"}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span>Your Bet (Yes)</span>
                    <span>{selectedBet.userBetFor} ETH</span>
                  </div>
                  <div className="detail-item">
                    <span>Your Bet (No)</span>
                    <span>{selectedBet.userBetAgainst} ETH</span>
                  </div>
                </div>
                <span className={`status-dot ${selectedBet.isActive ? "active" : "closed"}`}></span>
                {selectedBet.isActive && viewMode === "created" && (
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
                      <span className="payout-multiplier">{selectedBet.forPayout}x</span>
                      <div className="bet-buttons">
                        <button
                          className="action-btn for-btn"
                          onClick={() => placeBet(selectedBet.id, true)}
                          disabled={loading}
                        >
                          {loading ? <div className="loader-small"></div> : "Yes"}
                        </button>
                        <button
                          className="action-btn against-btn"
                          onClick={() => placeBet(selectedBet.id, false)}
                          disabled={loading}
                        >
                          {loading ? <div className="loader-small"></div> : "No"}
                        </button>
                      </div>
                      <span className="payout-multiplier">{selectedBet.againstPayout}x</span>
                    </div>
                    <div className="close-options">
                      <p>Close Bet:</p>
                      <div className="bet-buttons">
                        <button
                          className="action-btn for-btn"
                          onClick={() => setClosingOutcome(true)}
                          disabled={loading || closingOutcome !== null}
                        >
                          {loading ? <div className="loader-small"></div> : "Yes Wins"}
                        </button>
                        <button
                          className="action-btn against-btn"
                          onClick={() => setClosingOutcome(false)}
                          disabled={loading || closingOutcome !== null}
                        >
                          {loading ? <div className="loader-small"></div> : "No Wins"}
                        </button>
                      </div>
                      {closingOutcome !== null && (
                        <button
                          className="action-btn close-btn"
                          onClick={() => closeBet(selectedBet.id, closingOutcome)}
                          disabled={loading}
                        >
                          {loading ? <div className="loader-small"></div> : "Confirm Close"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!selectedBet.isActive && (
                  <div className="bet-actions">
                    <button
                      className="action-btn claim-btn"
                      onClick={() => claimAward(selectedBet.id)}
                      disabled={loading || !isEligibleToClaim(selectedBet)}
                    >
                      {loading ? <div className="loader-small"></div> : "Claim Award"}
                    </button>
                    <p className="fee-note">
                      Note: 10% of winnings will be deducted as a fee to the treasury.
                    </p>
                  </div>
                )}
                {error && <p className="error">{error}</p>}
              </div>
            </div>
          )}
          <BottomNav
            activePage="dashboard"
            onFilterClick={() => setShowFilterModal(!showFilterModal)}
          />
          {showFilterModal && (
            <div className="filter-modal">
              <button
                className="filter-option"
                onClick={() => {
                  setViewMode("created");
                  setShowFilterModal(false);
                }}
              >
                My Predictions
              </button>
              <button
                className="filter-option"
                onClick={() => {
                  setViewMode("participated");
                  setShowFilterModal(false);
                }}
              >
                My Bets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}