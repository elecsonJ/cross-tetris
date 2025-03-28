// --- 게임 설정 및 상수 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
// const directionElement = document.getElementById('direction'); // Direction UI 제거
const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';
const CYAN = 'rgb(0, 255, 255)';
const BLUE = 'rgb(0, 0, 255)';
const ORANGE = 'rgb(255, 165, 0)';
const YELLOW = 'rgb(255, 255, 0)';
const GREEN = 'rgb(0, 255, 0)';
const PURPLE = 'rgb(128, 0, 128)';
const RED = 'rgb(255, 0, 0)';
const GRAY = 'rgb(128, 128, 128)';
const GHOST_COLOR = 'rgba(255, 255, 255, 0.3)';
const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;
const DIRECTIONS = ["North", "East", "South", "West"];
const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 950;
const GRID_SIZE = 15;
const SECTOR_WIDTH = 25;
const SECTOR_HEIGHT = 25;
const CENTER_SIZE = 10;
const GRID_WIDTH = CENTER_SIZE + SECTOR_WIDTH * 2;
const GRID_HEIGHT = CENTER_SIZE + SECTOR_HEIGHT * 2;
const CENTER_X_START = SECTOR_WIDTH;
const CENTER_X_END = CENTER_X_START + CENTER_SIZE;
const CENTER_Y_START = SECTOR_HEIGHT;
const CENTER_Y_END = CENTER_Y_START + CENTER_SIZE;
const SIDEBAR_WIDTH = 250;
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]] // Z
];
const SHAPE_COLORS = [CYAN, PURPLE, ORANGE, BLUE, YELLOW, GREEN, RED];
const SECTOR_COLORS = ['rgb(20, 20, 40)', 'rgb(20, 40, 20)', 'rgb(40, 20, 20)', 'rgb(30, 30, 10)']; // N, E, S, W
const CENTER_COLOR = 'rgb(40, 40, 40)';
canvas.width = SCREEN_WIDTH - SIDEBAR_WIDTH;
canvas.height = SCREEN_HEIGHT;
const TOTAL_GRID_PIXEL_WIDTH = GRID_WIDTH * GRID_SIZE;
const TOTAL_GRID_PIXEL_HEIGHT = GRID_HEIGHT * GRID_SIZE;
const gridStartX = Math.floor((canvas.width - TOTAL_GRID_PIXEL_WIDTH) / 2);
const gridStartY = Math.floor((canvas.height - TOTAL_GRID_PIXEL_HEIGHT) / 2);

// --- 게임 상태 변수 ---
let board;
let score;
let level;
let linesCleared;
let gameOver;
let paused;
let currentShape;
let currentShapeIndex;
let currentColor;
let currentX;
let currentY;
let currentDirection;
let lastMoveDownTime;
let moveDownSpeed;
let lastTime = 0;
let gameLoopId = null;

// --- 핵심 로직 함수 ---

/** 게임 레벨에 따른 블록 하강 속도 계산 */
function calculateMoveSpeed(currentLevel) {
    const speed = Math.max(100, 800 - (currentLevel - 1) * 100);
    // console.log(`[DEBUG] Level ${currentLevel} speed: ${speed}ms`);
    return speed;
}

/** 게임 상태 초기화 */
function resetGame() {
    console.log("[DEBUG] resetGame 시작");
    board = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = false;
    paused = false;
    lastMoveDownTime = Date.now();
    moveDownSpeed = calculateMoveSpeed(level);
    createNewTetromino(); // 새 블록 생성 먼저 호출
    updateSidebar();
    // 메시지 오버레이 제거
    const existingOverlay = document.querySelector('.message-overlay');
    if (existingOverlay && existingOverlay.parentNode) {
        try {
            existingOverlay.parentNode.removeChild(existingOverlay);
        } catch (e) {
            console.error("Error removing overlay:", e);
        }
    }
    console.log("[DEBUG] resetGame 완료");
}

/** 새로운 테트로미노 생성 */
function createNewTetromino() {
    console.log("[DEBUG] createNewTetromino 시작");
    currentShapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentShape = JSON.parse(JSON.stringify(SHAPES[currentShapeIndex])); // Deep copy
    currentColor = SHAPE_COLORS[currentShapeIndex];
    const shapeWidth = currentShape[0].length;
    const shapeHeight = currentShape.length;

    // 생성 위치: 그리드 중앙 기준
    const centerGridX = CENTER_X_START + Math.floor(CENTER_SIZE / 2);
    const centerGridY = CENTER_Y_START + Math.floor(CENTER_SIZE / 2);
    currentX = centerGridX - Math.floor(shapeWidth / 2);
    currentY = centerGridY - Math.floor(shapeHeight / 2);

    // 생성 시 낙하 방향 랜덤 설정
    currentDirection = Math.floor(Math.random() * 4);

    console.log(`[DEBUG] 새 테트로미노 생성: index=${currentShapeIndex}, Pos: (${currentX}, ${currentY}), Falling Dir: ${DIRECTIONS[currentDirection]}`);

    // 생성 직후 충돌 검사 -> 게임 오버 조건
    if (checkCollision(currentX, currentY, currentShape)) {
        console.warn(`[WARN] 새 블록 생성 직후 충돌 감지됨! at (${currentX}, ${currentY}). 게임 오버 설정.`);
        gameOver = true;
        currentShape = null; // 게임 오버 시 현재 블록 제거
    }

    updateSidebar(); // 방향 표시 업데이트 등 (Direction 제거됨)
    console.log("[DEBUG] createNewTetromino 완료");
}

