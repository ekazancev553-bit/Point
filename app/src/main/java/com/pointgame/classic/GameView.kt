package com.pointgame.classic

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.min

class GameView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    var engine = GameEngine()
    var onMoveMade: ((col: Int, row: Int) -> Unit)? = null

    private val paintGrid = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFD4C57B")
        strokeWidth = 1.5f
        style = Paint.Style.STROKE
    }

    private val paintBg = Paint().apply {
        color = Color.parseColor("#FFFFF9C4")
        style = Paint.Style.FILL
    }

    private val paintDotP1 = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFD32F2F")
        style = Paint.Style.FILL
    }

    private val paintDotP2 = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FF1565C0")
        style = Paint.Style.FILL
    }

    private val paintCapturedP1 = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#80D32F2F")
        style = Paint.Style.FILL
    }

    private val paintCapturedP2 = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#801565C0")
        style = Paint.Style.FILL
    }

    private val paintBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#AA000000")
        style = Paint.Style.STROKE
        strokeWidth = 1.5f
    }

    private val paintHighlight = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#40000000")
        style = Paint.Style.FILL
    }

    private var cellSize = 0f
    private var offsetX = 0f
    private var offsetY = 0f

    private var lastTapCol = -1
    private var lastTapRow = -1

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val gridW = w - paddingLeft - paddingRight
        val gridH = h - paddingTop - paddingBottom
        cellSize = min(
            gridW.toFloat() / engine.cols,
            gridH.toFloat() / engine.rows
        )
        offsetX = paddingLeft + (gridW - cellSize * engine.cols) / 2f
        offsetY = paddingTop + (gridH - cellSize * engine.rows) / 2f
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Background
        canvas.drawRect(
            offsetX, offsetY,
            offsetX + cellSize * engine.cols,
            offsetY + cellSize * engine.rows,
            paintBg
        )

        // Grid lines
        for (c in 0..engine.cols) {
            val x = offsetX + c * cellSize
            canvas.drawLine(x, offsetY, x, offsetY + cellSize * engine.rows, paintGrid)
        }
        for (r in 0..engine.rows) {
            val y = offsetY + r * cellSize
            canvas.drawLine(offsetX, y, offsetX + cellSize * engine.cols, y, paintGrid)
        }

        val dotRadius = cellSize * 0.32f
        val capturedRadius = cellSize * 0.28f

        // Draw dots and captured cells
        for (r in 0 until engine.rows) {
            for (c in 0 until engine.cols) {
                val cx = offsetX + c * cellSize + cellSize / 2f
                val cy = offsetY + r * cellSize + cellSize / 2f

                val cell = engine.board[r][c]
                val captured = engine.capturedBy[r][c]

                // Draw captured overlay
                if (captured != GameEngine.EMPTY) {
                    val capPaint = if (captured == GameEngine.PLAYER1) paintCapturedP1 else paintCapturedP2
                    canvas.drawCircle(cx, cy, capturedRadius, capPaint)
                    canvas.drawCircle(cx, cy, capturedRadius, paintBorder)
                }

                // Draw dot
                if (cell != GameEngine.EMPTY) {
                    val dotPaint = if (cell == GameEngine.PLAYER1) paintDotP1 else paintDotP2
                    canvas.drawCircle(cx, cy, dotRadius, dotPaint)
                    canvas.drawCircle(cx, cy, dotRadius, paintBorder)
                } else if (c == lastTapCol && r == lastTapRow) {
                    // Tap highlight on empty cell
                    canvas.drawCircle(cx, cy, dotRadius * 0.6f, paintHighlight)
                }
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_UP) {
            val col = ((event.x - offsetX) / cellSize).toInt()
            val row = ((event.y - offsetY) / cellSize).toInt()

            if (col in 0 until engine.cols && row in 0 until engine.rows) {
                lastTapCol = col
                lastTapRow = row
                onMoveMade?.invoke(col, row)
                invalidate()
            }
        }
        return true
    }

    fun reset(newEngine: GameEngine) {
        engine = newEngine
        lastTapCol = -1
        lastTapRow = -1
        onSizeChanged(width, height, 0, 0)
        invalidate()
    }
}
