import { Move, Point, Player } from '../types';

export interface MoveRecord {
  move: Move;
  capturedDotsBefore: { point: Point; owner: Player }[];
}

export class History {
  private undoStack: MoveRecord[] = [];
  private redoStack: MoveRecord[] = [];

  push(record: MoveRecord): void {
    this.undoStack.push(record);
    this.redoStack = [];
  }

  undo(): MoveRecord | null {
    const record = this.undoStack.pop();
    if (record) {
      this.redoStack.push(record);
    }
    return record ?? null;
  }

  redo(): MoveRecord | null {
    const record = this.redoStack.pop();
    if (record) {
      this.undoStack.push(record);
    }
    return record ?? null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getMoveList(): Move[] {
    return this.undoStack.map(r => r.move);
  }

  getLength(): number {
    return this.undoStack.length;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