/**
 * 지정된 위치에 모양이 충돌하는지 확인 (물리적 경계 및 기존 블록)
 * @param {number} xPos - 확인할 X 좌표
 * @param {number} yPos - 확인할 Y 좌표
 * @param {Array<Array<number>>} shape - 확인할 모양 배열
 * @returns {boolean} 충돌하면 true, 아니면 false
 */
function checkCollision(xPos, yPos, shape) {
    if (!shape) return true; // 모양이 없으면 충돌로 간주 (오류 방지)
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) { // 모양의 블록 부분만 검사
                const boardX = xPos + c;
                const boardY = yPos + r;
                // 1. 그리드 경계 확인
                if (boardX < 0 || boardX >= GRID_WIDTH || boardY < 0 || boardY >= GRID_HEIGHT) {
                    // console.log(`[DEBUG] Collision: Out of bounds at (${boardX}, ${boardY})`);
                    return true;
                }

                // 2. 보드 위 다른 블록과 충돌 확인
                // board[boardY]가 존재하는지 먼저 확인 (Y 경계 초과 방지)
                if (board[boardY] && board[boardY][boardX] !== 0) {
                    // console.log(`[DEBUG] Collision: Block exists at (${boardX}, ${boardY}) value: ${board[boardY][boardX]}`);
                    return true;
                }
            }
        }
    }
    return false; // 충돌 없음
}

/**
 * 주어진 좌표가 현재 낙하 방향에 대해 유효한 이동 영역 내에 있는지 확인 (calculatePushBack 내부에서 사용됨)
 * @param {number} x - 확인할 보드 X 좌표
 * @param {number} y - 확인할 보드 Y 좌표
 * @param {number} direction - 현재 낙하 방향 (NORTH, EAST, SOUTH, WEST)
 * @returns {boolean} 유효 영역 내에 있으면 true, 아니면 false
 */
function isWithinAllowedMoveArea(x, y, direction) {
    const inCenter = (x >= CENTER_X_START && x < CENTER_X_END && y >= CENTER_Y_START && y < CENTER_Y_END);
    if (inCenter) return true; // 중앙 영역은 항상 허용

    switch (direction) {
        case NORTH: // 북쪽 섹터 + 중앙 (Y축 제한 확인)
            return (x >= CENTER_X_START && x < CENTER_X_END && y >= 0 && y < CENTER_Y_END);
        case EAST:  // 동쪽 섹터 + 중앙 (X축 제한 확인)
            return (y >= CENTER_Y_START && y < CENTER_Y_END && x >= CENTER_X_START && x < GRID_WIDTH);
        case SOUTH: // 남쪽 섹터 + 중앙 (Y축 제한 확인)
            return (x >= CENTER_X_START && x < CENTER_X_END && y >= CENTER_Y_START && y < GRID_HEIGHT);
        case WEST:  // 서쪽 섹터 + 중앙 (X축 제한 확인)
            return (y >= CENTER_Y_START && y < CENTER_Y_END && x >= 0 && x < CENTER_X_END);
        default:
            // console.error("[ERROR] Invalid direction in isWithinAllowedMoveArea:", direction); // calculatePushBack에서 호출되므로 에러 로깅 제거
            return false;
    }
}

/**
 * 주어진 위치와 모양에 대해 이동/회전 제한 영역을 벗어나는지 확인하고,
 * 벗어난 경우 안으로 밀어넣어야 할 거리를 계산합니다.
 * @param {number} xPos - 확인할 X 좌표
 * @param {number} yPos - 확인할 Y 좌표
 * @param {Array<Array<number>>} shape - 확인할 모양 배열
 * @param {number} direction - 현재 낙하 방향
 * @returns {{pushX: number, pushY: number, needsPush: boolean}} - 밀어야 할 거리 및 필요 여부
 */
