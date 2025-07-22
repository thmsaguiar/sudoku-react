import { useEffect, useRef, useState } from "react";
import styles from "./Home.module.scss";
import sudoku from "sudoku";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GameDialog from "../../components/GameDialog/GameDialog";

type Difficulty = "easy" | "medium" | "hard";

interface GameState {
  puzzle: (number | null)[];
  solution: (number | null)[];
  fixedCells: boolean[];
  lives: number;
  correctCounts: number[];
  selectedIndex: number | null;
  selectedNumber: number | null;
}

export default function Home() {
  // Estado único para dados do jogo
  const [gameState, setGameState] = useState<GameState>({
    puzzle: [],
    solution: [],
    fixedCells: [],
    lives: 3,
    correctCounts: Array(9).fill(0),
    selectedIndex: null,
    selectedNumber: null,
  });

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gera o puzzle
  function generatePuzzle(difficulty: Difficulty) {
    let blanks = 45;
    if (difficulty === "easy") blanks = 35;
    else if (difficulty === "hard") blanks = 55;

    const emptyPuzzle = Array(81).fill(null);
    const solved = sudoku.solvepuzzle(emptyPuzzle);

    if (!solved) {
      console.error("Erro ao gerar solução.");
      return;
    }

    const puzzleWithBlanks = [...solved];
    const indexes = [...Array(81).keys()];
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    for (let i = 0; i < blanks; i++) {
      puzzleWithBlanks[indexes[i]] = null;
    }

    const fixedCells = puzzleWithBlanks.map((cell) => cell !== null);

    // Inicializa contagem correta
    const correctCounts = Array(9).fill(0);
    puzzleWithBlanks.forEach((val, i) => {
      if (val !== null && val === solved[i]) correctCounts[val]++;
    });

    setGameState({
      puzzle: puzzleWithBlanks,
      solution: solved,
      fixedCells,
      lives: 3,
      correctCounts,
      selectedIndex: null,
      selectedNumber: null,
    });
    setTimeElapsed(0);
  }

  // Dificuldade
  useEffect(() => {
    generatePuzzle(difficulty);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused]);

  // Função para checar se dois índices estão no mesmo bloco 3x3
  function sameBlock(i1: number, i2: number) {
    const r1 = Math.floor(i1 / 9);
    const c1 = i1 % 9;
    const r2 = Math.floor(i2 / 9);
    const c2 = i2 % 9;
    return (
      Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
      Math.floor(c1 / 3) === Math.floor(c2 / 3)
    );
  }

  // Função para manipular clique em célula
  function handleCellClick(index: number) {
    setGameState((prev) => ({
      ...prev,
      selectedIndex: index,
      selectedNumber: prev.puzzle[index],
    }));
  }

  // Atualiza puzzle após input numérico
  function handleNumberInput(value: number) {
    if (gameState.lives > 0) {
      setGameState((prev) => {
        const {
          selectedIndex,
          fixedCells,
          puzzle,
          solution,
          correctCounts,
          lives,
        } = prev;
        if (selectedIndex === null) return prev;
        if (fixedCells[selectedIndex]) return prev;

        const newPuzzle = [...puzzle];
        newPuzzle[selectedIndex] = value;

        if (solution[selectedIndex] !== value) {
          // Erro: perde vida
          return {
            ...prev,
            puzzle: newPuzzle,
            lives: lives - 1,
            selectedNumber: value,
          };
        } else {
          // Valor correto: limpa duplicatas na linha, coluna e bloco
          const selectedRow = Math.floor(selectedIndex / 9);
          const selectedCol = selectedIndex % 9;

          const updatedPuzzle = newPuzzle.map((cellValue, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const isSameRow = row === selectedRow;
            const isSameCol = col === selectedCol;
            const isSameBlock = sameBlock(i, selectedIndex);

            const shouldClear =
              i !== selectedIndex &&
              (isSameRow || isSameCol || isSameBlock) &&
              cellValue === value &&
              !fixedCells[i];

            return shouldClear ? null : cellValue;
          });

          // Atualiza contagem correta
          const newCorrectCounts = Array(9).fill(0);
          updatedPuzzle.forEach((val, i) => {
            if (val !== null && val === solution[i]) newCorrectCounts[val]++;
          });

          return {
            ...prev,
            puzzle: updatedPuzzle,
            correctCounts: newCorrectCounts,
            selectedNumber: value,
          };
        }
      });
    }
  }

  // Listener teclado para digitação e apagar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const { selectedIndex, fixedCells, puzzle } = gameState;
      if (selectedIndex === null) return;
      if (fixedCells[selectedIndex]) return;

      if (e.key >= "1" && e.key <= "9") {
        const value = parseInt(e.key) - 1;
        handleNumberInput(value);
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        setGameState((prev) => {
          const newPuzzle = [...prev.puzzle];
          newPuzzle[prev.selectedIndex!] = null;
          return {
            ...prev,
            puzzle: newPuzzle,
            selectedNumber: null,
          };
        });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Limpar células não fixas
  function clearAll() {
    setGameState((prev) => {
      const newPuzzle = prev.puzzle.map((cell, idx) =>
        prev.fixedCells[idx] ? cell : null
      );
      return { ...prev, puzzle: newPuzzle };
    });
  }

  // Apagar célula selecionada
  function handleErase() {
    setGameState((prev) => {
      const { selectedIndex, fixedCells, puzzle } = prev;
      if (selectedIndex === null) return prev;
      if (fixedCells[selectedIndex]) return prev;

      const newPuzzle = [...puzzle];
      newPuzzle[selectedIndex] = null;
      return {
        ...prev,
        puzzle: newPuzzle,
        selectedNumber: null,
      };
    });
  }

  // Verifica se o jogador perdeu todas vidas e reinicia
  useEffect(() => {
    if (gameState.lives <= 0) {
      setShowGameOver(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [gameState.lives]);

  // Vitória
  useEffect(() => {
    const allCorrect =
      gameState.puzzle.length === 81 &&
      gameState.puzzle.every(
        (val, i) => val !== null && val === gameState.solution[i]
      );

    if (allCorrect) {
      setShowVictory(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [gameState.puzzle]);

  // Formatação do tempo
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  // Alternar pausa
  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  //Reiniciar jogo GameOver
  const handleRestart = () => {
    generatePuzzle(difficulty);
    setShowGameOver(false);
    setShowVictory(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
  };

  return (
    <div className={styles.content}>
      <div className={styles.container}>
        <div>
          <label htmlFor="difficulty">Dificuldade: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="easy">Fácil</option>
            <option value="medium">Média</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        <div>
          <div style={{ position: "relative" }}>
            <div style={{ alignSelf: "flex-start" }}>
              <div className={styles.grid}>
                {gameState.puzzle.map((cell, index) => {
                  const row = Math.floor(index / 9);
                  const col = index % 9;
                  const displayNumber = cell !== null ? cell + 1 : "";
                  const isHovered =
                    hoveredIndex !== null &&
                    (Math.floor(hoveredIndex / 9) === row ||
                      hoveredIndex % 9 === col ||
                      sameBlock(index, hoveredIndex));
                  const isFixed = gameState.fixedCells[index];
                  const isSelectedCell = gameState.selectedIndex === index;
                  const isSameNumberSelected =
                    gameState.selectedNumber !== null &&
                    cell === gameState.selectedNumber &&
                    index !== gameState.selectedIndex;
                  const isWrong =
                    !isFixed &&
                    cell !== null &&
                    gameState.solution.length > 0 &&
                    gameState.solution[index] !== cell;

                  return (
                    <div
                      key={index}
                      className={styles.cell}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => handleCellClick(index)}
                      style={{
                        borderTop:
                          row % 3 === 0 ? "3px solid gray" : "1px solid gray",
                        borderLeft:
                          col % 3 === 0 ? "3px solid gray" : "1px solid gray",
                        borderRight: col === 8 ? "3px solid gray" : "",
                        borderBottom: row === 8 ? "3px solid gray" : "",
                        color: isWrong ? "#441111" : "white",
                        backgroundColor: isPaused
                          ? "#212121"
                          : isSelectedCell
                          ? "#4c7cffb4"
                          : isWrong
                          ? "#8d4f4f80"
                          : isSameNumberSelected
                          ? "#aabfff"
                          : isHovered
                          ? "#21212144"
                          : isFixed
                          ? "#1a1a1a"
                          : "#212121",
                        cursor: isFixed ? "default" : "pointer",
                      }}
                    >
                      {!isPaused ? displayNumber : ""}
                    </div>
                  );
                })}
              </div>
            </div>
            {isPaused && (
              <div className={styles.pauseOverlay} onClick={togglePause}>
                <button className={styles.playButton}>▶</button>
              </div>
            )}
          </div>
          <div
            id="lifePoints"
            style={{ marginTop: "1rem", fontSize: "1.5rem" }}
          >
            {[...Array(gameState.lives)].map((_, i) => (
              <FavoriteIcon
                key={i}
                sx={{ color: "red", marginRight: "0.25rem" }}
              />
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "1.2rem",
              color: "white",
            }}
          >
            Tempo: {formatTime(timeElapsed)}{" "}
            <button onClick={togglePause}>{isPaused ? "▶︎" : "||"}</button>
          </div>

          <button
            onClick={clearAll}
            disabled={!isPaused}
            style={{
              opacity: isPaused ? 0.4 : 1,
              cursor: isPaused ? "not-allowed" : "pointer",
            }}
          >
            Limpar tudo
          </button>
          <button
            onClick={handleErase}
            disabled={!isPaused}
            style={{
              opacity: isPaused ? 0.4 : 1,
              cursor: isPaused ? "not-allowed" : "pointer",
            }}
          >
            Apagar
          </button>

          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, auto)",
              gap: "0.25rem",
            }}
          >
            {[...Array(9)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleNumberInput(i)}
                disabled={gameState.correctCounts[i] >= 9 || isPaused}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                  opacity:
                    gameState.correctCounts[i] >= 9 || isPaused ? 0.4 : 1,
                  cursor:
                    gameState.correctCounts[i] >= 9 || isPaused
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <GameDialog
        open={showGameOver || showVictory}
        onRestart={handleRestart}
        title={showGameOver ? "Game Over" : "Você conseguiu!!"}
        subtitle={
          showGameOver
            ? "Você perdeu todas as vidas. Deseja reiniciar o jogo?"
            : "Deseja começar um novo jogo?"
        }
        btnlabel={showGameOver ? "Reiniciar" : "Novo jogo"}
      />
    </div>
  );
}
