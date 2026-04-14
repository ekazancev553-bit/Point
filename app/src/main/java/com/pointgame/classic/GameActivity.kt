package com.pointgame.classic

import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.pointgame.classic.databinding.ActivityGameBinding

class GameActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGameBinding
    private var engine = GameEngine()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGameBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.hide()

        setupGame()

        binding.btnNewGame.setOnClickListener { confirmNewGame() }
        binding.btnBack.setOnClickListener { finish() }
    }

    private fun setupGame() {
        engine = GameEngine(cols = 15, rows = 15)
        binding.gameView.reset(engine)
        updateUI()

        binding.gameView.onMoveMade = { col, row ->
            if (!engine.isGameOver) {
                val moved = engine.makeMove(col, row)
                if (moved) {
                    updateUI()
                    if (engine.isGameOver) showGameOver()
                }
            }
        }
    }

    private fun updateUI() {
        binding.tvScore1.text = engine.player1Score.toString()
        binding.tvScore2.text = engine.player2Score.toString()

        if (!engine.isGameOver) {
            val isP1Turn = engine.currentPlayer == GameEngine.PLAYER1
            binding.tvTurn.text = if (isP1Turn) getString(R.string.player_1) else getString(R.string.player_2)
            binding.turnIndicator.setBackgroundResource(
                if (isP1Turn) R.drawable.dot_indicator_red else R.drawable.dot_indicator_blue
            )
        }
    }

    private fun showGameOver() {
        val winner = engine.getWinner()
        val message = when (winner) {
            GameEngine.PLAYER1 -> getString(R.string.winner_player1) +
                    "\n${getString(R.string.player_1)}: ${engine.player1Score} ${getString(R.string.captured)}"
            GameEngine.PLAYER2 -> getString(R.string.winner_player2) +
                    "\n${getString(R.string.player_2)}: ${engine.player2Score} ${getString(R.string.captured)}"
            else -> getString(R.string.draw) +
                    "\n${engine.player1Score} : ${engine.player2Score}"
        }

        AlertDialog.Builder(this)
            .setTitle(getString(R.string.game_over))
            .setMessage(message)
            .setPositiveButton(getString(R.string.new_game)) { _, _ -> setupGame() }
            .setNegativeButton(getString(R.string.back)) { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    private fun confirmNewGame() {
        if (engine.player1Score == 0 && engine.player2Score == 0) {
            setupGame()
            return
        }
        AlertDialog.Builder(this)
            .setMessage("Начать новую игру?")
            .setPositiveButton(getString(R.string.new_game)) { _, _ -> setupGame() }
            .setNegativeButton("Отмена", null)
            .show()
    }
}