function calculatePushBack(xPos, yPos, shape, direction) {
    let maxOverLeft = 0;
    let maxOverRight = 0;
    let maxOverTop = 0;
    let maxOverBottom = 0;
    let needsPush = false;

    if (!shape) return { pushX: 0, pushY: 0, needsPush: false };

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const boardX = xPos + c;
                const boardY = yPos + r;

                // isWithinAllowedMoveArea를 직접 호출하는 대신 로직을 여기에 통합하여 최적화
                const inCenter = (boardX >= CENTER_X_START && boardX < CENTER_X_END && boardY >= CENTER_Y_START && boardY < CENTER_Y_END);
                if (inCenter) continue; // 중앙은 항상 허용

                let allowed = true;
                let overLeft = 0, overRight = 0, overTop = 0, overBottom = 0;

                switch (direction) {
                    case NORTH:
                        if (boardY < 0) overTop = 0 - boardY;
                        if (boardX < CENTER_X_START) overLeft = CENTER_X_START - boardX;
                        else if (boardX >= CENTER_X_END) overRight = boardX - (CENTER_X_END - 1);
                        // 북쪽은 아래쪽(CENTER_Y_END) 경계는 없음 (중앙으로 들어오므로)
                        if (overTop > 0 || overLeft > 0 || overRight > 0) allowed = false;
                        break;
                    case EAST:
                        if (boardX < CENTER_X_START) overLeft = CENTER_X_START - boardX; // 센터 왼쪽으로 넘어가면
                        else if (boardX >= GRID_WIDTH) overRight = boardX - (GRID_WIDTH - 1); // 그리드 오른쪽으로 넘어가면
                        if (boardY < CENTER_Y_START) overTop = CENTER_Y_START - boardY;
                        else if (boardY >= CENTER_Y_END) overBottom = boardY - (CENTER_Y_END - 1);
                        if (overLeft > 0 || overRight > 0 || overTop > 0 || overBottom > 0) allowed = false;
                        break;
                    case SOUTH:
                        if (boardY < CENTER_Y_START) overTop = CENTER_Y_START - boardY; // 센터 위쪽으로 넘어가면
                        else if (boardY >= GRID_HEIGHT) overBottom = boardY - (GRID_HEIGHT - 1); // 그리드 아래쪽으로 넘어가면
                        if (boardX < CENTER_X_START) overLeft = CENTER_X_START - boardX;
                        else if (boardX >= CENTER_X_END) overRight = boardX - (CENTER_X_END - 1);
                        if (overTop > 0 || overBottom > 0 || overLeft > 0 || overRight > 0) allowed = false;
                        break;
                    case WEST:
                        if (boardX < 0) overLeft = 0 - boardX; // 그리드 왼쪽으로 넘어가면
                        // 서쪽은 오른쪽(CENTER_X_END) 경계는 없음 (중앙으로 들어오므로)
                        if (boardY < CENTER_Y_START) overTop = CENTER_Y_START - boardY;
                        else if (boardY >= CENTER_Y_END) overBottom = boardY - (CENTER_Y_END - 1);
                        if (overLeft > 0 || overTop > 0 || overBottom > 0) allowed = false;
                        break;
                }

                if (!allowed) {
                    needsPush = true;
                    maxOverLeft = Math.max(maxOverLeft, overLeft);
                    maxOverRight = Math.max(maxOverRight, overRight);
                    maxOverTop = Math.max(maxOverTop, overTop);
                    maxOverBottom = Math.max(maxOverBottom, overBottom);
                }
            }
        }
    }

    const pushX = maxOverLeft - maxOverRight;
    const pushY = maxOverTop - maxOverBottom;

    // 디버깅 로그
    // if (needsPush) {
    //     console.log(`[DEBUG] calculatePushBack at (${xPos}, ${yPos}), Dir: ${DIRECTIONS[direction]}: Needs push. Over L/R/T/B: ${maxOverLeft}/${maxOverRight}/${maxOverTop}/${maxOverBottom} -> Push (${pushX}, ${pushY})`);
    // }

    return { pushX, pushY, needsPush };
}


/** 테트로미노 회전 (오른쪽으로 90도) 및 Wall Kick, Push Back 적용 */
function rotateTetromino() {
    if (paused || gameOver || !currentShape) return;
    console.log("[DEBUG] rotateTetromino 시도");

    const originalShape = currentShape;
    const rows = originalShape.length;
    const cols = originalShape[0].length;
    const newShape = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            newShape[c][rows - 1 - r] = originalShape[r][c];
        }
    }

    const kicks = [
        { x: 0, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1}, { x: 0, y: 1 },
        { x: -2, y: 0 }, { x: 2, y: 0 } // 추가 킥 옵션
    ];

    for (const kick of kicks) {
        const kickedX = currentX + kick.x;
        const kickedY = currentY + kick.y;
        // console.log(`[DEBUG]   Trying Kick: (${kick.x}, ${kick.y}) -> Kicked Pos: (${kickedX}, ${kickedY})`);

        // 1. 킥 적용 위치에서 물리적 충돌 검사
        if (!checkCollision(kickedX, kickedY, newShape)) {
            // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}): Collision Check PASSED.`);

            // 2. 킥 적용 위치에서 영역 초과 검사 및 푸시백 계산
            const { pushX, pushY, needsPush } = calculatePushBack(kickedX, kickedY, newShape, currentDirection);

            let finalX = kickedX;
            let finalY = kickedY;

            if (needsPush) {
                // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}) requires push (${pushX}, ${pushY}) from kicked (${kickedX}, ${kickedY})`);
                finalX += pushX;
                finalY += pushY;

                // 3. 푸시백 적용된 최종 위치에서 다시 물리적 충돌 검사
                if (checkCollision(finalX, finalY, newShape)) {
                    // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}): Push back to (${finalX}, ${finalY}) resulted in collision. Trying next kick.`);
                    continue; // 푸시백 후 충돌하면 이 킥은 실패, 다음 킥 시도
                }
                // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}): Push back applied. Final position: (${finalX}, ${finalY})`);
            } else {
                // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}): Rotation is within allowed area. No push needed.`);
            }

            // 4. 모든 검사 통과 시 최종 위치 및 모양 적용
            currentX = finalX;
            currentY = finalY;
            currentShape = newShape;
            console.log(`[DEBUG] Rotate success with kick (${kick.x}, ${kick.y}) and push (${pushX}, ${pushY})`);
            return; // 회전 성공!

        } else {
            // console.log(`[DEBUG]     Kick (${kick.x}, ${kick.y}): Collision Check FAILED.`);
        }
    } // end for loop (kicks)

    console.log("[DEBUG] Rotate failed (all kicks tried or pushed into collision).");
}


/**
 * 현재 테트로미노를 보드에 병합 (고정)
 */
