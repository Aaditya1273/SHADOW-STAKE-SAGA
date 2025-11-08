import { createFileRoute } from '@tanstack/react-router';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  address: string;
  score: number;
  timestamp: number;
  round: number;
}

const GAME_PACKAGE_ID = '0x3d16067dbdb2afe434f636d860fd02400ef57421def3b89ee424f9c3b354ec45';

export const LeaderboardComponent = () => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load leaderboard from OneChain blockchain events
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        console.log("📊 Fetching leaderboard from OneChain...");
        
        // Query all GameCompleted events
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${GAME_PACKAGE_ID}::shadow_stake_saga_game::GameCompleted`
          },
          limit: 50,
          order: 'descending'
        });

        console.log("📊 Found events:", events);

        // Group by player and keep highest score
        const playerScores = new Map<string, LeaderboardEntry>();
        
        events.data.forEach((event: any) => {
          const player = event.parsedJson?.player;
          const score = Number(event.parsedJson?.score || 0);
          const round = Number(event.parsedJson?.level || 0);
          // timestamp from event is in seconds, convert to milliseconds
          // or use event.timestampMs which is already in milliseconds
          const timestamp = event.timestampMs ? Number(event.timestampMs) : Number(event.parsedJson?.timestamp || 0) * 1000;

          if (player) {
            const existing = playerScores.get(player);
            if (!existing || score > existing.score) {
              playerScores.set(player, {
                address: player,
                score,
                round,
                timestamp
              });
            }
          }
        });

        // Convert to array and sort by score
        const sorted = Array.from(playerScores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 100); // Top 100

        setLeaderboard(sorted);

        // Find user's rank
        if (account) {
          const rank = sorted.findIndex(entry => entry.address === account.address) + 1;
          setUserRank(rank);
        }

        console.log("📊 Leaderboard loaded:", sorted.length, "players");
      } catch (error) {
        console.error("❌ Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [account, suiClient]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">🏆 LEADERBOARD 🏆</h1>
          <p className="text-xl text-gray-300">Top Players - Shadow Stake Saga</p>
          {account && userRank > 0 && (
            <div className="mt-4 text-2xl text-green-400">
              Your Rank: #{userRank}
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-black/50 rounded-lg border-2 border-yellow-500 overflow-hidden">
          <table className="w-full">
            <thead className="bg-yellow-500/20">
              <tr>
                <th className="p-4 text-left text-yellow-400">Rank</th>
                <th className="p-4 text-left text-yellow-400">Player</th>
                <th className="p-4 text-right text-yellow-400">Score</th>
                <th className="p-4 text-right text-yellow-400">Round</th>
                <th className="p-4 text-right text-yellow-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                      Loading leaderboard from OneChain...
                    </div>
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No scores yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => (
                  <tr
                    key={`${entry.address}-${entry.timestamp}`}
                    className={`border-t border-gray-700 hover:bg-yellow-500/10 ${
                      account && entry.address === account.address ? 'bg-green-500/20' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-3xl">🥇</span>}
                        {index === 1 && <span className="text-3xl">🥈</span>}
                        {index === 2 && <span className="text-3xl">🥉</span>}
                        <span className="text-xl font-bold text-white">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-sm text-gray-300">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-2xl font-bold text-yellow-300">
                        {entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      Round {entry.round}
                    </td>
                    <td className="p-4 text-right text-gray-400 text-sm">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-gray-400">
          <p>🔗 Scores are stored on OneChain blockchain</p>
          <p className="text-sm mt-2">Play more to climb the leaderboard and earn $SSS tokens!</p>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardComponent,
});
