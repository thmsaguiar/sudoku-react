import { useEffect, useState } from "react";
import styles from "./Home.module.scss";
import sudoku from "sudoku";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function Home() {
  const [puzzle, setPuzzle] = useState<(number | null)[]>([]);
  const [solution, setSolution] = useState<(number | null)[]>([]);
  const [difficult, setDifficult] = useState<"easy" | "medium" | "hard">("medium");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [fixedCells, setFixedCells] = useState<boolean[]>([]);
  const [lives, setLives] = useState(4);

  function generatePuzzle(difficulty: "easy" | "medium" | "hard") {
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

    setPuzzle(puzzleWithBlanks);
    setSolution(solved);
    setSelectedIndex(null);
    setSelectedNumber(null);
    setFixedCells(puzzleWithBlanks.map((cell) => cell !== null));
    setLives(3); // resetar vidas
  }

  useEffect(() => {
    generatePuzzle(difficult);
  }, [difficult]);

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

  function handleCellClick(index: number) {
    setSelectedIndex(index);
    const num = puzzle[index];
    setSelectedNumber(num);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIndex === null) return;
      if (fixedCells[selectedIndex]) return;

      const newPuzzle = [...puzzle];

      if (e.key >= "1" && e.key <= "9") {
        const value = parseInt(e.key) - 1;
        newPuzzle[selectedIndex] = value;
        setPuzzle(newPuzzle);
        setSelectedNumber(value);

        if (solution[selectedIndex] !== value) {
          setLives((prev) => {
            const updated = prev - 1;
            if (updated <= 0) alert("Game Over!");
            return updated;
          });
        }
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        newPuzzle[selectedIndex] = null;
        setPuzzle(newPuzzle);
        setSelectedNumber(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, puzzle, solution, fixedCells]);

  function clearAll() {
    const newPuzzle = [...puzzle];
    newPuzzle.forEach((_, index) => {
      if (!fixedCells[index]) newPuzzle[index] = null;
    });
    setPuzzle(newPuzzle);
  }



  return (
    <div>
      <h1>Sudoku</h1>

      <label htmlFor="difficulty">Dificuldade: </label>
      <select
        id="difficulty"
        value={difficult}
        onChange={(e) =>
          setDifficult(e.target.value as "easy" | "medium" | "hard")
        }
      >
        <option value="easy">Fácil</option>
        <option value="medium">Médio</option>
        <option value="hard">Difícil</option>
      </select>

      <button onClick={() => generatePuzzle(difficult)}>Novo jogo</button>
      <button onClick={clearAll}>Limpar tudo</button>

      <div className={styles.grid}>
        {puzzle.map((cell, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const displayNumber = cell !== null ? cell + 1 : "";
          const isHovered =
            hoveredIndex !== null &&
            (Math.floor(hoveredIndex / 9) === row ||
              hoveredIndex % 9 === col ||
              sameBlock(index, hoveredIndex));
          const isFixed = fixedCells[index];
          const isSelectedCell = selectedIndex === index;
          const isSameNumberSelected =
            selectedNumber !== null &&
            cell === selectedNumber &&
            index !== selectedIndex;
          const isWrong =
            !isFixed &&
            cell !== null &&
            solution.length > 0 &&
            solution[index] !== cell;

          return (
            <div
              key={index}
              className={styles.cell}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleCellClick(index)}
              style={{
                borderTop: row % 3 === 0 ? "2px solid gray" : "1px solid gray",
                borderLeft: col % 3 === 0 ? "2px solid gray" : "1px solid gray",
                borderRight: col === 8 ? "2px solid gray" : "",
                borderBottom: row === 8 ? "2px solid gray" : "",
                color: isWrong ? "#441111" : "white",
                backgroundColor: isSelectedCell
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
              }}
            >
              {displayNumber}
            </div>
          );
        })}
      </div>

      {/* vidas */}
      <div id="lifePoints" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>
        {[...Array(lives)].map((_, i) => (
          <FavoriteIcon key={i} sx={{ color: "red", marginRight: "0.25rem" }} />
        ))}
      </div>
    </div>
  );
}