function mergeTetromino() {
    if (!currentShape) {
        console.log("[DEBUG] mergeTetromino: No current shape, returning early.");
        return;
    }
    console.log(`[DEBUG] === mergeTetromino START at (${currentX}, ${currentY}) Shape Index: ${currentShapeIndex} ===`);
    // console.log("[DEBUG]   Shape to merge:", JSON.stringify(currentShape));
    // console.log("[DEBUG]   Current Color:", currentColor);

    for (let r = 0; r < currentShape.length; r++) {
        for (let c = 0; c < currentShape[r].length; c++) {
            const boardX = currentX + c;
            const boardY = currentY + r;

            if (boardX < 0 || boardX >= GRID_WIDTH || boardY < 0 || boardY >= GRID_HEIGHT) {
                continue;
            }

            if (currentShape[r][c]) {
                // console.log(`[DEBUG]     Block part FOUND. Merging color '${currentColor}' into board[${boardY}][${boardX}]`);
                if (board[boardY][boardX] === 0) { // 빈 곳에만 병합 (덮어쓰기 방지 강화)
                    board[boardY][boardX] = currentColor;
                     // 확인 로그 (필요시 사용)
                     // const newValue = board[boardY][boardX];
                     // if (newValue !== currentColor) {
                     //      console.error(`[CRITICAL ERROR] board[${boardY}][${boardX}] FAILED TO UPDATE! Expected '${currentColor}', but got '${newValue}'!`);
                     // }
                } else {
                    console.warn(`[WARN] mergeTetromino: Attempted to merge onto existing block at (${boardX}, ${boardY}). Value: ${board[boardY][boardX]}`);
                    // 게임 오버 조건 강화 가능: 병합 시 충돌하면 즉시 게임 오버
                    // gameOver = true;
                    // return;
                }
            }
        }
    }
    console.log("[DEBUG] === mergeTetromino END ===");
    currentShape = null;
    clearLines();
    if (!gameOver) { // 게임 오버가 아니라면 새 블록 생성
        createNewTetromino();
    }
}

/**
 * 완성된 라인/컬럼을 찾아 지우고 압축 (바깥쪽으로)
 */
function clearLines() {
    // console.log("--- clearLines 함수 시작됨 (바깥쪽으로 압축) ---");
    let totalLinesClearedThisTurn = 0;
    let linesToClear = { north: [], east: [], south: [], west: [] };
    const lineLength = CENTER_SIZE;

    // 1. 클리어 대상 식별
    // North
    for (let y = 0; y < CENTER_Y_START; y++) { let isFull = true; for (let x = CENTER_X_START; x < CENTER_X_START + lineLength; x++) { if (!board[y] || x >= GRID_WIDTH || board[y][x] === 0) { isFull = false; break; } } if (isFull) { linesToClear.north.push(y); } }
    // East
    for (let x = CENTER_X_END; x < GRID_WIDTH; x++) { let isFull = true; for (let y = CENTER_Y_START; y < CENTER_Y_START + lineLength; y++) { if (!board[y] || y >= GRID_HEIGHT || board[y][x] === 0) { isFull = false; break; } } if (isFull) { linesToClear.east.push(x); } }
    // South
    for (let y = CENTER_Y_END; y < GRID_HEIGHT; y++) { let isFull = true; for (let x = CENTER_X_START; x < CENTER_X_START + lineLength; x++) { if (!board[y] || x >= GRID_WIDTH || board[y][x] === 0) { isFull = false; break; } } if (isFull) { linesToClear.south.push(y); } }
    // West
    for (let x = 0; x < CENTER_X_START; x++) { let isFull = true; for (let y = CENTER_Y_START; y < CENTER_Y_START + lineLength; y++) { if (!board[y] || y >= GRID_HEIGHT || board[y][x] === 0) { isFull = false; break; } } if (isFull) { linesToClear.west.push(x); } }

    totalLinesClearedThisTurn = linesToClear.north.length + linesToClear.east.length + linesToClear.south.length + linesToClear.west.length;

    // 2. 라인 클리어 및 압축
    if (totalLinesClearedThisTurn > 0) {
        console.log(`[DEBUG] 클리어 라인 감지 (N: ${linesToClear.north.length}, E: ${linesToClear.east.length}, S: ${linesToClear.south.length}, W: ${linesToClear.west.length})`);

        // 북쪽 (위쪽 y=0 으로 압축)
        if (linesToClear.north.length > 0) {
            // console.log("[DEBUG] Compacting North");
            for (let x = CENTER_X_START; x < CENTER_X_START + lineLength; x++) {
                let writeY = 0;
                for (let readY = 0; readY < CENTER_Y_START; readY++) {
                    if (!linesToClear.north.includes(readY)) {
                        if (writeY !== readY) board[writeY][x] = board[readY][x];
                        writeY++;
                    }
                }
                while (writeY < CENTER_Y_START) { board[writeY][x] = 0; writeY++; }
            }
        }
        // 동쪽 (오른쪽 x=GRID_WIDTH-1 으로 압축)
        if (linesToClear.east.length > 0) {
            // console.log("[DEBUG] Compacting East");
            for (let y = CENTER_Y_START; y < CENTER_Y_START + lineLength; y++) {
                let writeX = GRID_WIDTH - 1;
                for (let readX = GRID_WIDTH - 1; readX >= CENTER_X_END; readX--) {
                    if (!linesToClear.east.includes(readX)) {
                         if (writeX !== readX) board[y][writeX] = board[y][readX];
                         writeX--;
                    }
                }
                while (writeX >= CENTER_X_END) { board[y][writeX] = 0; writeX--; }
            }
        }
        // 남쪽 (아래쪽 y=GRID_HEIGHT-1 으로 압축)
        if (linesToClear.south.length > 0) {
            // console.log("[DEBUG] Compacting South");
             for (let x = CENTER_X_START; x < CENTER_X_START + lineLength; x++) {
                 let writeY = GRID_HEIGHT - 1;
                 for (let readY = GRID_HEIGHT - 1; readY >= CENTER_Y_END; readY--) {
                     if (!linesToClear.south.includes(readY)) {
                         if (writeY !== readY) board[writeY][x] = board[readY][x];
                         writeY--;
                     }
                 }
                 while (writeY >= CENTER_Y_END) { board[writeY][x] = 0; writeY--; }
             }
        }
        // 서쪽 (왼쪽 x=0 으로 압축)
        if (linesToClear.west.length > 0) {
            // console.log("[DEBUG] Compacting West");
            for (let y = CENTER_Y_START; y < CENTER_Y_START + lineLength; y++) {
                let writeX = 0;
                for (let readX = 0; readX < CENTER_X_START; readX++) {
                     if (!linesToClear.west.includes(readX)) {
                         if (writeX !== readX) board[y][writeX] = board[y][readX];
                         writeX++;
                     }
                }
                while (writeX < CENTER_X_START) { board[y][writeX] = 0; writeX++; }
            }
        }

        // 점수 및 레벨 업데이트
        linesCleared += totalLinesClearedThisTurn;
        score += 100 * totalLinesClearedThisTurn * level;
        level = Math.floor(linesCleared / 10) + 1;
        moveDownSpeed = calculateMoveSpeed(level);
        updateSidebar();
        return true;
    } else {
        return false;
    }
}

