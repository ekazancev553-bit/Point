package com.pointgame.classic

/**
 * Core game engine for the "Points" (Точки) strategy game.
 *
 * Rules:
 * - Two players alternate placing dots on a grid.
 * - After each move, check if any opponent dots are now fully surrounded.
 * - Surrounded dots are captured and scored for the capturing player.
 * - Game ends when the board is full; highest score wins.
 */
class GameEngine(val cols: Int = 15, val rows: Int = 15) {

    companion object {
        const val EMPTY = 0
        const val PLAYER1 = 1
        const val PLAYER2 = 2
    }

    val board = Array(rows) { IntArray(cols) { EMPTY } }
    val capturedBy = Array(rows) { IntArray(cols) { EMPTY } } // who captured this cell

    var currentPlayer = PLAYER1
    var player1Score = 0
    var player2Score = 0
    var isGameOver = false

    fun makeMove(col: Int, row: Int): Boolean {
        if (col !in 0 until cols || row !in 0 until rows) return false
        if (board[row][col] != EMPTY) return false
        if (isGameOver) return false

        board[row][col] = currentPlayer
        checkCaptures(currentPlayer)

        if (isBoardFull()) {
            isGameOver = true
        } else {
            currentPlayer = opponent(currentPlayer)
        }
        return true
    }

    private fun checkCaptures(player: Int) {
        val opp = opponent(player)

        // BFS flood fill from all edge cells, through cells that are NOT the current player's dots
        // Cells reachable from the edge are "free" (not captured)
        val reachable = Array(rows) { BooleanArray(cols) }
        val queue = ArrayDeque<Int>() // encoded as row * cols + col

        for (r in 0 until rows) {
            for (c in 0 until cols) {
                val isEdge = r == 0 || r == rows - 1 || c == 0 || c == cols - 1
                if (isEdge && board[r][c] != player) {
                    val key = r * cols + c
                    if (!reachable[r][c]) {
                        reachable[r][c] = true
                        queue.addLast(key)
                    }
                }
            }
        }

        while (queue.isNotEmpty()) {
            val key = queue.removeFirst()
            val r = key / cols
            val c = key % cols
            for ((dr, dc) in DIRS) {
                val nr = r + dr
                val nc = c + dc
                if (nr in 0 until rows && nc in 0 until cols &&
                    !reachable[nr][nc] && board[nr][nc] != player
                ) {
                    reachable[nr][nc] = true
                    queue.addLast(nr * cols + nc)
                }
            }
        }

        // Any opponent dot NOT reachable from edge is captured
        for (r in 0 until rows) {
            for (c in 0 until cols) {
                if (board[r][c] == opp && !reachable[r][c] && capturedBy[r][c] == EMPTY) {
                    capturedBy[r][c] = player
                    if (player == PLAYER1) player1Score++ else player2Score++
                }
            }
        }
    }

    fun getWinner(): Int {
        return when {
            player1Score > player2Score -> PLAYER1
            player2Score > player1Score -> PLAYER2
            else -> EMPTY // draw
        }
    }

    fun reset() {
        for (r in 0 until rows) {
            board[r].fill(EMPTY)
            capturedBy[r].fill(EMPTY)
        }
        currentPlayer = PLAYER1
        player1Score = 0
        player2Score = 0
        isGameOver = false
    }

    private fun isBoardFull(): Boolean {
        for (r in 0 until rows) for (c in 0 until cols) if (board[r][c] == EMPTY) return false
        return true
    }

    private fun opponent(player: Int) = if (player == PLAYER1) PLAYER2 else PLAYER1

    private val DIRS = arrayOf(intArrayOf(-1, 0), intArrayOf(1, 0), intArrayOf(0, -1), intArrayOf(0, 1))
}
