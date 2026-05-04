export const initialGameState = {
    board: [
        ['black_rook','black_knight','black_bishop','black_queen','black_king','black_bishop','black_knight','black_rook'],
        ['black_pawn','black_pawn','black_pawn','black_pawn','black_pawn','black_pawn','black_pawn','black_pawn'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['white_pawn','white_pawn','white_pawn','white_pawn','white_pawn','white_pawn','white_pawn','white_pawn'],
        ['white_rook','white_knight','white_bishop','white_queen','white_king','white_bishop','white_knight','white_rook']
    ],

    turn: 'white',

    castlingRights: {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
    },

    enPassantTarget: null,

    selected: null,
    // row, col, moves -- currently selected piece and its legal moves

    status: 'waiting', // waiting, playing, checkmate, stalemate

    pendingPromotion: null
}