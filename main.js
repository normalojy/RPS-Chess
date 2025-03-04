let boardSquaresArray = []; // To keep track of the board
let isWhiteTurn = true; // To keep track of player turn
let whiteKingSquare = "e1"; // Initiallize and store king square
let blackKingSquare = "e8";
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
const piecesImages = document.getElementsByTagName("img");
// Keyboard inputs for RPS
const PLAYER_1_KEYS = {
    'a': 'rock',
    's': 'paper',
    'd': 'scissors'
};
const PLAYER_2_KEYS = {
    'ArrowLeft': 'rock',
    'ArrowDown': 'paper',
    'ArrowRight': 'scissors'
};
let isRpsGameWon = null; // For RPS result
let gameOver = true; // For game over, default as game over

// Setup chessboard
setupBoardSquares();
setupPieces();
fillBoardSquaresArray();

function fillBoardSquaresArray() {
    const boardSquares = document.getElementsByClassName("square");
    for (let i = 0; i < boardSquares.length; i++) {
        let row = 8 - Math.floor(i / 8);
        let column = String.fromCharCode(97 + (i % 8));
        let square = boardSquares[i];
        square.id = column + row;
        let color = "";
        let pieceType = "";
        let pieceId = "";
        if (square.querySelector(".piece")) {
            color = square.querySelector(".piece").getAttribute("color");
            pieceType = square.querySelector(".piece").classList[1];
            pieceId = square.querySelector(".piece").id;
        } else {
            color = "blank";
            pieceType = "blank";
            pieceId = "blank";
        }
        let arrayElement = {
            squareId: square.id,
            pieceColor: color,
            pieceType: pieceType,
            pieceId: pieceId
        };
        boardSquaresArray.push(arrayElement);
    }
}

// To update board squares chess piece moves
function updateBoardSquaresArray(currentSquareId, destinationSquareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
    );
    let destinationSquareElement = boardSquaresArray.find(
        (element) => element.squareId === destinationSquareId
    );
    let pieceColor = currentSquare.pieceColor;
    let pieceType = currentSquare.pieceType;
    let pieceId = currentSquare.pieceId;
    destinationSquareElement.pieceColor = pieceColor;
    destinationSquareElement.pieceType = pieceType;
    destinationSquareElement.pieceId = pieceId;
    currentSquare.pieceColor = "blank";
    currentSquare.pieceType = "blank";
    currentSquare.pieceId = "blank";
}

function deepCopyArray(array) {
    let arrayCopy = array.map(element => {
        return {
            ...element
        };
    });
    return arrayCopy;
}

function setupBoardSquares() {
    for (let i = 0; i < boardSquares.length; i++) {
        boardSquares[i].addEventListener("dragover", allowDrop);
        boardSquares[i].addEventListener("drop", drop);
        let row = 8 - Math.floor(i / 8);
        let column = String.fromCharCode(97 + (i % 8));
        let square = boardSquares[i];
        square.id = column + row;
    }
}

