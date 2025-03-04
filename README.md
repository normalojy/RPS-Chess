# RPS-Chesss
Web-based application that incorporated Rock Paper Scissors into Chess.

#### **Key Features**
The application includes the features listed down below.

1. **Chess Mechanics:** Standard 8x8 chess board, with simple movements, check and checkmate. The chess mechanic is not completed in this project, such as castling, en passant, and draw rules.
2. **RPS Integration:** Capturing an opponent's piece requires winning a quick RPS game.
3. **Multiplayer Mode:** Locally playing against another human player.
4. **Single Player VS Bot Mode:** Single mode playing against a simple AI bot.
5. **Interactive UI:** Drag-and-drop interface for moving pieces.
6. **Responsive Design:** Works well on different screen sizes.

#### **Basic Rules**
1. **Setup:**
    - Open the game in your web browser.
    - Select the game mode. (Multiplayer or VS Bot)

2. **Making Moves:**
    - Drag your pieces to desired squares.
    - If moving to a legal square with opponent's piece, RPS game starts.
3. **RPS Game:**
    - Choose Rock, Paper, or Scissors.
    - Keyboard Input using a, s, d and arrow left, down, right, for player 1 (white) or player 2 (bot) respectively.
    - Winning the RPS game captures the opponent's piece.
    - Losing the RPS game means the move is invalid, and no capture happens, turn ends.
    - Drawing the RPS game will repeat the RPS game until win or lose.
    - The player winning the RPS game will increment their score by one point.

#### **Special Conditions**
- **Check and Checkmate:**
    - Standard rules for check and checkmate apply.
    - You cannot move your king into check.
- **Win Conditions:**
    - A win will trigger when any player's score reaches 25.
- **Limitations:**
    - The game will freeze if the bot runs out of moves on its turn.
    - Mechanics such as castling, en passant, pawn promotions are not implemented.
    - Draw, stalemate, drawn by repetitions, insufficient materials, and others are not implemented.

#### **Files**
Inside the static folder, includes the images used in the project, including the .svg files for chess pieces, .png files for rock paper scissors, etc.
