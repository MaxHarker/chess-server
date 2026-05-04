import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { tryMove, hasLegalMoves, isKingInCheck } from './chessLogic.js'
import { initialGameState } from './initialGameState.js'

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

io.on('connection', (socket) => {
    console.log(`Client ${socket.id} connected`)
    socket.on('joinGame', (roomId) => {
        socket.join(roomId)

        if (!games[roomId]) {
            games[roomId] = {
                ...structuredClone(initialGameState),
                players: []
            }
            console.log(`Game ${roomId} created`)
        }

        const game = games[roomId]

        // reconnect case
        if (!game.players.includes(socket.id) && game.players.length < 2) {
            game.players.push(socket.id)
        }

        const playerIndex = game.players.indexOf(socket.id)
        const color = playerIndex === 0 ? 'white' : 'black'

        socket.emit('gameJoined', { color })
        socket.emit('gameState', game)

        io.to(roomId).emit('playerCount', game.players.length)

        if (game.players.length === 2 && game.status === 'waiting') {
            game.status = 'playing'
            io.to(roomId).emit('gameStart', { gameState: game })
            console.log('Game started!')
        }
    })

    socket.on('makeMove', ({ roomId, from, to }) => {
        const game = games[roomId]
        if (!game || game.pendingPromotion) return

        const playerIndex = game.players.indexOf(socket.id)
        const playerColor = playerIndex === 0 ? 'white' : 'black'

        if (game.turn !== playerColor) return

        const newState = tryMove(from[0], from[1], to[0], to[1], game)
        if (!newState) return

        games[roomId] = structuredClone(newState)

        // if promotion required → pause game
        if (newState.pendingPromotion) {
            io.to(roomId).emit('gameState', newState)
            return
        }

        evaluateGameState(games[roomId])

        io.to(roomId).emit('gameState', games[roomId])
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
        console.log(`Client ${socket.id} disconnected`)
        for (const roomId in games) {
            const game = games[roomId]
            game.players = game.players.filter(id => id !== socket.id)

            if (game.players.length === 0) {
                delete games[roomId]
                console.log(`Game ${roomId} deleted`)
            }
        }
    })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})