function setupPieces() {
    for (let i = 0; i < pieces.length; i++) {
        pieces[i].addEventListener("dragstart", drag);
        pieces[i].setAttribute("draggable", true);
        pieces[i].id = pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
    }
    for (let i = 0; i < piecesImages.length; i++) {
        piecesImages[i].setAttribute("draggable", false);
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

// Dragging pieces
function drag(ev) {
    if (gameOver) // Disable if game over
        return;
    // Get dragged piece and its properties
    const piece = ev.target;
    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const pieceId = piece.id;

    // Check if correct player and correct piece
    if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black")) {
        const startingSquareId = piece.parentNode.id;
        ev.dataTransfer.setData("text", pieceId + "|" + startingSquareId);
        const pieceObject = {
            pieceColor: pieceColor,
            pieceType: pieceType,
            pieceId: pieceId
        }
        let legalSquares = getPossibleMoves(
            startingSquareId,
            pieceObject,
            boardSquaresArray
        );

        let legalSquaresJson = JSON.stringify(legalSquares);
        ev.dataTransfer.setData("application/json", legalSquaresJson);
    }
}

function waitForRpsGameResult() {
    return new Promise(resolve => {
        // periodically check rps game result
        const checkRpsResult = setInterval(() => {
            // if rps done, clear interval and resolve
            if (isRpsGameWon !== "") {
                clearInterval(checkRpsResult);
                resolve(isRpsGameWon);
            }
        }, 100); // check every 100 ms
    });
}

// asyn function to allow drop after rps game
async function drop(ev) {
    if (gameOver) // disable game if game over
        return;
    // initialize RPS game result variables
    isRpsGameWon = "";
    rpsResult = "";
    let isBotTurn = !isWhiteTurn; // Assume bot to be black player
    if (isBotTurn && !isMultiplayer) return; // Disable if its bot turn and vs bot mode
    ev.preventDefault();
    const destinationSquare = ev.currentTarget;
    let destinationSquareId = destinationSquare.id;
    let data = ev.dataTransfer.getData("text");
    let [pieceId, startingSquareId] = data.split("|");

    // display move on board
    await displayMove(startingSquareId, destinationSquareId);

    // wait 2 sec before bot playing
    if (!isWhiteTurn) {
        setTimeout(getBotMoves, 2000);
    }
}

async function displayMove(startingSquareId, destinationSquareId) {
    if (gameOver)
        return;
    const pieceObject = getPieceAtSquare(startingSquareId, boardSquaresArray);
    const piece = document.getElementById(pieceObject.pieceId);
    const pieceId = pieceObject.pieceId;
    let pieceColor = pieceObject.pieceColor;
    const pieceType = pieceObject.pieceType;
    let destinationSquare = document.getElementById(destinationSquareId);
    let legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);

    // validate if move against check
    legalSquares = isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType);

    // if piece is king check if move results in check
    if (pieceType == "king") {
        let isCheck = isKingInCheck(destinationSquareId, pieceColor, boardSquaresArray);
        if (isCheck)
            return;
        // update king's position
        isWhiteTurn ? (whiteKingSquare = destinationSquareId) : (blackKingSquare = destinationSquareId);
    }
    // get content of destination square
    let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);
    // if destination square is empty and move is legal
    if (squareContent.pieceColor == "blank" && legalSquares.includes(destinationSquareId)) {
        destinationSquare.appendChild(piece);
        isWhiteTurn = !isWhiteTurn;
        updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
        checkForCheckMate();
        return;
    }
    // if destination square is occupied and move is legal
    if (squareContent.pieceColor != "blank" && legalSquares.includes(destinationSquareId)) {
        // if piece is king allow capture without RPS game
        if (pieceType == "king") {
            let children = destinationSquare.children;
            for (let i = 0; i < children.length; i++) {
                if (!children[i].classList.contains("coordinate")) {
                    destinationSquare.removeChild(children[i]);
                }
            }
            destinationSquare.appendChild(piece);
            isWhiteTurn = !isWhiteTurn;
            updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
            checkForCheckMate();
            return;
        }
        rpsResult = "";
        startGame(); // start RPS game
        rpsResult = await waitForRpsGameResult(); // wait for rps game result
        // check if the rps result and player turn
        if ((rpsResult && isWhiteTurn) || (!rpsResult && !isWhiteTurn)) {
            let children = destinationSquare.children;
            for (let i = 0; i < children.length; i++) {
                if (!children[i].classList.contains("coordinate")) {
                    destinationSquare.removeChild(children[i]);
                }
            }

            destinationSquare.appendChild(piece);
            isWhiteTurn = !isWhiteTurn;
            updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
            checkForCheckMate();
        } else {
            // if player loses rps game no capture allowed
            // check if king is still in check, if check game over
            const kingSquare = isWhiteTurn ? whiteKingSquare : blackKingSquare;
            let isCheck = isKingInCheck(kingSquare, isWhiteTurn ? 'white' : 'black', boardSquaresArray);
            if (isCheck) {
                let message = isWhiteTurn ? "Black Wins" : "White Wins";
                showAlert(message);
                gameOver = true;
            }
            isWhiteTurn = !isWhiteTurn;
            return;
        }
        return;
    }
}

