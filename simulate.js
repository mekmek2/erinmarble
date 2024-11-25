// 도착 위치 계산 (보드 순환 + 확장된 모서리 계산)
function calculateNextPosition(currentPosition, diceValue) {
    return currentPosition + diceValue; // 절대적인 위치 계산
}

// 절대 위치를 보드 순환으로 변환
function toBoardPosition(position, boardSize) {
    return ((position - 1) % boardSize) + 1;
}

// 최적화 단계: 주사위를 더 작은 눈의 주사위로 분할
function optimizeDiceUsage(lastPosition, path, visitedTiles, pointUsed, remainingPoints) {

    let pos = lastPosition;
    let updatedVisitedTiles = visitedTiles;

    //return { optimizedPath: path, optimizedTiles:updatedVisitedTiles, optimizedPoints: pointUsed, remainingPoints };

    while (remainingPoints >= 100) {
        // 역순으로 큰 주사위를 탐색
        
        pos = lastPosition;
        for (let i = path.length - 1; i >= 0; i--) {
            let dice = path[i];
            pos -= dice;
            if (dice > 1 && remainingPoints >= 100) {
                // 1 주사위를 포함해 분할 (x -> 1, (x-1))
                path.splice(i, 1, 1, dice - 1); // dice → (1, dice-1)

                //분할한 위치를 방문값에 적용
                //updatedVisitedTiles.add(pos + 1);
                updatedVisitedTiles.splice(i, 1, pos + 1, pos + dice);

                // 분할 시 100포인트 소모
                pointUsed += 100;
                remainingPoints -= 100;
                break; // 한 번 분할 후 다시 반복
            }
        }
        // 분할 가능한 주사위가 없으면 종료
        if (!path.some(dice => dice > 1)) break;
    }
    return { optimizedPath: path, optimizedTiles:updatedVisitedTiles, optimizedPoints: pointUsed, remainingPoints };
}

// 경로 시뮬레이션
function simulateOptimizedPath(currentPosition, currentPoints) {

    // 보드 설정
    const BOARD_SIZE = 32; // 10x8 외곽의 32칸
    const START_TILE = 1; // 시작 타일
    const CORNER_TILES = [10, 17, 26, 33]; // 반드시 밟아야 하는 모서리 타일
    const DICE_COST = [200, 300, 400, 500, 600, 700];

    let visitedTiles = [];
    let path = [];
    let pointsUsed = 0;

    let absolutePosition = currentPosition; // 절대 위치로 추적
    let cornersVisited = new Set();

    //예외처리: 시작점이 아닌 모서리에서 시작하면 현재 타일을 방문함으로 지정
    if(currentPosition != START_TILE
        && CORNER_TILES.includes(currentPosition)) cornersVisited.add(currentPosition)

    while (cornersVisited.size < CORNER_TILES.length && currentPoints >= DICE_COST[0]) {
        let bestDice = 0;

        // 가능한 주사위 눈 중 가장 작은 눈 선택 (포인트 내에서)
        for (let dice = 1; dice <= 6; dice++) {
            if (DICE_COST[dice - 1] > currentPoints) break;

            // 다음 절대 위치 계산
            let nextAbsolutePosition = absolutePosition + dice;

            // 모서리 타일 방문 여부를 우선적으로 고려
            if (!cornersVisited.has(nextAbsolutePosition) && CORNER_TILES.includes(nextAbsolutePosition)) {
                bestDice = dice;
                break; // 모서리 타일 방문이 우선
            }

            // 작은 눈의 주사위를 우선적으로 사용
            //if (bestDice === 0) bestDice = dice;

            // 큰 눈의 주사위를 우선 사용
            bestDice = dice;
        }

        if (bestDice === 0) break; // 포인트 부족 시 종료

        // 최적 주사위 눈 사용
        pointsUsed += DICE_COST[bestDice - 1];
        currentPoints -= DICE_COST[bestDice - 1];
        
        absolutePosition += bestDice;
        visitedTiles.push(absolutePosition); // 절대 위치로 기록

        if (CORNER_TILES.includes(absolutePosition)) {
            cornersVisited.add(absolutePosition);
        }

        path.push(bestDice);

        if(absolutePosition > BOARD_SIZE) break;
    }

    // 최적화: 주사위를 더 작은 눈의 주사위로 분할
    const { optimizedPath, optimizedTiles, optimizedPoints, remainingPoints } = optimizeDiceUsage(absolutePosition, path, visitedTiles, pointsUsed, currentPoints);

    return {
        path: optimizedPath,
        points_used: optimizedPoints,
        dice_used: optimizedPath.length,
        corners_visited: cornersVisited.size === CORNER_TILES.length,
        corners_count:cornersVisited.size,
        tiles_visited: optimizedTiles,
        remaining_points: remainingPoints,
    };
}