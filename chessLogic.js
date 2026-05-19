export function validMoves(piece, color, row, col, gameState) {
    const { board, enPassantTarget, castlingRights } = gameState

    function getSlidingMoves(dirs) {
        const moves = []

        for (const [dr, dc] of dirs) {
            let r = row + dr
            let c = col + dc

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (!board[r][c]) {
                    moves.push([r, c])
                } else {
                    if (!board[r][c].startsWith(color)) {
                        moves.push([r, c])
                    }
                    break
                }
                r += dr
                c += dc
            }
        }

        return moves
    }

    switch (piece) {

        case 'pawn': {
            const moves = []
            const dir = color === 'white' ? -1 : 1
            const startRow = color === 'white' ? 6 : 1
            const enemy = color === 'white' ? 'black' : 'white'

            if (board[row + dir]?.[col] === null) {
                moves.push([row + dir, col])

                if (row === startRow && board[row + 2 * dir]?.[col] === null) {
                    moves.push([row + 2 * dir, col])
                }
            }

            for (const dc of [-1, 1]) {
                const r = row + dir
                const c = col + dc

                if (board[r]?.[c] && board[r][c].startsWith(enemy)) {
                    moves.push([r, c])
                }
            }

            if (
                enPassantTarget &&
                enPassantTarget.color === color &&
                Math.abs(col - enPassantTarget.col) === 1 &&
                row === enPassantTarget.row - dir
            ) {
                moves.push([enPassantTarget.row, enPassantTarget.col])
            }

            return moves
        }

        case 'knight': {
            const moves = []
            const dirs = [
                [2,1],[2,-1],[-2,1],[-2,-1],
                [1,2],[1,-2],[-1,2],[-1,-2]
            ]

            for (const [dr, dc] of dirs) {
                const r = row + dr
                const c = col + dc

                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (!board[r][c] || !board[r][c].startsWith(color)) {
                        moves.push([r, c])
                    }
                }
            }

            return moves
        }

        case 'king': {
            const moves = []
            const dirs = [
                [1,0],[-1,0],[0,1],[0,-1],
                [1,1],[1,-1],[-1,1],[-1,-1]
            ]

            // normal king moves
            for (const [dr, dc] of dirs) {
                const r = row + dr
                const c = col + dc

                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (!board[r][c] || !board[r][c].startsWith(color)) {
                        moves.push([r, c])
                    }
                }
            }

            // =========================
            // CASTLING (FIXED VERSION)
            // =========================

            const enemy = color === 'white' ? 'black' : 'white'

            const backRank = color === 'white' ? 7 : 0
            const rights = castlingRights[color]

            const safe = (r, c) =>
                !isSquareAttacked(r, c, enemy, gameState)

            // KING must not be in check
            const kingInCheck = isSquareAttacked(row, col, enemy, gameState)

            if (!kingInCheck) {

                // -----------------
                // KING SIDE CASTLE
                // -----------------
                if (
                    rights.kingside &&
                    !board[backRank][5] &&
                    !board[backRank][6] &&
                    safe(backRank, 5) &&
                    safe(backRank, 6)
                ) {
                    moves.push([backRank, 6])
                }

                // -----------------
                // QUEEN SIDE CASTLE
                // -----------------
                if (
                    rights.queenside &&
                    !board[backRank][1] &&
                    !board[backRank][2] &&
                    !board[backRank][3] &&
                    safe(backRank, 3) &&
                    safe(backRank, 2)
                ) {
                    moves.push([backRank, 2])
                }
            }

            return moves
        }

        case 'rook':
            return getSlidingMoves([[1,0],[-1,0],[0,1],[0,-1]])

        case 'bishop':
            return getSlidingMoves([[1,1],[1,-1],[-1,1],[-1,-1]])

        case 'queen':
            return getSlidingMoves([
                [1,0],[-1,0],[0,1],[0,-1],
                [1,1],[1,-1],[-1,1],[-1,-1]
            ])
    }
}

export function isSquareAttacked(row, col, byColor, gameState) {

    function rayAttacks(r, c, targetR, targetC, type, board) {
        const dirs =
            type === 'rook'
                ? [[1,0],[-1,0],[0,1],[0,-1]]
                : type === 'bishop'
                ? [[1,1],[1,-1],[-1,1],[-1,-1]]
                : [
                    [1,0],[-1,0],[0,1],[0,-1],
                    [1,1],[1,-1],[-1,1],[-1,-1]
                ]

        for (const [dr, dc] of dirs) {
            let nr = r + dr
            let nc = c + dc

            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (nr === targetR && nc === targetC) return true
                if (board[nr][nc]) break
                nr += dr
                nc += dc
            }
        }

        return false
    }

    const { board } = gameState

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c]
            if (!piece) continue

            const [color, type] = piece.split('_')
            if (color !== byColor) continue

            switch (type) {

                case 'pawn': {
                    const dir = color === 'white' ? -1 : 1
                    if (
                        r + dir === row &&
                        (c + 1 === col || c - 1 === col)
                    ) return true
                    break
                }

                case 'knight': {
                    const dirs = [
                        [2,1],[2,-1],[-2,1],[-2,-1],
                        [1,2],[1,-2],[-1,2],[-1,-2]
                    ]

                    if (dirs.some(([dr, dc]) =>
                        r + dr === row && c + dc === col
                    )) return true

                    break
                }

                case 'bishop':
                case 'rook':
                case 'queen':
                    if (rayAttacks(r, c, row, col, type, board)) return true
                    break

                case 'king':
                    if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
                        return true
                    }
                    break
            }
        }
    }

    return false
}