// get bot chess move (assume bot is black)
function getBotMoves() {
    if (gameOver)
        return;
    if (isMultiplayer || isWhiteTurn) return; // check if multiplayer mode or white turn

    // get all black pieces on board
    const allBlackPieces = document.querySelectorAll('.piece[color="black"]');
    let pieceToMove = null;
    let startingSquareId = null;
    let legalSquares = [];

    // continue until legal move is found
    while (legalSquares.length === 0) {
        // select random piece
        const randomIndex = Math.floor(Math.random() * allBlackPieces.length);
        pieceToMove = allBlackPieces[randomIndex];
        startingSquareId = pieceToMove.parentNode.id;
        const pieceObject = {
            pieceColor: "black",
            pieceType: pieceToMove.classList[1],
            pieceId: pieceToMove.id,
        };

        legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
        legalSquares = isMoveValidAgainstCheck(legalSquares, startingSquareId, "black", pieceObject.pieceType);
    }

    // choose random legal move for selected piece
    const randomMoveIndex = Math.floor(Math.random() * legalSquares.length);
    const destinationSquareId = legalSquares[randomMoveIndex];

    displayMove(startingSquareId, destinationSquareId);
}

// get possible moves for every piece type
function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
    const pieceColor = piece.pieceColor;
    const pieceType = piece.pieceType;

    let legalSquares = [];
    if (pieceType == "pawn") {
        legalSquares = getPawnMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
    if (pieceType == "knight") {
        legalSquares = getKnightMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
    if (pieceType == "rook") {
        legalSquares = getRookMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
    if (pieceType == "bishop") {
        legalSquares = getBishopMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
    if (pieceType == "queen") {
        legalSquares = getQueenMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
    if (pieceType == "king") {
        legalSquares = getKingMoves(
            startingSquareId,
            pieceColor,
            boardSquaresArray
        );
        return legalSquares;
    }
}


function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let diagonalSquares = checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray);
    let forwardSquares = checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [...diagonalSquares, ...forwardSquares];
    return legalSquares;
}

function checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let legalSquares = [];
    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank;

    // forward or backwards depending on piece color
    const direction = pieceColor == "white" ? 1 : -1;
    if (!(rank == 8 && direction == 1) && !(rank == 1 && direction == -1))
        currentRank += direction;
    // loop for diagonal squares
    for (let i = -1; i <= 1; i += 2) {
        currentFile = String.fromCharCode(file.charCodeAt(0) + i);
        if (currentFile >= "a" && currentFile <= "h" && currentRank <= 8 && currentRank >= 1) {
            currentSquareId = currentFile + currentRank;
            let currentSquare = boardSquaresArray.find(
                (element) => element.squareId === currentSquareId
            );
            let squareContent = currentSquare.pieceColor;
            if (squareContent != "blank" && squareContent != pieceColor)
                legalSquares.push(currentSquareId);
        }
    }
    return legalSquares;
}

function checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let legalSquares = [];

    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank;

    // forward or backwards depending on piece color
    const direction = pieceColor == "white" ? 1 : -1;
    currentRank += direction;
    currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank") return legalSquares;
    legalSquares.push(currentSquareId);
    if (!((rankNumber == 2 && pieceColor == "white") || (rankNumber == 7 && pieceColor == "black")))
        return legalSquares;
    currentRank += direction;
    currentSquareId = currentFile + currentRank;
    currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
    );
    squareContent = currentSquare.pieceColor;
    // if forward square is blocked, return
    if (squareContent != "blank")
        if (squareContent != "blank")
            return legalSquares;
    legalSquares.push(currentSquareId);
    return legalSquares;
}