/**
 * 테트로미노 이동 시도 (푸시백 로직 포함)
 * @param {number} dx - X 이동량
 * @param {number} dy - Y 이동량
 * @returns {boolean} 이동 성공 여부
 */
function moveTetromino(dx, dy) {
    if (paused || gameOver || !currentShape) return false;

    const targetX = currentX + dx;
    const targetY = currentY + dy;

    // 1. 목표 위치에서 물리적 충돌 검사
    if (!checkCollision(targetX, targetY, currentShape)) {
        // 2. 목표 위치에서 영역 초과 검사 및 푸시백 계산
        const { pushX, pushY, needsPush } = calculatePushBack(targetX, targetY, currentShape, currentDirection);

        let finalX = targetX;
        let finalY = targetY;

        if (needsPush) {
            // console.log(`[DEBUG] Move requires push (${pushX}, ${pushY}) from target (${targetX}, ${targetY})`);
            finalX += pushX;
            finalY += pushY;

            // 3. 푸시백 적용된 최종 위치에서 다시 물리적 충돌 검사
            if (checkCollision(finalX, finalY, currentShape)) {
                // console.log(`[DEBUG] Push back to (${finalX}, ${finalY}) resulted in collision. Move failed.`);
                // 푸시백 했는데도 충돌하면 이동 실패.
                // 특히, 낙하 방향 이동 시 이 실패는 merge를 유발해야 함.
                // 아래 else 블록의 로직을 여기서도 수행하도록 수정.
                let isFallingMoveAttempt = false;
                if (currentDirection === NORTH && dy < 0) isFallingMoveAttempt = true;
                if (currentDirection === EAST  && dx > 0) isFallingMoveAttempt = true;
                if (currentDirection === SOUTH && dy > 0) isFallingMoveAttempt = true;
                if (currentDirection === WEST  && dx < 0) isFallingMoveAttempt = true;

                if (isFallingMoveAttempt) {
                    console.log(`[DEBUG] Falling move (after push) failed due to collision at (${finalX}, ${finalY}). Merging piece.`);
                    mergeTetromino();
                }
                return false; // 이동 실패
            }
            // console.log(`[DEBUG] Push back applied. Final position: (${finalX}, ${finalY})`);
        } else {
            // console.log(`[DEBUG] Move to (${targetX}, ${targetY}) is within allowed area. No push needed.`);
        }

        // 4. 모든 검사 통과 시 최종 위치로 이동 적용
        currentX = finalX;
        currentY = finalY;
        return true; // 이동 성공

    } else { // 물리적 충돌 발생 시 (원래 로직 유지)
        let isFallingMoveAttempt = false;
        if (currentDirection === NORTH && dy < 0) isFallingMoveAttempt = true;
        if (currentDirection === EAST  && dx > 0) isFallingMoveAttempt = true;
        if (currentDirection === SOUTH && dy > 0) isFallingMoveAttempt = true;
        if (currentDirection === WEST  && dx < 0) isFallingMoveAttempt = true;

        if (isFallingMoveAttempt) {
            console.log(`[DEBUG] Falling move failed due to collision at (${targetX}, ${targetY}). Merging piece.`);
            mergeTetromino();
        }
        return false; // 이동 실패 (충돌)
    }
}

/** 현재 낙하 방향으로 한 칸 이동 시도 */
function moveInFallingDirection() {
    if (paused || gameOver || !currentShape) return false;

    let dx = 0, dy = 0;
    if      (currentDirection === NORTH) dy = -1;
    else if (currentDirection === EAST)  dx = 1;
    else if (currentDirection === SOUTH) dy = 1;
    else if (currentDirection === WEST)  dx = -1;

    const moved = moveTetromino(dx, dy); // moveTetromino가 실패 시 내부에서 merge 처리
    lastMoveDownTime = Date.now(); // 이동 시도(성공/실패/병합 포함) 후 시간 갱신
    return moved;
}

