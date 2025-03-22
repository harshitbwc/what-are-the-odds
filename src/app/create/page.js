"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import BottomNav from "../components/BottomNav";
import "../../app/styles.css";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../lib/constants";

export default function Create() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const createBet = async () => {
    if (!isConnected) {
      setError("Please connect your wallet.");
      return;
    }
    if (!description) {
      setError("Please enter a bet description.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createBet",
        args: [description],
      });
      alert("Bet created successfully!");
      setDescription("");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating bet:", error);
      setError(error.reason || "Error creating bet.");
    }
    setLoading(false);
  };

  return (
    <div className="feed-container">
      {loading && <div className="top-loader"></div>}
      {!isConnected ? (
        <div className="connect-screen">
          <button className="action-btn connect-btn">Connect Wallet</button>
        </div>
      ) : (
        <div className="bet-card">
          <h2>Create a Bet</h2>
          <div className="bet-actions">
            <input
              type="text"
              placeholder="Enter bet description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="eth-input"
            />
            <button
              className="action-btn create-btn"
              onClick={createBet}
              disabled={loading}
            >
              {loading ? <div className="loader-small"></div> : "Create Bet"}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <BottomNav activePage="create" onFilterClick={() => {}} />
        </div>
      )}
    </div>
  );
}