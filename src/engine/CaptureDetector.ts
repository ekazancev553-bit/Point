import { Point, Player, CapturedRegion } from '../types';
import { Board } from './Board';

export class CaptureDetector {
  detectCaptures(board: Board, _lastMove: Point, player: Player): CapturedRegion[] {
    const currentRegions = this.findEnclosedRegions(board, player);
    return currentRegions;
  }

  private findEnclosedRegions(board: Board, wallPlayer: Player): CapturedRegion[] {
    const { width, height } = board;
    const visited: boolean[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    );

    // Mark wall player's non-captured dots as walls
    const isWall = (x: number, y: number): boolean => {
      const dot = board.getDot({ x, y });
      return dot !== null && dot.owner === wallPlayer && !dot.captured;
    };

    // Mark all wall cells as visited
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isWall(x, y)) {
          visited[y][x] = true;
        }
      }
    }

    const regions: CapturedRegion[] = [];

    // Flood fill from each unvisited cell using 4-directional connectivity
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (visited[y][x]) continue;

        const component: Point[] = [];
        const opponentDots: Point[] = [];
        let touchesEdge = false;
        const queue: Point[] = [{ x, y }];
        visited[y][x] = true;

        while (queue.length > 0) {
          const current = queue.pop()!;
          component.push(current);

          // Check if this cell has an opponent dot (non-captured)
          const dot = board.getDot(current);
          if (dot && dot.owner !== wallPlayer && !dot.captured) {
            opponentDots.push(current);
          }

          // Check if touches edge
          if (current.x === 0 || current.x === width - 1 ||
              current.y === 0 || current.y === height - 1) {
            touchesEdge = true;
          }

          // 4-directional neighbors for flood fill
          const neighbors: Point[] = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
          ];

          for (const neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.x < width &&
                neighbor.y >= 0 && neighbor.y < height &&
                !visited[neighbor.y][neighbor.x]) {
              visited[neighbor.y][neighbor.x] = true;
              queue.push(neighbor);
            }
          }
        }

        // Enclosed region: doesn't touch edge and contains opponent dots
        if (!touchesEdge && opponentDots.length > 0) {
          // Find the boundary: wall player dots adjacent to this region
          const boundary = this.findBoundary(board, component, wallPlayer);
          regions.push({
            boundary,
            interior: component,
            capturedDots: opponentDots,
            owner: wallPlayer,
          });
        }
      }
    }

    return regions;
  }

  private findBoundary(board: Board, interior: Point[], wallPlayer: Player): Point[] {
    const boundarySet = new Set<string>();
    const boundary: Point[] = [];

    for (const point of interior) {
      // Check all 8 neighbors for wall player dots
      const neighbors = board.getAdjacentPoints(point);
      for (const neighbor of neighbors) {
        const dot = board.getDot(neighbor);
        if (dot && dot.owner === wallPlayer && !dot.captured) {
          const key = `${neighbor.x},${neighbor.y}`;
          if (!boundarySet.has(key)) {
            boundarySet.add(key);
            boundary.push(neighbor);
          }
        }
      }
    }

    return boundary;
  }
}
