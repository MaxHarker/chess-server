import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import crypto from 'crypto'

import { tryMove, hasLegalMoves, isKingInCheck } from './chessLogic.js'
import { initialGameState } from './initialGameState.js'

<<<<<<< HEAD
import db from './db.js'
import bcrypt from 'bcrypt'
const saltRounds = 10

=======
>>>>>>> 2dde914b917c1bf7d42af0a2d4f2660595f318e4
const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'https://chess.maxharker.com'
        ]
    }
})

const games = {}
const queue = []

function evaluateGameState(game) {
    const turn = game.turn

    const hasMoves = hasLegalMoves(turn, game)
    const inCheck = isKingInCheck(turn, game)

    if (!hasMoves && inCheck) {
        game.status = 'checkmate'
        game.winner = turn === 'white' ? 'black' : 'white'
    } else if (!hasMoves) {
        game.status = 'stalemate'
    } else {
        game.status = 'playing'
    }
}

function createMatch(player1, player2) {
    const roomId = crypto.randomUUID()

    player1.join(roomId)
    player2.join(roomId)

    const game = {
        ...structuredClone(initialGameState),
        players: [player1.id, player2.id],
    }

    games[roomId] = game

    player1.emit('matchFound', { roomId, color: 'white' })
    player2.emit('matchFound', { roomId, color: 'black' })

    console.log(`Match created: ${roomId}`)

    game.status = 'playing'
    const startTime = Date.now() + 3000

    io.to(roomId).emit('gameStart', {
        gameState: game,
        startTime
    })
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

<<<<<<< HEAD
    socket.on('signUp', async ({ username, password, email }, callback) => {
        try {
            if (!username || !password || !email) {
                return callback({ success: false, message: 'All fields are required' })
            }

            // check if user exists
            const usernameExisting = await db.query(
                'SELECT id FROM "User" WHERE username = $1',
                [username]
            )

            const emailExisting = await db.query(
                'SELECT id FROM "User" WHERE email = $1',
                [email]
            )

            if (usernameExisting.rows.length > 0) {
                return callback({ success: false, message: 'Username already taken' })
            }

            if (emailExisting.rows.length > 0) {
                return callback({ success: false, message: 'Email already in use' })
            }

            const passwordHash = await bcrypt.hash(password, saltRounds)

            const result = await db.query(
                `INSERT INTO "User" (username, "passwordHash", email)
                VALUES ($1, $2, $3)
                RETURNING id, username`,
                [username, passwordHash, email]
            )

            const user = result.rows[0]

            return callback({
                success: true,
                userId: user.id,
                username: user.username
            })

        } catch (err) {
            console.error(err)
            return callback({ success: false, message: 'Server error' })
        }
    })

    socket.on('login', async ({ username, password }, callback) => {
        try {
            if (!username || !password) {
                return callback({
                    success: false,
                    message: 'Missing credentials'
                })
            }

            const result = await db.query(
                `SELECT id, username, "passwordHash", rating
                FROM "User"
                WHERE username = $1`,
                [username]
            )

            if (result.rows.length === 0) {
                return callback({
                    success: false,
                    message: 'User not found'
                })
            }

            const user = result.rows[0]

            const isValid = await bcrypt.compare(password, user.passwordHash)

            if (!isValid) {
                return callback({
                    success: false,
                    message: 'Invalid password'
                })
            }

            // attach session info to socket
            socket.userId = user.id
            socket.username = user.username

            return callback({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    rating: user.rating
                }
            })

        } catch (err) {
            console.error(err)
            return callback({
                success: false,
                message: 'Server error'
            })
        }
    })

=======
>>>>>>> 2dde914b917c1bf7d42af0a2d4f2660595f318e4
    socket.on('findMatch', () => {
        console.log(`Player queued: ${socket.id}`)

        queue.push(socket)

        if (queue.length >= 2) {
            const player1 = queue.shift()
            const player2 = queue.shift()

            createMatch(player1, player2)
        }
    })

    socket.on('makeMove', ({ roomId, from, to }) => {
        const game = games[roomId]
        if (!game || game.pendingPromotion) return

        const playerIndex = game.players.indexOf(socket.id)
        const playerColor = playerIndex === 0 ? 'white' : 'black'

        const targetPiece = game.board[to[0]][to[1]]
        const isCapture = !!targetPiece

        if (game.turn !== playerColor) return

        const newState = tryMove(from[0], from[1], to[0], to[1], game)
        if (!newState) return

        games[roomId] = structuredClone(newState)

        if (newState.pendingPromotion) {
            io.to(roomId).emit('gameState', newState)
            return
        }

        evaluateGameState(games[roomId])

        io.to(roomId).emit('gameState', games[roomId])

        io.to(roomId).emit('moveMade', {
            type: isCapture ? 'capture' : 'move'
        })
    })

    socket.on('promotePawn', ({ roomId, piece }) => {
        const game = games[roomId]
        if (!game || !game.pendingPromotion) return

        const { row, col, color } = game.pendingPromotion

        game.board[row][col] = `${color}_${piece}`
        game.pendingPromotion = null
        game.turn = game.turn === 'white' ? 'black' : 'white'

        evaluateGameState(game)

        io.to(roomId).emit('gameState', game)
    })

    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`)

        const index = queue.findIndex(p => p.id === socket.id)
        if (index !== -1) queue.splice(index, 1)

        for (const roomId in games) {
            const game = games[roomId]

            game.players = game.players.filter(id => id !== socket.id)

            if (game.players.length === 0) {
                delete games[roomId]
                console.log(`Deleted game ${roomId}`)
            }
        }
    })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
})