import { Player } from '../types';
import { Board } from '../engine/Board';

const CAPTURE_WEIGHT = 10;
const CONNECTIVITY_WEIGHT = 2;
const CENTER_WEIGHT = 1;

// 8-directional offsets for connectivity checks
const DIRECTIONS: Array<{ dx: number; dy: number }> = [
  { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 0 },                      { dx: 1, dy: 0 },
  { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 },
];

export class Evaluator {
  /**
   * Evaluate a board position from the perspective of the given player.
   * Positive values indicate an advantage for the player.
   * Negative values indicate an advantage for the opponent.
   */
  evaluate(board: Board, player: Player): number {
    const opponent = player === 'red' ? 'blue' : 'red';

    const captureScore = this.evaluateCaptures(board, player, opponent);
    const connectivityScore = this.evaluateConnectivity(board, player, opponent);
    const centerScore = this.evaluateCenterProximity(board, player, opponent);

    return captureScore + connectivityScore + centerScore;
  }

  /**
   * Score differential based on captured dots.
   * Each captured opponent dot is worth +CAPTURE_WEIGHT.
   * Each captured own dot is worth -CAPTURE_WEIGHT.
   */
  private evaluateCaptures(board: Board, player: Player, opponent: Player): number {
    const allDots = board.getAllDots();

    let playerCaptured = 0;
    let opponentCaptured = 0;

    for (const dot of allDots) {
      if (dot.captured) {
        if (dot.owner === opponent) {
          playerCaptured++;
        } else if (dot.owner === player) {
          opponentCaptured++;
        }
      }
    }

    return (playerCaptured - opponentCaptured) * CAPTURE_WEIGHT;
  }

  /**
   * Evaluate chain connectivity: count connections between same-player dots
   * using 8-directional adjacency.
   */
  private evaluateConnectivity(board: Board, player: Player, opponent: Player): number {
    const playerConnections = this.countConnections(board, player);
    const opponentConnections = this.countConnections(board, opponent);

    return (playerConnections - opponentConnections) * CONNECTIVITY_WEIGHT;
  }

  /**
   * Count the number of 8-directional connections between dots of the same player.
   * Each connection is counted once (not double-counted).
   */
  private countConnections(board: Board, player: Player): number {
    const dots = board.getDotsForPlayer(player);
    let connections = 0;

    const dotSet = new Set<string>(
      dots.map(d => `${d.point.x},${d.point.y}`)
    );

    for (const dot of dots) {
      if (dot.captured) continue;

      // Only check "forward" directions to avoid double-counting
      for (const dir of DIRECTIONS) {
        const nx = dot.point.x + dir.dx;
        const ny = dot.point.y + dir.dy;

        // Only count when neighbor key is "greater" to avoid double-counting
        const neighborKey = `${nx},${ny}`;
        const currentKey = `${dot.point.x},${dot.point.y}`;
        if (neighborKey > currentKey && dotSet.has(neighborKey)) {
          const neighborDot = board.getDot({ x: nx, y: ny });
          if (neighborDot && !neighborDot.captured) {
            connections++;
          }
        }
      }
    }

    return connections;
  }

  /**
   * Evaluate center proximity: dots closer to the board center score higher.
   */
  private evaluateCenterProximity(board: Board, player: Player, opponent: Player): number {
    const centerX = (board.width - 1) / 2;
    const centerY = (board.height - 1) / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    const playerScore = this.sumCenterProximity(board, player, centerX, centerY, maxDist);
    const opponentScore = this.sumCenterProximity(board, opponent, centerX, centerY, maxDist);

    return (playerScore - opponentScore) * CENTER_WEIGHT;
  }

  /**
   * Sum the center proximity scores for all non-captured dots of a player.
   * A dot at the center gets a score of 1.0; a dot at the corner gets close to 0.
   */
  private sumCenterProximity(
    board: Board,
    player: Player,
    centerX: number,
    centerY: number,
    maxDist: number
  ): number {
    const dots = board.getDotsForPlayer(player);
    let score = 0;

    for (const dot of dots) {
      if (dot.captured) continue;

      const dx = dot.point.x - centerX;
      const dy = dot.point.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      score += 1 - dist / maxDist;
    }

    return score;
  }
}