function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charCodeAt(0) - 97;
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    // squares list relative to knight
    const moves = [
        [-2, 1],
        [-1, 2],
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
    ];
    moves.forEach((move) => {
        currentFile = file + move[0];
        currentRank = rankNumber + move[1];
        // check if inside chessboard
        if (
            currentFile >= 0 &&
            currentFile <= 7 &&
            currentRank > 0 &&
            currentRank <= 8
        ) {
            let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
            let currentSquare = boardSquaresArray.find(
                (element) => element.squareId === currentSquareId
            );
            let squareContent = currentSquare.pieceColor;
            if (squareContent != "blank" && squareContent == pieceColor)
                return legalSquares;
            legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
        }
    });
    return legalSquares;
}

function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let moveToEighthRankSquares = moveToEighthRank(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankSquares = moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray);
    let moveToAFileSquares = moveToAFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToHFileSquares = moveToHFile(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [
        ...moveToEighthRankSquares,
        ...moveToFirstRankSquares,
        ...moveToAFileSquares,
        ...moveToHFileSquares,
    ];
    return legalSquares;
}

function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let moveToEighthRankHFileSquares = moveToEighthRankHFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToEighthRankAFileSquares = moveToEighthRankAFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankHFileSquares = moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankAFileSquares = moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [
        ...moveToEighthRankHFileSquares,
        ...moveToEighthRankAFileSquares,
        ...moveToFirstRankHFileSquares,
        ...moveToFirstRankAFileSquares,
    ];
    return legalSquares;
}
// queens moves as both bishop plus rook
function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let bishopMoves = getBishopMoves(startingSquareId, pieceColor, boardSquaresArray);
    let rookMoves = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [...bishopMoves, ...rookMoves];
    return legalSquares;
}

function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charCodeAt(0) - 97;
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    // squares relative to king
    const moves = [
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 0],
        [-1, -1],
        [-1, 1],
        [1, 0],
    ];

    //  for (let move of moves)
    moves.forEach((move) => {
        currentFile = file + move[0];
        currentRank = rankNumber + move[1];
        // check if move is inside chess board
        if (
            currentFile >= 0 &&
            currentFile <= 7 &&
            currentRank > 0 &&
            currentRank <= 8
        ) {
            let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
            let currentSquare = boardSquaresArray.find(
                (element) => element.squareId === currentSquareId
            );
            let squareContent = currentSquare.pieceColor;
            if (squareContent != "blank" && squareContent == pieceColor)
                return legalSquares;
            legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
        }
    });
    return legalSquares;
}

