// 보드 설정
const BOARD_SIZE = 32; // 10x8 외곽의 32칸
export const START_TILE = 1; // 시작 타일
export const CORNER_TILES = [10, 17, 26, 33]; // 반드시 밟아야 하는 모서리 타일

const DICE_COST = [200, 300, 400, 500, 600, 700];

// 도착 위치 계산 (보드 순환 + 확장된 모서리 계산)
function calculateNextPosition(currentPosition, diceValue) {
  return currentPosition + diceValue; // 절대적인 위치 계산
}

// 절대 위치를 보드 순환으로 변환
function toBoardPosition(position) {
  return ((position - 1) % BOARD_SIZE) + 1;
}

// 최적화 단계: 주사위를 더 작은 눈의 주사위로 분할
function optimizeDiceUsage(path, pointUsed, remainingPoints) {
    
  while (remainingPoints >= 100) {
    // 역순으로 큰 주사위를 탐색
    for (let i = path.length - 1; i >= 0; i--) {
      let dice = path[i];
      if (dice > 1 && remainingPoints >= 100) {
        // 주사위를 분할
        path.splice(i, 1, 1, dice - 1); // dice → (1, dice-1)
        pointUsed += 100;
        remainingPoints -= 100; // 분할 시 100포인트 소모
        break; // 한 번 분할 후 다시 반복
      }
    }
    // 분할 가능한 주사위가 없으면 종료
    if (!path.some(dice => dice > 1)) break;
  }
  return { optimizedPath: path, optimizedPoints:pointUsed, remainingPoints };
}

// 경로 시뮬레이션
export function simulateOptimizedPath(currentPosition, currentPoints) {
  let visitedTiles = new Set();
  let path = [];
  let pointsUsed = 0;

  let absolutePosition = currentPosition; // 절대 위치로 추적
  let cornersVisited = new Set();

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
      if (bestDice === 0) bestDice = dice;
    }

    if (bestDice === 0) break; // 포인트 부족 시 종료

    // 최적 주사위 눈 사용
    pointsUsed += DICE_COST[bestDice - 1];
    currentPoints -= DICE_COST[bestDice - 1];
    for (let i = 0; i < bestDice; i++) {
      absolutePosition += 1;
      let boardPosition = toBoardPosition(absolutePosition);
      if (boardPosition !== START_TILE) {
        visitedTiles.add(absolutePosition); // 절대 위치로 기록
      }
      if (CORNER_TILES.includes(absolutePosition)) {
        cornersVisited.add(absolutePosition);
      }
    }

    path.push(bestDice);
  }

  // 최적화: 주사위를 더 작은 눈의 주사위로 분할
  const { optimizedPath, optimizedPoints, remainingPoints } = optimizeDiceUsage(path, pointsUsed, currentPoints);

  return {
    path: optimizedPath,
    points_used: optimizedPoints,
    dice_used: optimizedPath.length,
    corners_visited: cornersVisited.size === CORNER_TILES.length,
    tiles_visited: visitedTiles.size,
    remaining_points: remainingPoints,
  };
}