export function findKing(color, board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === `${color}_king`) {
                return [r, c]
            }
        }
    }
    return null
}

export function isKingInCheck(color, gameState) {
    const { board } = gameState
    const king = findKing(color, board)
    if (!king) return false

    const [kr, kc] = king
    const enemy = color === 'white' ? 'black' : 'white'

    return isSquareAttacked(kr, kc, enemy, gameState)
}

export function legalMoves(piece, color, row, col, gameState) {
    const moves = validMoves(piece, color, row, col, gameState)

    return moves.filter(([toRow, toCol]) => {
        const newBoard = gameState.board.map(r => r.slice())

        newBoard[toRow][toCol] = newBoard[row][col]
        newBoard[row][col] = null

        const newState = { ...gameState, board: newBoard }

        return !isKingInCheck(color, newState)
    })
}

export function tryMove(fromRow, fromCol, toRow, toCol, gameState) {
    const { board, turn, castlingRights, enPassantTarget } = gameState

    const piece = board[fromRow][fromCol]
    if (!piece) return null

    const [color, type] = piece.split('_')

    const moves = legalMoves(type, color, fromRow, fromCol, gameState)

    const isValid = moves.some(([r, c]) => r === toRow && c === toCol)
    if (!isValid) return null

    const newBoard = board.map(r => r.slice())
    newBoard[toRow][toCol] = piece
    newBoard[fromRow][fromCol] = null

    // --- EN PASSANT ---
    let newEnPassantTarget = null

    const isEnPassant =
        type === 'pawn' &&
        enPassantTarget &&
        toRow === enPassantTarget.row &&
        toCol === enPassantTarget.col &&
        enPassantTarget.color === turn

    if (isEnPassant) {
        const captureRow = color === 'white' ? toRow + 1 : toRow - 1
        newBoard[captureRow][toCol] = null
    }

    if (type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
        newEnPassantTarget = {
            row: (fromRow + toRow) / 2,
            col: fromCol,
            color: color === 'white' ? 'black' : 'white'
        }
    }

    // --- PROMOTION ---
    if (type === 'pawn' && (toRow === 0 || toRow === 7)) {
        return {
            ...gameState,
            pendingPromotion: { row: toRow, col: toCol, color },
            board: newBoard,
            selected: null
        }
    }

    // --- CASTLING ---
    if (type === 'king') {
        if (color === 'white' && fromCol === 4 && toCol === 6) {
            newBoard[7][5] = newBoard[7][7]
            newBoard[7][7] = null
        }
        if (color === 'white' && fromCol === 4 && toCol === 2) {
            newBoard[7][3] = newBoard[7][0]
            newBoard[7][0] = null
        }
        if (color === 'black' && fromCol === 4 && toCol === 6) {
            newBoard[0][5] = newBoard[0][7]
            newBoard[0][7] = null
        }
        if (color === 'black' && fromCol === 4 && toCol === 2) {
            newBoard[0][3] = newBoard[0][0]
            newBoard[0][0] = null
        }
    }

    // --- CASTLING RIGHTS ---
    const newRights = {
        white: { ...castlingRights.white },
        black: { ...castlingRights.black }
    }

    if (type === 'king') {
        newRights[color].kingside = false
        newRights[color].queenside = false
    }

    if (type === 'rook') {
        if (color === 'white') {
            if (fromRow === 7 && fromCol === 0) newRights.white.queenside = false
            if (fromRow === 7 && fromCol === 7) newRights.white.kingside = false
        } else {
            if (fromRow === 0 && fromCol === 0) newRights.black.queenside = false
            if (fromRow === 0 && fromCol === 7) newRights.black.kingside = false
        }
    }

    return {
        ...gameState,
        board: newBoard,
        castlingRights: newRights,
        enPassantTarget: newEnPassantTarget,
        selected: null,
        turn: turn === 'white' ? 'black' : 'white'
    }
}

export function hasLegalMoves(color, gameState) {
    const { board } = gameState

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c]
            if (!piece || !piece.startsWith(color)) continue

            const [, type] = piece.split('_')
            const moves = validMoves(type, color, r, c, gameState)

            for (const [toRow, toCol] of moves) {
                const newBoard = board.map(r => r.slice())
                newBoard[toRow][toCol] = piece
                newBoard[r][c] = null

                const newState = { ...gameState, board: newBoard }

                if (!isKingInCheck(color, newState)) {
                    return true
                }
            }
        }
    }

    return false
}