// vertical moves for rook
function moveToEighthRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until 8th rank
    while (currentRank != 8) {
        currentRank++;
        let currentSquareId = file + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        // if square is occupied by same color piece
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        // push square into legal squares array for legal capture
        legalSquares.push(currentSquareId);
        // if square is oocupied by different color piece
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

function moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until first rank
    while (currentRank != 1) {
        currentRank--;
        let currentSquareId = file + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

// horizontal moves for rook
function moveToAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    let currentFile = file;
    let legalSquares = [];

    // continue until a file
    while (currentFile != "a") {
        currentFile = String.fromCharCode(
            currentFile.charCodeAt(currentFile.length - 1) - 1
        );
        let currentSquareId = currentFile + rank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

function moveToHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    let currentFile = file;
    let legalSquares = [];

    // continue until h file
    while (currentFile != "h") {
        currentFile = String.fromCharCode(
            currentFile.charCodeAt(currentFile.length - 1) + 1
        );
        let currentSquareId = currentFile + rank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

// diagonal moves for bishop
function moveToEighthRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until top or left most square
    while (!(currentFile == "a" || currentRank == 8)) {
        currentFile = String.fromCharCode(
            currentFile.charCodeAt(currentFile.length - 1) - 1
        );
        currentRank++;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        // if square is occupied by same color piece
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        // push legal squares for capture
        legalSquares.push(currentSquareId);
        // if square is occupied by different color piece
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

function moveToEighthRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until top or right most square
    while (!(currentFile == "h" || currentRank == 8)) {
        currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
        currentRank++;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

function moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until bottom or left most square
    while (!(currentFile == "a" || currentRank == 1)) {
        currentFile = String.fromCharCode(
            currentFile.charCodeAt(currentFile.length - 1) - 1
        );
        currentRank--;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

function moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];
    // continue until bottom or right most square
    while (!(currentFile == "h" || currentRank == 1)) {
        currentFile = String.fromCharCode(
            currentFile.charCodeAt(currentFile.length - 1) + 1
        );
        currentRank--;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find(
            (element) => element.squareId === currentSquareId
        );
        let squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent == pieceColor)
            return legalSquares;
        legalSquares.push(currentSquareId);
        if (squareContent != "blank" && squareContent != pieceColor)
            return legalSquares;
    }
    return legalSquares;
}

// get piece at occupied square
function getPieceAtSquare(squareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === squareId
    );
    const color = currentSquare.pieceColor;
    const pieceType = currentSquare.pieceType;
    const pieceId = currentSquare.pieceId;
    return {
        pieceColor: color,
        pieceType: pieceType,
        pieceId: pieceId
    };
}

// check if king is in check
function isKingInCheck(SquareId, pieceColor, boardSquaresArray) {
    let legalSquares = getRookMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            (pieceProperties.pieceType == "rook" || pieceProperties.pieceType == "queen") && pieceColor != pieceProperties.color) {
            return true;
        }
    }

    legalSquares = getBishopMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            (pieceProperties.pieceType == "bishop" ||
                pieceProperties.pieceType == "queen") &&
            pieceColor != pieceProperties.color
        ) {
            return true;
        }
    }

    legalSquares = getKnightMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            pieceProperties.pieceType == "knight" &&
            pieceColor != pieceProperties.color
        ) {
            return true;
        }
    }

    legalSquares = checkPawnDiagonalCaptures(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (pieceProperties.pieceType == "pawn" && pieceColor != pieceProperties.color) {
            return true;
        }
    }
    legalSquares = getKingMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (pieceProperties.pieceType == "king" && pieceColor != pieceProperties.color) {
            return true;
        }
    }
    return false;
}

// check if move is valid against check
function isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType) {
    let kingSquare = isWhiteTurn ? whiteKingSquare : blackKingSquare;
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    legalSquaresCopy = legalSquares.slice();
    legalSquaresCopy.forEach((element) => {
        let destinationId = element;
        boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
        updateBoardSquaresArray(startingSquareId, destinationId, boardSquaresArrayCopy);

        if (pieceType != "king" && isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy)) {
            legalSquares = legalSquares.filter((item) => item !== destinationId);
        }

        if (pieceType == "king" && isKingInCheck(destinationId, pieceColor, boardSquaresArrayCopy)) {
            legalSquares = legalSquares.filter((item) => item !== destinationId);
        }

    });
    return legalSquares;
}


// function to check for checkmate
function checkForCheckMate() {
    let kingSquare = isWhiteTurn ? whiteKingSquare : blackKingSquare;
    let pieceColor = isWhiteTurn ? "white" : "black";
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let kingIsCheck = isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy);

    if (!kingIsCheck) return;
    let possibleMoves = getAllPossibleMoves(boardSquaresArrayCopy, pieceColor);
    if (possibleMoves.length > 0) return;
    let message = "";
    isWhiteTurn ? (message = "Black Wins") : (message = "White Wins");
    showAlert(message);
    gameOver = true;
}