/** 테트로미노를 현재 낙하 방향으로 끝까지 떨어뜨리고 병합 */
function dropTetromino() {
    if (paused || gameOver || !currentShape) return;
    console.log("[DEBUG] dropTetromino 호출");

    let dx = 0, dy = 0;
    if      (currentDirection === NORTH) dy = -1;
    else if (currentDirection === EAST)  dx = 1;
    else if (currentDirection === SOUTH) dy = 1;
    else if (currentDirection === WEST)  dx = -1;

    let tempX = currentX;
    let tempY = currentY;
    let finalX = currentX; // 최종 고정될 위치
    let finalY = currentY;

    // 유효 영역 내에서 충돌 전까지 계속 이동 시뮬레이션 (푸시백 고려)
    while (true) {
        const nextTargetX = finalX + dx;
        const nextTargetY = finalY + dy;

        // 1. 물리적 충돌 검사
        if (!checkCollision(nextTargetX, nextTargetY, currentShape)) {
            // 2. 영역 초과 및 푸시백 계산
            const { pushX, pushY, needsPush } = calculatePushBack(nextTargetX, nextTargetY, currentShape, currentDirection);

            let nextFinalX = nextTargetX;
            let nextFinalY = nextTargetY;

            if (needsPush) {
                nextFinalX += pushX;
                nextFinalY += pushY;
                // 3. 푸시백 후 충돌 검사
                if (checkCollision(nextFinalX, nextFinalY, currentShape)) {
                    // 푸시백 후 충돌하면 더 이상 진행 불가
                    break;
                }
            }
            // 4. 이동 가능하면 최종 위치 업데이트
            finalX = nextFinalX;
            finalY = nextFinalY;

        } else {
            // 물리적 충돌 시 중지
            break;
        }
    }

    // 최종 위치로 이동
    if (finalX !== currentX || finalY !== currentY) {
        currentX = finalX;
        currentY = finalY;
        console.log(`[DEBUG] Dropped to (${currentX}, ${currentY})`);
    } else {
        // console.log("[DEBUG] Drop position is current position.");
    }

    mergeTetromino(); // 최종 위치에서 병합
}

/** 현재 테트로미노의 고스트(예상 낙하 위치) 계산 (푸시백 로직 포함) */
function calculateGhostPosition() {
    if (!currentShape || gameOver || paused) return { x: currentX, y: currentY };

    let ghostX = currentX;
    let ghostY = currentY;

    let dx = 0, dy = 0;
    if      (currentDirection === NORTH) dy = -1;
    else if (currentDirection === EAST)  dx = 1;
    else if (currentDirection === SOUTH) dy = 1;
    else if (currentDirection === WEST)  dx = -1;

    // dropTetromino와 유사하게 최종 위치 시뮬레이션
    while (true) {
        const nextTargetX = ghostX + dx;
        const nextTargetY = ghostY + dy;

        if (!checkCollision(nextTargetX, nextTargetY, currentShape)) {
            const { pushX, pushY, needsPush } = calculatePushBack(nextTargetX, nextTargetY, currentShape, currentDirection);
            let nextGhostX = nextTargetX + pushX;
            let nextGhostY = nextTargetY + pushY;

            if (needsPush && checkCollision(nextGhostX, nextGhostY, currentShape)) {
                break; // 푸시백 후 충돌
            }
            ghostX = nextGhostX;
            ghostY = nextGhostY;
        } else {
            break; // 물리적 충돌
        }
    }
    return { x: ghostX, y: ghostY };
}

// --- 그리기 함수 ---

/** 사각형 그리기 */
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

/** 사각형 테두리 그리기 */
function drawStrokeRect(x, y, width, height, color, lineWidth = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, width, height);
}

/** 텍스트 그리기 */
function drawText(text, x, y, color = WHITE, fontSize = 20) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
}

/** 다각형 그리기 */
function drawPolygon(points, color) {
    if (!points || points.length < 3) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
}

/** 십자 모양 배경 그리기 및 현재 방향 강조 (Direction 강조 제거) */
function drawCrossShape() {
    const centerPixelX = gridStartX + CENTER_X_START * GRID_SIZE;
    const centerPixelY = gridStartY + CENTER_Y_START * GRID_SIZE;
    const centerPixelWidth = CENTER_SIZE * GRID_SIZE;
    const centerPixelHeight = CENTER_SIZE * GRID_SIZE;
    const defaultLineWidth = 1;
    // const highlightedLineWidth = 3; // 강조 제거
    // const highlightedColor = YELLOW; // 강조 제거
    const defaultColor = GRAY;

    // Sector backgrounds
    ctx.fillStyle = SECTOR_COLORS[NORTH];
    ctx.fillRect(centerPixelX, gridStartY, centerPixelWidth, CENTER_Y_START * GRID_SIZE); // North
    ctx.fillStyle = SECTOR_COLORS[EAST];
    ctx.fillRect(centerPixelX + centerPixelWidth, centerPixelY, SECTOR_WIDTH * GRID_SIZE, centerPixelHeight); // East
    ctx.fillStyle = SECTOR_COLORS[SOUTH];
    ctx.fillRect(centerPixelX, centerPixelY + centerPixelHeight, centerPixelWidth, SECTOR_HEIGHT * GRID_SIZE); // South
    ctx.fillStyle = SECTOR_COLORS[WEST];
    ctx.fillRect(gridStartX, centerPixelY, SECTOR_WIDTH * GRID_SIZE, centerPixelHeight); // West
    // Center background
    ctx.fillStyle = CENTER_COLOR;
    ctx.fillRect(centerPixelX, centerPixelY, centerPixelWidth, centerPixelHeight);

    // Sector borders (No highlighting)
    drawStrokeRect(centerPixelX, gridStartY, centerPixelWidth, CENTER_Y_START * GRID_SIZE, defaultColor, defaultLineWidth); // North Border
    drawStrokeRect(centerPixelX + centerPixelWidth, centerPixelY, SECTOR_WIDTH * GRID_SIZE, centerPixelHeight, defaultColor, defaultLineWidth);  // East Border
    drawStrokeRect(centerPixelX, centerPixelY + centerPixelHeight, centerPixelWidth, SECTOR_HEIGHT * GRID_SIZE, defaultColor, defaultLineWidth); // South Border
    drawStrokeRect(gridStartX, centerPixelY, SECTOR_WIDTH * GRID_SIZE, centerPixelHeight, defaultColor, defaultLineWidth);  // West Border
    // Center border
    drawStrokeRect(centerPixelX, centerPixelY, centerPixelWidth, centerPixelHeight, defaultColor, defaultLineWidth);
}

