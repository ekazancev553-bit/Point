package com.pointgame.classic

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.pointgame.classic.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnPlay.setOnClickListener {
            startActivity(Intent(this, GameActivity::class.java))
        }

        binding.btnHowToPlay.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle(getString(R.string.how_to_play))
                .setMessage(getString(R.string.rules_text))
                .setPositiveButton(getString(R.string.ok), null)
                .show()
        }
    }
}