// function for getting possible moves
function getAllPossibleMoves(squaresArray, color) {
    return squaresArray.filter((square) => square.pieceColor === color).flatMap((square) => {
        const {
            pieceColor,
            pieceType,
            pieceId
        } = getPieceAtSquare(square.squareId, squaresArray);
        if (pieceId === "blank") return [];

        let squaresArrayCopy = deepCopyArray(squaresArray);
        const pieceObject = {
            pieceColor: pieceColor,
            pieceType: pieceType,
            pieceId: pieceId
        }

        let legalSquares = getPossibleMoves(
            square.squareId,
            pieceObject,
            squaresArrayCopy
        );
        legalSquares = isMoveValidAgainstCheck(
            legalSquares,
            square.squareId,
            pieceColor,
            pieceType
        );

        return legalSquares;
    });
}

// function to show alert when win
function showAlert(message) {
    const alert = document.getElementById("alert");
    alert.innerHTML = message;
    alert.style.display = "block";

    setTimeout(function() {
        alert.style.display = "none";
    }, 3000);
}

// Initialize player rps choice
let player1Choice = '';
let player2Choice = '';

// Initialize player scores
let player1Score = 0;
let player2Score = 0;

const player1ScoreDisplay = document.getElementById('player1Score');
const player2ScoreDisplay = document.getElementById('player2Score');
const resultDisplay = document.getElementById('resultDisplay');
const player1ChoiceDisplayText = document.getElementById('player1ChoiceText');
const player2ChoiceDisplayText = document.getElementById('player2ChoiceText');
const player1ChoiceDisplayImage = document.getElementById('player1ChoiceImage');
const player2ChoiceDisplayImage = document.getElementById('player2ChoiceImage');

// Keep track if player has chosen
let player1HasChosen = false;
let player2HasChosen = false;

let timeoutId;

// Time window for input between players
const INPUT_TIME_WINDOW = 3000;

// To keep track of game mode
let isMultiplayer = "";

// For game mode and start game
document.getElementById("multiplayerBtn").addEventListener("click", () => {
    isMultiplayer = true;
    gameOver = false;
    document.getElementById("modeSelection").style.visibility = "hidden";
});
document.getElementById("vsBotBtn").addEventListener("click", () => {
    isMultiplayer = false;
    gameOver = false;
    document.getElementById("modeSelection").style.visibility = "hidden";
});

// Start the game by showing the game UI and hiding the mode selection
function startGame() {
    document.getElementById("modeSelection").style.visibility = "hidden";
    document.querySelector(".rps-overlay").style.visibility = "visible";
    resetRound();
}

// Event listener for keydown
window.addEventListener("keydown", handleInput);

// Function to handle player input
function handleInput(event) {
    if (gameOver)
        return;
    const keyPressed = event.key;

    // Check if both players have already chosen
    if (player1HasChosen && player2HasChosen) {
        return;
    }

    // Handle Player 1 input (A, S, D keys) only if they haven't chosen yet
    if (PLAYER_1_KEYS[keyPressed] && !player1HasChosen) {
        player1Choice = PLAYER_1_KEYS[keyPressed];
        player1ChoiceDisplayText.textContent = `Player 1: ${player1Choice}`;
        player1ChoiceDisplayImage.src = `\\static\\${player1Choice}.png`;
        player1ChoiceDisplayImage.style.visibility = "visible";
        player1HasChosen = true;
    }

    // Handle Player 2 input (Arrow keys) only if they haven't chosen yet (for multiplayer mode)
    if (isMultiplayer && PLAYER_2_KEYS[keyPressed] && !player2HasChosen) {
        player2Choice = PLAYER_2_KEYS[keyPressed];
        player2ChoiceDisplayText.textContent = `Player 2: ${player2Choice}`;
        player2ChoiceDisplayImage.src = `\\static\\${player2Choice}.png`;
        player2ChoiceDisplayImage.style.visibility = "visible";
        player2HasChosen = true;
    }

    // Handle bot choice if in vsBot mode
    if (!isMultiplayer && !player2HasChosen) {
        player2Choice = getBotChoice();
        player2ChoiceDisplayText.textContent = `Player 2 (Bot): ${player2Choice}`;
        player2ChoiceDisplayImage.src = `\\static\\${player2Choice}.png`;
        player2ChoiceDisplayImage.style.visibility = "visible";
        player2HasChosen = true;
    }

    // If both players have made their choice, start the round processing
    if (player1HasChosen && player2HasChosen) {
        clearTimeout(timeoutId);
        player1ChoiceDisplayText.textContent = `Player 1: ${player1Choice}`;
        player2ChoiceDisplayText.textContent = `Player 2: ${player2Choice}`;
        player1ChoiceDisplayImage.style.visibility = "visible";
        player2ChoiceDisplayImage.style.visibility = "visible";

        setTimeout(() => {
            const result = getGameResult(player1Choice, player2Choice);
            displayResult(result);
        }, 500); // Wait for 500ms to show the final choices before processing the result
    }
}