/** 그리드 라인 그리기 */
function drawGridLines() {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.lineWidth = 1;
    // Vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
        const screenX = gridStartX + x * GRID_SIZE;
        let yStart = gridStartY + CENTER_Y_START * GRID_SIZE;
        let yEnd = gridStartY + CENTER_Y_END * GRID_SIZE;
        if (x >= CENTER_X_START && x <= CENTER_X_END) { // 중앙 영역
           yStart = gridStartY; yEnd = gridStartY + TOTAL_GRID_PIXEL_HEIGHT;
        }
        ctx.beginPath(); ctx.moveTo(screenX, yStart); ctx.lineTo(screenX, yEnd); ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        const screenY = gridStartY + y * GRID_SIZE;
         let xStart = gridStartX + CENTER_X_START * GRID_SIZE;
         let xEnd = gridStartX + CENTER_X_END * GRID_SIZE;
        if (y >= CENTER_Y_START && y <= CENTER_Y_END) { // 중앙 영역
            xStart = gridStartX; xEnd = gridStartX + TOTAL_GRID_PIXEL_WIDTH;
        }
        ctx.beginPath(); ctx.moveTo(xStart, screenY); ctx.lineTo(xEnd, screenY); ctx.stroke();
    }
}

/** 전체 게임 보드 및 요소 그리기 */
function drawBoard() {
    // 배경 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(0, 0, canvas.width, canvas.height, BLACK);

    // 십자 영역 그리기
    drawCrossShape();

    // 그리드 라인 그리기
    drawGridLines();

    // 보드에 고정된 블록 그리기
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (board[y][x]) {
                drawRect(gridStartX + x * GRID_SIZE + 1, gridStartY + y * GRID_SIZE + 1,
                         GRID_SIZE - 2, GRID_SIZE - 2, board[y][x]);
            }
        }
    }

    // 고스트 블록 그리기
    if (currentShape && !gameOver && !paused) {
        const ghostPos = calculateGhostPosition();
        if (ghostPos.x !== currentX || ghostPos.y !== currentY) {
            ctx.globalAlpha = 0.3;
            for (let r = 0; r < currentShape.length; r++) {
                for (let c = 0; c < currentShape[r].length; c++) {
                    if (currentShape[r][c]) {
                        drawRect(gridStartX + (ghostPos.x + c) * GRID_SIZE + 1,
                                 gridStartY + (ghostPos.y + r) * GRID_SIZE + 1,
                                 GRID_SIZE - 2, GRID_SIZE - 2, GHOST_COLOR);
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }
    }

    // 현재 움직이는 블록 그리기
    if (currentShape && !gameOver) {
        for (let r = 0; r < currentShape.length; r++) {
            for (let c = 0; c < currentShape[r].length; c++) {
                if (currentShape[r][c]) {
                    drawRect(gridStartX + (currentX + c) * GRID_SIZE + 1,
                             gridStartY + (currentY + r) * GRID_SIZE + 1,
                             GRID_SIZE - 2, GRID_SIZE - 2, currentColor);
                }
            }
        }
    }

    // 게임 오버/일시정지 메시지 처리
    handleMessages();
}

// --- UI 및 메시지 처리 ---

/** 사이드바 정보 업데이트 (Direction 제거) */
function updateSidebar() {
    scoreElement.textContent = `Score: ${score}`;
    levelElement.textContent = `Level: ${level}`;
    linesElement.textContent = `Lines: ${linesCleared}`;
    // const currentDirText = gameOver ? '-' : (DIRECTIONS[currentDirection] !== undefined ? DIRECTIONS[currentDirection] : '?');
    // directionElement.textContent = `Direction: ${currentDirText}`; // 제거
}

/** 게임 오버 또는 일시정지 메시지 표시/숨김 처리 */
function handleMessages() {
    const existingOverlay = document.querySelector('.message-overlay');
    let message = null;

    if (gameOver) {
        message = "Game Over! Press R to restart";
    } else if (paused) {
        message = "Paused. Press P to resume";
    }

    if (message) {
        if (existingOverlay) {
            existingOverlay.textContent = message;
        } else {
            displayMessage(message);
        }
    } else {
        if (existingOverlay && existingOverlay.parentNode) {
             try {
                 existingOverlay.parentNode.removeChild(existingOverlay);
             } catch (e) {}
        }
    }
}

/** 화면 중앙에 메시지 오버레이 표시 */
function displayMessage(message) {
    // console.log(`[DEBUG] displayMessage 호출: ${message}`); // 필요시 활성화
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.textContent = message;
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        if (window.getComputedStyle(gameContainer).position === 'static') {
            gameContainer.style.position = 'relative';
        }
        gameContainer.appendChild(overlay);
    } else {
        document.body.appendChild(overlay);
        console.warn("[WARN] #game-container not found, appending message overlay to body.");
    }
}

// --- 입력 처리 ---

/** 키보드 입력 처리 */
function handleKeyDown(e) {
    // R: 재시작
    if (e.key === 'r' || e.key === 'R') {
        console.log("[DEBUG] R key pressed. Resetting and restarting game loop.");
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
        resetGame();
        startGameLoop();
        return;
    }

    // P: 일시정지/재개
    if (!gameOver && (e.key === 'p' || e.key === 'P')) {
        paused = !paused;
        if (paused) {
            console.log("[DEBUG] Game paused.");
            handleMessages();
        } else {
            console.log("[DEBUG] Game resumed.");
            lastMoveDownTime = Date.now(); // 재개 시 시간 재설정
            handleMessages();
            if (!gameLoopId) { startGameLoop(); } // 혹시 멈췄으면 재시작
        }
        drawBoard(); // 상태 즉시 반영
        return;
    }

    // 게임 오버 또는 일시정지 시 조작 무시
    if (gameOver || paused || !currentShape) {
        return;
    }

    let actionTaken = false;

    // 상대 이동 및 조작 처리 (푸시백은 moveTetromino, rotateTetromino 내부 처리)
    switch (e.key) {
        case 'ArrowLeft': // 좌
            if (currentDirection !== EAST) { // 동쪽 낙하 시 좌 이동 방지
                if (moveTetromino(-1, 0)) actionTaken = true;
            } //else { console.log("[DEBUG] ArrowLeft ignored (opposite East)"); }
            break;
        case 'ArrowRight': // 우
             if (currentDirection !== WEST) { // 서쪽 낙하 시 우 이동 방지
                 if (moveTetromino(1, 0)) actionTaken = true;
             } //else { console.log("[DEBUG] ArrowRight ignored (opposite West)"); }
            break;
        case 'ArrowDown': // 하 (소프트 드롭)
             if (currentDirection !== NORTH) { // 북쪽 낙하 시 하 이동 방지
                 if (moveTetromino(0, 1)) {
                    actionTaken = true;
                    // score += 1; // 소프트 드롭 점수 (선택적)
                    lastMoveDownTime = Date.now(); // 수동 하강 시 타이머 리셋
                 }
             } //else { console.log("[DEBUG] ArrowDown ignored (opposite North)"); }
            break;
        case 'ArrowUp': // 상
             if (currentDirection !== SOUTH) { // 남쪽 낙하 시 상 이동 방지
                 if (moveTetromino(0, -1)) actionTaken = true;
             } //else { console.log("[DEBUG] ArrowUp ignored (opposite South)"); }
            break;
        case ' ': // Space: 회전
            rotateTetromino();
            actionTaken = true; // 회전 시도 시 화면 갱신 필요
            break;
        case 'Enter': // Enter: 하드 드랍
            dropTetromino();
            actionTaken = true; // 드랍 후 즉시 갱신
            break;
    }

    // 조작이 있었고, 게임 오버가 아니면 즉시 화면 갱신
    if (actionTaken && !gameOver) {
        drawBoard();
    }
}

// --- 게임 루프 ---

/** 메인 게임 루프 */
function gameLoop(timestamp) {
    if (!gameLoopId) { return; } // 루프 중지 확인

    const now = Date.now();
    lastTime = timestamp;

    if (!gameOver && !paused) { // 게임 진행 중
        // 자동 하강 처리
        if (now - lastMoveDownTime > moveDownSpeed) {
            moveInFallingDirection(); // 내부에서 이동/병합 처리 및 lastMoveDownTime 갱신
        }
    }

    // 게임 상태(진행/일시정지/게임오버)에 따라 보드 그리기
    // 게임 오버나 일시정지 메시지는 drawBoard -> handleMessages 에서 처리됨
    drawBoard();

    // 다음 프레임 요청 (게임 오버 시에도 계속 루프를 돌며 R키 입력을 기다림)
    // 단, 게임 오버 상태를 명확히 하고 루프를 멈추려면 아래 주석 해제
    // if (gameOver) {
    //     console.log("[DEBUG] Game Over state detected in loop. Stopping loop.");
    //     cancelAnimationFrame(gameLoopId);
    //     gameLoopId = null;
    //     return;
    // }
    gameLoopId = requestAnimationFrame(gameLoop);
}

/** 게임 루프 시작 */
function startGameLoop() {
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); }
    gameLoopId = null;
    lastTime = performance.now();
    lastMoveDownTime = Date.now();
    console.log("[DEBUG] Requesting new game loop.");
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- 초기화 및 이벤트 리스너 ---

window.addEventListener('keydown', handleKeyDown);
document.getElementById('exitButton').addEventListener('click', () => {
    console.log("[DEBUG] Exit button clicked - reloading page.");
    window.location.reload();
});

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('[DEBUG] DOM fully loaded and parsed');
    try {
        resetGame();
        startGameLoop();
    } catch (error) {
        console.error("[FATAL ERROR] Failed to initialize or start game:", error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'color: red; position: absolute; top: 50px; left: 50px; z-index: 100; background: black; padding: 10px; border: 1px solid red;';
        errorDiv.textContent = "FATAL ERROR starting game. Check console (F12).";
        document.body.appendChild(errorDiv);
    }
});

console.log("[DEBUG] game.js loaded and execution context setup.");