// Function to get bot's random choice (rock, paper, or scissors)
function getBotChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

// Function to determine the result of the game
function getGameResult(player1, player2) {
    if (player1 === player2) {
        return "tie";
    }

    switch (player1) {
        case 'rock':
            return (player2 === 'scissors') ? "Player 1 Wins!" : "Player 2 Wins!";
        case 'paper':
            return (player2 === 'rock') ? "Player 1 Wins!" : "Player 2 Wins!";
        case 'scissors':
            return (player2 === 'paper') ? "Player 1 Wins!" : "Player 2 Wins!";
    }
}

// Function to display the result and update the scores
function displayResult(result) {
    if (result === "tie") {
        resultDisplay.textContent = "It's a tie! Starting a new round...";

        // Reset round after a short delay to allow tie message to be shown
        setTimeout(() => {
            resetRound(); // Reset the round if it's a tie
        }, 1500); // Wait for 1.5 seconds before resetting the round

    } else {
        resultDisplay.textContent = result;

        // Update scores based on the result
        if (result === "Player 1 Wins!") {
            player1Score++;
            player1ScoreDisplay.textContent = `Player 1 Score: ${player1Score}`;
            isRpsGameWon = true;
        } else if (result === "Player 2 Wins!") {
            player2Score++;
            player2ScoreDisplay.textContent = `Player 2 Score: ${player2Score}`;
            isRpsGameWon = false;
        }

        if ((player1Score >= 3) || (player2Score >= 3)) {
            let message = "";
            player1Score >= 3 ? (message = "White Wins") : (message = "Black Wins");
            showAlert(message);
        }

        // Wait for 2 seconds to display the result before resetting the round
        setTimeout(() => {
            document.querySelector(".rps-overlay").style.visibility = "hidden";
            player1ChoiceDisplayImage.style.visibility = "hidden";
            player2ChoiceDisplayImage.style.visibility = "hidden";
            // isRpsGameWon = "";
        }, 2000); // Wait for 2 seconds to keep the result visible
    }
}

// Function to reset the round
function resetRound() {
    // Reset choices and flags
    player1Choice = '';
    player2Choice = '';
    player1ChoiceDisplayText.textContent = 'Player 1:';
    player2ChoiceDisplayText.textContent = 'Player 2:';
    player1ChoiceDisplayImage.style.visibility = "hidden";
    player2ChoiceDisplayImage.style.visibility = "hidden";
    isRpsGameWon = "";

    player1HasChosen = false;
    player2HasChosen = false;

    resultDisplay.textContent = 'Waiting for players to choose...';

    timeoutId = setTimeout(() => {
        if (!player1HasChosen || !player2HasChosen) {
            resetRound();
        }
    }, INPUT_TIME_WINDOW);
}

resetRound();
document.querySelector(".rps-overlay").style.visibility = "hidden";
player1ChoiceDisplayImage.style.visibility = "hidden";
player2ChoiceDisplayImage.style.visibility = "hidden";
