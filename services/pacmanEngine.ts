/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */

// Engine Types
type Direction = 1 | 2 | 3 | 4 | 11;
const NONE = 4;
const UP = 3;
const LEFT = 2;
const DOWN = 1;
const RIGHT = 11;
const WAITING = 5;
const PAUSE = 6;
const PLAYING = 7;
const COUNTDOWN = 8;
const EATEN_PAUSE = 9;
const DYING = 10;

interface Point {
    x: number;
    y: number;
}

const Pacman: any = {};
// REDUCED SPEED: Original was 30. 10% slower = 27.
Pacman.FPS = 27;

// --- GHOST LOGIC ---
Pacman.Ghost = function (game: any, map: any, colour: any) {
    let position: Point | null = null;
    let direction: Direction | null = null;
    let eatable: number | null = null;
    let eaten: number | null = null;
    let due: Direction | null = null;

    function getNewCoord(dir: number, current: Point) {
        const speed = isVunerable() ? 1 : isHidden() ? 4 : 2;
        const xSpeed = (dir === LEFT && -speed) || (dir === RIGHT && speed) || 0;
        const ySpeed = (dir === DOWN && speed) || (dir === UP && -speed) || 0;

        return {
            x: addBounded(current.x, xSpeed),
            y: addBounded(current.y, ySpeed),
        };
    }

    function addBounded(x1: number, x2: number) {
        const rem = x1 % 10;
        const result = rem + x2;
        if (rem !== 0 && result > 10) {
            return x1 + (10 - rem);
        } else if (rem > 0 && result < 0) {
            return x1 - rem;
        }
        return x1 + x2;
    }

    function isVunerable() {
        return eatable !== null;
    }

    function isDangerous() {
        return eaten === null;
    }

    function isHidden() {
        return eatable === null && eaten !== null;
    }

    function getRandomDirection() {
        const moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
        return moves[Math.floor(Math.random() * 2)] as Direction;
    }

    // --- NEW: SMARTER AI ---
    function getSmartDirection(target: Point) {
        // If vulnerable or eaten, behave randomly/erratically (run away logic is complex, random is okay for now)
        if (isVunerable() || isHidden()) {
            return getRandomDirection();
        }

        // Get possible perpendicular moves
        const moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
        
        // Simple heuristic: Choose the move that minimizes distance to target
        // We need to check if the move is roughly valid (not immediately into a wall), 
        // but 'move()' handles collision. Here we just suggest a 'due' direction.
        
        const d1 = moves[0];
        const d2 = moves[1];

        // Predict next position for d1
        const p1 = getNewCoord(d1, position!);
        // Predict next position for d2
        const p2 = getNewCoord(d2, position!);

        const dist1 = Math.pow(p1.x - target.x, 2) + Math.pow(p1.y - target.y, 2);
        const dist2 = Math.pow(p2.x - target.x, 2) + Math.pow(p2.y - target.y, 2);

        // 80% chance to track perfectly, 20% random to keep it organic/not impossible
        if (Math.random() > 0.2) {
             return (dist1 < dist2 ? d1 : d2) as Direction;
        }
        return moves[Math.floor(Math.random() * 2)] as Direction;
    }

    function reset() {
        eaten = null;
        eatable = null;
        position = { x: 90, y: 80 };
        direction = getRandomDirection();
        due = getRandomDirection();
    }

    function onWholeSquare(x: number) {
        return x % 10 === 0;
    }

    function oppositeDirection(dir: Direction) {
        return (dir === LEFT && RIGHT) || (dir === RIGHT && LEFT) || (dir === UP && DOWN) || UP;
    }

    function makeEatable() {
        direction = oppositeDirection(direction!);
        eatable = game.getTick();
    }

    function eat() {
        eatable = null;
        eaten = game.getTick();
    }

    function pointToCoord(x: number) {
        return Math.round(x / 10);
    }

    function nextSquare(x: number, dir: number) {
        const rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    }

    function onGridSquare(pos: Point) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    }

    function secondsAgo(tick: number) {
        return (game.getTick() - tick) / Pacman.FPS;
    }

    function getColour() {
        if (eatable) {
            if (secondsAgo(eatable) > 5) {
                return game.getTick() % 20 > 10 ? '#FFFFFF' : '#0000BB';
            } else {
                return '#0000BB';
            }
        } else if (eaten) {
            return '#222';
        }
        return colour;
    }

    function draw(ctx: CanvasRenderingContext2D) {
        const s = map.blockSize;
        const top = (position!.y / 10) * s;
        const left = (position!.x / 10) * s;

        if (eatable && secondsAgo(eatable) > 8) {
            eatable = null;
        }

        if (eaten && secondsAgo(eaten) > 3) {
            eaten = null;
        }

        const tl = left + s;
        const base = top + s - 3;
        const inc = s / 10;

        const high = game.getTick() % 10 > 5 ? 3 : -3;
        const low = game.getTick() % 10 > 5 ? -3 : 3;

        ctx.fillStyle = getColour();
        ctx.beginPath();

        ctx.moveTo(left, base);

        ctx.quadraticCurveTo(left, top, left + s / 2, top);
        ctx.quadraticCurveTo(left + s, top, left + s, base);

        // Wavy things at the bottom
        ctx.quadraticCurveTo(tl - inc * 1, base + high, tl - inc * 2, base);
        ctx.quadraticCurveTo(tl - inc * 3, base + low, tl - inc * 4, base);
        ctx.quadraticCurveTo(tl - inc * 5, base + high, tl - inc * 6, base);
        ctx.quadraticCurveTo(tl - inc * 7, base + low, tl - inc * 8, base);
        ctx.quadraticCurveTo(tl - inc * 9, base + high, tl - inc * 10, base);

        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#FFF';
        ctx.arc(left + 6, top + 6, s / 6, 0, 300, false);
        ctx.arc(left + s - 6, top + 6, s / 6, 0, 300, false);
        ctx.closePath();
        ctx.fill();

        const f = s / 12;
        const off: any = {};
        off[RIGHT] = [f, 0];
        off[LEFT] = [-f, 0];
        off[UP] = [0, -f];
        off[DOWN] = [0, f];

        ctx.beginPath();
        ctx.fillStyle = '#000';
        ctx.arc(
            left + 6 + off[direction!][0],
            top + 6 + off[direction!][1],
            s / 15,
            0,
            300,
            false
        );
        ctx.arc(
            left + s - 6 + off[direction!][0],
            top + 6 + off[direction!][1],
            s / 15,
            0,
            300,
            false
        );
        ctx.closePath();
        ctx.fill();
    }

    function pane(pos: Point) {
        if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
            return { y: 100, x: -10 };
        }

        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return (position = { y: 100, x: 190 });
        }

        return false;
    }

    // Accepts target for AI
    function move(ctx: CanvasRenderingContext2D, target: Point) {
        const oldPos = position;
        const onGrid = onGridSquare(position!);
        let npos: Point | null = null;

        if (due !== direction) {
            npos = getNewCoord(due!, position!);

            if (
                onGrid &&
                map.isFloorSpace({
                    y: pointToCoord(nextSquare(npos.y, due!)),
                    x: pointToCoord(nextSquare(npos.x, due!)),
                })
            ) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction!, position!);
        }

        if (
            onGrid &&
            map.isWallSpace({
                y: pointToCoord(nextSquare(npos.y, direction!)),
                x: pointToCoord(nextSquare(npos.x, direction!)),
            })
        ) {
            // Hit a wall, calculate new direction based on target
            due = getSmartDirection(target);
            return move(ctx, target);
        }

        position = npos;

        const tmp = pane(position!);
        if (tmp) {
            position = tmp as Point;
        }

        // At every grid intersection, re-evaluate direction to track user
        if (onGrid) {
             due = getSmartDirection(target);
        }

        return {
            new: position,
            old: oldPos,
        };
    }

    return {
        eat: eat,
        isVunerable: isVunerable,
        isDangerous: isDangerous,
        makeEatable: makeEatable,
        reset: reset,
        move: move,
        draw: draw,
    };
};

Pacman.User = function (game: any, map: any, startingLives: number) {
    let position: Point | null = null;
    let direction: Direction | null = null;
    let eaten: number | null = null;
    let due: Direction | null = null;
    let lives: number | null = null;
    let score = 5;
    const keyMap: any = {};

    keyMap[37] = LEFT;
    keyMap[38] = UP;
    keyMap[39] = RIGHT;
    keyMap[40] = DOWN;

    function addScore(nScore: number) {
        score += nScore;
        if (score >= 10000 && score - nScore < 10000) {
            lives! += 1;
        }
    }

    function theScore() {
        return score;
    }

    function loseLife() {
        lives! -= 1;
    }

    function getLives() {
        return lives;
    }

    function initUser() {
        score = 0;
        lives = startingLives;
        newLevel();
    }

    function newLevel() {
        resetPosition();
        eaten = 0;
    }

    function resetPosition() {
        position = { x: 90, y: 120 };
        direction = LEFT;
        due = LEFT;
    }

    function reset() {
        initUser();
        resetPosition();
    }

    function keyDown(e: KeyboardEvent) {
        if (typeof keyMap[e.keyCode] !== 'undefined') {
            due = keyMap[e.keyCode];
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    }

    function getNewCoord(dir: number, current: Point) {
        return {
            x: current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
            y: current.y + (dir === DOWN && 2 || dir === UP && -2 || 0),
        };
    }

    function onWholeSquare(x: number) {
        return x % 10 === 0;
    }

    function pointToCoord(x: number) {
        return Math.round(x / 10);
    }

    function nextSquare(x: number, dir: number) {
        const rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    }

    function next(pos: Point, dir: number) {
        return {
            y: pointToCoord(nextSquare(pos.y, dir)),
            x: pointToCoord(nextSquare(pos.x, dir)),
        };
    }

    function onGridSquare(pos: Point) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    }

    function isOnSamePlane(due: number, dir: number) {
        return (
            ((due === LEFT || due === RIGHT) && (dir === LEFT || dir === RIGHT)) ||
            ((due === UP || due === DOWN) && (dir === UP || dir === DOWN))
        );
    }

    function move(ctx: CanvasRenderingContext2D) {
        let npos: Point | null = null;
        let nextWhole: Point | null = null;
        const oldPosition = position;
        let block: number | null = null;

        if (due !== direction) {
            npos = getNewCoord(due!, position!);

            if (
                isOnSamePlane(due!, direction!) ||
                (onGridSquare(position!) && map.isFloorSpace(next(npos, due!)))
            ) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction!, position!);
        }

        if (onGridSquare(position!) && map.isWallSpace(next(npos, direction!))) {
            direction = NONE;
        }

        if (direction === NONE) {
            return { new: position, old: position };
        }

        if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
            npos = { y: 100, x: -10 };
        }

        if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
            npos = { y: 100, x: 190 };
        }

        position = npos;
        nextWhole = next(position!, direction!);

        block = map.block(nextWhole);

        if (
            (isMidSquare(position!.y) || isMidSquare(position!.x)) &&
            (block === Pacman.BISCUIT || block === Pacman.PILL)
        ) {
            map.setBlock(nextWhole, Pacman.EMPTY);
            addScore(block === Pacman.BISCUIT ? 10 : 50);
            eaten = (eaten || 0) + 1;

            if (eaten === 182) {
                game.completedLevel();
            }

            if (block === Pacman.PILL) {
                game.eatenPill();
            }
        }

        return {
            new: position,
            old: oldPosition,
        };
    }

    function isMidSquare(x: number) {
        const rem = x % 10;
        return rem > 3 || rem < 7;
    }

    function calcAngle(dir: number, pos: Point) {
        if (dir == RIGHT && pos.x % 10 < 5) {
            return { start: 0.25, end: 1.75, direction: false };
        } else if (dir === DOWN && pos.y % 10 < 5) {
            return { start: 0.75, end: 2.25, direction: false };
        } else if (dir === UP && pos.y % 10 < 5) {
            return { start: 1.25, end: 1.75, direction: true };
        } else if (dir === LEFT && pos.x % 10 < 5) {
            return { start: 0.75, end: 1.25, direction: true };
        }
        return { start: 0, end: 2, direction: false };
    }

    function drawDead(ctx: CanvasRenderingContext2D, amount: number) {
        const size = map.blockSize,
            half = size / 2;

        if (amount >= 1) {
            return;
        }

        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo((position!.x / 10) * size + half, (position!.y / 10) * size + half);

        ctx.arc(
            (position!.x / 10) * size + half,
            (position!.y / 10) * size + half,
            half,
            0,
            Math.PI * 2 * amount,
            true
        );

        ctx.fill();
    }

    function draw(ctx: CanvasRenderingContext2D) {
        const s = map.blockSize,
            angle = calcAngle(direction!, position!);

        ctx.fillStyle = '#FFFF00';

        ctx.beginPath();

        ctx.moveTo((position!.x / 10) * s + s / 2, (position!.y / 10) * s + s / 2);

        ctx.arc(
            (position!.x / 10) * s + s / 2,
            (position!.y / 10) * s + s / 2,
            s / 2,
            Math.PI * angle.start,
            Math.PI * angle.end,
            angle.direction
        );

        ctx.fill();
    }

    initUser();

    return {
        draw: draw,
        drawDead: drawDead,
        loseLife: loseLife,
        getLives: getLives,
        score: score,
        addScore: addScore,
        theScore: theScore,
        keyDown: keyDown,
        move: move,
        newLevel: newLevel,
        reset: reset,
        resetPosition: resetPosition,
    };
};

Pacman.Map = function (size: number) {
    let height: number | null = null;
    let width: number | null = null;
    const blockSize = size;
    let pillSize = 0;
    let map: any = null;

    function withinBounds(y: number, x: number) {
        return y >= 0 && y < height! && x >= 0 && x < width!;
    }

    function isWall(pos: Point) {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL;
    }

    function isFloorSpace(pos: Point) {
        if (!withinBounds(pos.y, pos.x)) {
            return false;
        }
        const peice = map[pos.y][pos.x];
        return (
            peice === Pacman.EMPTY ||
            peice === Pacman.BISCUIT ||
            peice === Pacman.PILL
        );
    }

    function drawWall(ctx: CanvasRenderingContext2D) {
        let i, j, p, line;

        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        for (i = 0; i < Pacman.WALLS.length; i += 1) {
            line = Pacman.WALLS[i];
            ctx.beginPath();

            for (j = 0; j < line.length; j += 1) {
                p = line[j];

                if (p.move) {
                    ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
                } else if (p.line) {
                    ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
                } else if (p.curve) {
                    ctx.quadraticCurveTo(
                        p.curve[0] * blockSize,
                        p.curve[1] * blockSize,
                        p.curve[2] * blockSize,
                        p.curve[3] * blockSize
                    );
                }
            }
            ctx.stroke();
        }
    }

    function reset() {
        // Deep clone the map
        map = JSON.parse(JSON.stringify(Pacman.MAP));
        height = map.length;
        width = map[0].length;
    }

    function block(pos: Point) {
        return map[pos.y][pos.x];
    }

    function setBlock(pos: Point, type: number) {
        map[pos.y][pos.x] = type;
    }

    function drawPills(ctx: CanvasRenderingContext2D) {
        if (++pillSize > 30) {
            pillSize = 0;
        }

        for (let i = 0; i < height!; i += 1) {
            for (let j = 0; j < width!; j += 1) {
                if (map[i][j] === Pacman.PILL) {
                    ctx.beginPath();

                    ctx.fillStyle = '#000';
                    ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);

                    ctx.fillStyle = '#FFF';
                    ctx.arc(
                        j * blockSize + blockSize / 2,
                        i * blockSize + blockSize / 2,
                        Math.abs(5 - pillSize / 3),
                        0,
                        Math.PI * 2,
                        false
                    );
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    function draw(ctx: CanvasRenderingContext2D) {
        const size = blockSize;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width! * size, height! * size);

        drawWall(ctx);

        for (let i = 0; i < height!; i += 1) {
            for (let j = 0; j < width!; j += 1) {
                drawBlock(i, j, ctx);
            }
        }
    }

    function drawBlock(y: number, x: number, ctx: CanvasRenderingContext2D) {
        const layout = map[y][x];

        if (layout === Pacman.PILL) {
            return;
        }

        ctx.beginPath();

        if (
            layout === Pacman.EMPTY ||
            layout === Pacman.BLOCK ||
            layout === Pacman.BISCUIT
        ) {
            ctx.fillStyle = '#000';
            ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

            if (layout === Pacman.BISCUIT) {
                ctx.fillStyle = '#FFF';
                ctx.fillRect(
                    x * blockSize + blockSize / 2.5,
                    y * blockSize + blockSize / 2.5,
                    blockSize / 6,
                    blockSize / 6
                );
            }
        }
        ctx.closePath();
    }

    reset();

    return {
        draw: draw,
        drawBlock: drawBlock,
        drawPills: drawPills,
        block: block,
        setBlock: setBlock,
        reset: reset,
        isWallSpace: isWall,
        isFloorSpace: isFloorSpace,
        height: height,
        width: width,
        blockSize: blockSize,
    };
};

Pacman.Audio = function (game: any) {
    const files: any = [];
    const endEvents: any = [];
    const progressEvents: any = [];
    let playing: any = [];

    function load(name: string, path: string, cb: () => void) {
        const f = (files[name] = document.createElement('audio'));

        progressEvents[name] = function (event: any) {
            progress(event, name, cb);
        };

        f.addEventListener('canplaythrough', progressEvents[name], true);
        f.setAttribute('preload', 'true');
        f.setAttribute('autobuffer', 'true');
        f.setAttribute('src', path);
        f.pause();
    }

    function progress(event: any, name: string, callback: () => void) {
        if (event.loaded === event.total && typeof callback === 'function') {
            callback();
            files[name].removeEventListener(
                'canplaythrough',
                progressEvents[name],
                true
            );
        }
    }

    function disableSound() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
            files[playing[i]].currentTime = 0;
        }
        playing = [];
    }

    function ended(name: string) {
        let i;
        const tmp = [];
        let found = false;

        files[name].removeEventListener('ended', endEvents[name], true);

        for (i = 0; i < playing.length; i++) {
            if (!found && playing[i]) {
                found = true;
            } else {
                tmp.push(playing[i]);
            }
        }
        playing = tmp;
    }

    function play(name: string) {
        if (!game.soundDisabled()) {
            endEvents[name] = function () {
                ended(name);
            };
            playing.push(name);
            files[name].addEventListener('ended', endEvents[name], true);
            files[name].play().catch(() => { /* Ignore autoplay errors */});
        }
    }

    function pause() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
        }
    }

    function resume() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].play().catch(() => {});
        }
    }

    return {
        disableSound: disableSound,
        load: load,
        play: play,
        pause: pause,
        resume: resume,
    };
};

export const PACMAN = (function () {
    let state = WAITING;
    let audio: any = null;
    const ghosts: any = [];
    const ghostSpecs = ['#00FFDE', '#FF0000', '#FFB8DE', '#FFB847'];
    let eatenCount = 0;
    let level = 0;
    let tick = 0;
    let ghostPos: any, userPos: any;
    let stateChanged = true;
    let timerStart: any = null;
    let lastTime = 0;
    let ctx: any = null;
    let timer: any = null;
    let map: any = null;
    let user: any = null;
    let stored: any = null;
    let globalWrapper: HTMLElement | null = null;
    let gameOverCallback: ((score: number) => void) | null = null;

    function getTick() {
        return tick;
    }

    function drawScore(text: any, position: any) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(
            text,
            (position['new']['x'] / 10) * map.blockSize,
            ((position['new']['y'] + 5) / 10) * map.blockSize
        );
    }

    function dialog(text: string) {
        ctx.fillStyle = '#FFFF00';
        ctx.font = '14px "Press Start 2P"';
        const width = ctx.measureText(text).width,
            x = (map.width * map.blockSize - width) / 2;
        ctx.fillText(text, x, map.height * 10 + 8);
    }

    function soundDisabled() {
        return localStorage['soundDisabled'] === 'true';
    }

    function startLevel() {
        user.resetPosition();
        for (let i = 0; i < ghosts.length; i += 1) {
            ghosts[i].reset();
        }
        audio.play('start');
        timerStart = tick;
        setState(COUNTDOWN);
    }

    function startNewGame() {
        setState(WAITING);
        level = 1;
        user.reset();
        map.reset();
        map.draw(ctx);
        startLevel();
    }

    function keyDown(e: KeyboardEvent) {
        if (e.keyCode === 78) { // N
            startNewGame();
        } else if (e.keyCode === 83) { // S
            audio.disableSound();
            localStorage['soundDisabled'] = String(!soundDisabled());
        } else if (e.keyCode === 80 && state === PAUSE) { // P
            audio.resume();
            map.draw(ctx);
            setState(stored);
        } else if (e.keyCode === 80) { // P
            stored = state;
            setState(PAUSE);
            audio.pause();
            map.draw(ctx);
            dialog('Paused');
        } else if (state !== PAUSE) {
            return user.keyDown(e);
        }
        return true;
    }

    function loseLife() {
        setState(WAITING);
        user.loseLife();
        if (user.getLives() > 0) {
            startLevel();
        } else {
             // Game Over logic
             dialog("GAME OVER");
             setTimeout(() => {
                 if (gameOverCallback) gameOverCallback(user.theScore());
             }, 3000);
        }
    }

    function setState(nState: number) {
        state = nState;
        stateChanged = true;
    }

    function collided(user: Point, ghost: Point) {
        return (
            Math.sqrt(Math.pow(ghost.x - user.x, 2) + Math.pow(ghost.y - user.y, 2))
        ) < 10;
    }

    function drawFooter() {
        const topLeft = map.height * map.blockSize,
            textBase = topLeft + 17;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, topLeft, map.width * map.blockSize, 30);

        ctx.fillStyle = '#FFFF00';

        // Draw Score left aligned
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('Score: ' + user.theScore(), 10, textBase);

        // Draw Lives in the middle (x=200)
        for (let i = 0, len = user.getLives(); i < len; i++) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.moveTo(
                200 + 20 * i + map.blockSize / 2,
                topLeft + 1 + map.blockSize / 2
            );

            ctx.arc(
                200 + 20 * i + map.blockSize / 2,
                topLeft + 1 + map.blockSize / 2,
                map.blockSize / 2,
                Math.PI * 0.25,
                Math.PI * 1.75,
                false
            );
            ctx.fill();
        }

        ctx.fillStyle = !soundDisabled() ? '#00FF00' : '#FF0000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('♪', 350, textBase);

        ctx.fillStyle = '#FFFF00';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('Lvl: ' + level, 270, textBase);
    }

    function redrawBlock(pos: Point) {
        map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
        map.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10), ctx);
    }

    function mainDraw() {
        let i, len, nScore;

        ghostPos = [];
        
        // Move User first to get position
        const u = user.move(ctx);
        userPos = u['new'];

        // Pass userPos to ghost move for tracking
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghostPos.push(ghosts[i].move(ctx, userPos));
        }

        // Redraw underlying map blocks
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            redrawBlock(ghostPos[i].old);
        }
        redrawBlock(u.old);

        // Draw entities
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghosts[i].draw(ctx);
        }
        user.draw(ctx);

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            if (collided(userPos, ghostPos[i]['new'])) {
                if (ghosts[i].isVunerable()) {
                    audio.play('eatghost');
                    ghosts[i].eat();
                    eatenCount += 1;
                    nScore = eatenCount * 50;
                    drawScore(nScore, ghostPos[i]);
                    user.addScore(nScore);
                    setState(EATEN_PAUSE);
                    timerStart = tick;
                } else if (ghosts[i].isDangerous()) {
                    audio.play('die');
                    setState(DYING);
                    timerStart = tick;
                }
            }
        }
    }

    function mainLoop() {
        let diff;

        if (state !== PAUSE) {
            ++tick;
        }

        map.drawPills(ctx);

        if (state === PLAYING) {
            mainDraw();
        } else if (state === WAITING && stateChanged) {
            stateChanged = false;
            map.draw(ctx);
            dialog('Press N to start a New game');
        } else if (
            state === EATEN_PAUSE &&
            tick - timerStart > Pacman.FPS / 3
        ) {
            map.draw(ctx);
            setState(PLAYING);
        } else if (state === DYING) {
            if (tick - timerStart > Pacman.FPS * 2) {
                loseLife();
            } else {
                redrawBlock(userPos);
                for (let i = 0, len = ghosts.length; i < len; i += 1) {
                    redrawBlock(ghostPos[i].old);
                    ghostPos.push(ghosts[i].draw(ctx));
                }
                user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2));
            }
        } else if (state === COUNTDOWN) {
            diff = 5 + Math.floor((timerStart - tick) / Pacman.FPS);

            if (diff === 0) {
                map.draw(ctx);
                setState(PLAYING);
            } else {
                if (diff !== lastTime) {
                    lastTime = diff;
                    map.draw(ctx);
                    dialog('Starting in: ' + diff);
                }
            }
        }

        drawFooter();
    }

    function eatenPill() {
        audio.play('eatpill');
        timerStart = tick;
        eatenCount = 0;
        for (let i = 0; i < ghosts.length; i += 1) {
            ghosts[i].makeEatable(ctx);
        }
    }

    function completedLevel() {
        setState(WAITING);
        level += 1;
        map.reset();
        user.newLevel();
        startLevel();
    }

    function keyPress(e: KeyboardEvent) {
        if (state !== WAITING && state !== PAUSE) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function init(wrapper: HTMLElement, root: string, lives: number, onGameOver: (score: number) => void) {
        globalWrapper = wrapper;
        gameOverCallback = onGameOver;
        let i, len, ghost;
        const blockSize = wrapper.offsetWidth / 19;
        const canvas = document.createElement('canvas');

        canvas.setAttribute('width', blockSize * 19 + 'px');
        canvas.setAttribute('height', blockSize * 22 + 30 + 'px');

        wrapper.innerHTML = "";
        wrapper.appendChild(canvas);

        ctx = canvas.getContext('2d');

        audio = new Pacman.Audio({ soundDisabled: soundDisabled });
        map = new Pacman.Map(blockSize);
        user = new Pacman.User(
            {
                completedLevel: completedLevel,
                eatenPill: eatenPill,
            },
            map,
            lives
        );
        
        // Reset state
        ghosts.length = 0;
        tick = 0;
        level = 0;
        
        for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
            ghost = new Pacman.Ghost({ getTick: getTick }, map, ghostSpecs[i]);
            ghosts.push(ghost);
        }

        map.draw(ctx);
        dialog('Loading ...');

        const extension = 'mp3'; 

        const audio_files = [
            ['start', root + 'audio/opening_song.' + extension],
            ['die', root + 'audio/die.' + extension],
            ['eatghost', root + 'audio/eatghost.' + extension],
            ['eatpill', root + 'audio/eatpill.' + extension],
            ['eating', root + 'audio/eating.short.' + extension],
            ['eating2', root + 'audio/eating.short.' + extension],
        ];

        load(audio_files, function () {
            loaded();
        });
    }

    function load(arr: any, callback: () => void) {
        if (arr.length === 0) {
            callback();
        } else {
            const x = arr.pop();
            audio.load(x[0], x[1], function () {
                load(arr, callback);
            });
        }
    }

    function loaded() {
        document.addEventListener('keydown', keyDown, true);
        document.addEventListener('keypress', keyPress, true);

        // Auto start
        startNewGame();
        
        timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
    }
    
    function stop() {
        if (timer) clearInterval(timer);
        document.removeEventListener('keydown', keyDown, true);
        document.removeEventListener('keypress', keyPress, true);
        if (globalWrapper) globalWrapper.innerHTML = "";
    }

    return {
        init: init,
        stop: stop
    };
})();

Pacman.WALL = 0;
Pacman.BISCUIT = 1;
Pacman.EMPTY = 2;
Pacman.BLOCK = 3;
Pacman.PILL = 4;

Pacman.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

Pacman.WALLS = [
    [
        { move: [0, 9.5] },
        { line: [3, 9.5] },
        { curve: [3.5, 9.5, 3.5, 9] },
        { line: [3.5, 8] },
        { curve: [3.5, 7.5, 3, 7.5] },
        { line: [1, 7.5] },
        { curve: [0.5, 7.5, 0.5, 7] },
        { line: [0.5, 1] },
        { curve: [0.5, 0.5, 1, 0.5] },
        { line: [9, 0.5] },
        { curve: [9.5, 0.5, 9.5, 1] },
        { line: [9.5, 3.5] },
    ],

    [
        { move: [9.5, 1] },
        { curve: [9.5, 0.5, 10, 0.5] },
        { line: [18, 0.5] },
        { curve: [18.5, 0.5, 18.5, 1] },
        { line: [18.5, 7] },
        { curve: [18.5, 7.5, 18, 7.5] },
        { line: [16, 7.5] },
        { curve: [15.5, 7.5, 15.5, 8] },
        { line: [15.5, 9] },
        { curve: [15.5, 9.5, 16, 9.5] },
        { line: [19, 9.5] },
    ],

    [{ move: [2.5, 5.5] }, { line: [3.5, 5.5] }],

    [
        { move: [3, 2.5] },
        { curve: [3.5, 2.5, 3.5, 3] },
        { curve: [3.5, 3.5, 3, 3.5] },
        { curve: [2.5, 3.5, 2.5, 3] },
        { curve: [2.5, 2.5, 3, 2.5] },
    ],

    [{ move: [15.5, 5.5] }, { line: [16.5, 5.5] }],

    [
        { move: [16, 2.5] },
        { curve: [16.5, 2.5, 16.5, 3] },
        { curve: [16.5, 3.5, 16, 3.5] },
        { curve: [15.5, 3.5, 15.5, 3] },
        { curve: [15.5, 2.5, 16, 2.5] },
    ],

    [
        { move: [6, 2.5] },
        { line: [7, 2.5] },
        { curve: [7.5, 2.5, 7.5, 3] },
        { curve: [7.5, 3.5, 7, 3.5] },
        { line: [6, 3.5] },
        { curve: [5.5, 3.5, 5.5, 3] },
        { curve: [5.5, 2.5, 6, 2.5] },
    ],

    [
        { move: [12, 2.5] },
        { line: [13, 2.5] },
        { curve: [13.5, 2.5, 13.5, 3] },
        { curve: [13.5, 3.5, 13, 3.5] },
        { line: [12, 3.5] },
        { curve: [11.5, 3.5, 11.5, 3] },
        { curve: [11.5, 2.5, 12, 2.5] },
    ],

    [
        { move: [7.5, 5.5] },
        { line: [9, 5.5] },
        { curve: [9.5, 5.5, 9.5, 6] },
        { line: [9.5, 7.5] },
    ],
    [{ move: [9.5, 6] }, { curve: [9.5, 5.5, 10.5, 5.5] }, { line: [11.5, 5.5] }],

    [
        { move: [5.5, 5.5] },
        { line: [5.5, 7] },
        { curve: [5.5, 7.5, 6, 7.5] },
        { line: [7.5, 7.5] },
    ],
    [{ move: [6, 7.5] }, { curve: [5.5, 7.5, 5.5, 8] }, { line: [5.5, 9.5] }],

    [
        { move: [13.5, 5.5] },
        { line: [13.5, 7] },
        { curve: [13.5, 7.5, 13, 7.5] },
        { line: [11.5, 7.5] },
    ],
    [{ move: [13, 7.5] }, { curve: [13.5, 7.5, 13.5, 8] }, { line: [13.5, 9.5] }],

    [
        { move: [0, 11.5] },
        { line: [3, 11.5] },
        { curve: [3.5, 11.5, 3.5, 12] },
        { line: [3.5, 13] },
        { curve: [3.5, 13.5, 3, 13.5] },
        { line: [1, 13.5] },
        { curve: [0.5, 13.5, 0.5, 14] },
        { line: [0.5, 17] },
        { curve: [0.5, 17.5, 1, 17.5] },
        { line: [1.5, 17.5] },
    ],
    [
        { move: [1, 17.5] },
        { curve: [0.5, 17.5, 0.5, 18] },
        { line: [0.5, 21] },
        { curve: [0.5, 21.5, 1, 21.5] },
        { line: [18, 21.5] },
        { curve: [18.5, 21.5, 18.5, 21] },
        { line: [18.5, 18] },
        { curve: [18.5, 17.5, 18, 17.5] },
        { line: [17.5, 17.5] },
    ],
    [
        { move: [18, 17.5] },
        { curve: [18.5, 17.5, 18.5, 17] },
        { line: [18.5, 14] },
        { curve: [18.5, 13.5, 18, 13.5] },
        { line: [16, 13.5] },
        { curve: [15.5, 13.5, 15.5, 13] },
        { line: [15.5, 12] },
        { curve: [15.5, 11.5, 16, 11.5] },
        { line: [19, 11.5] },
    ],

    [{ move: [5.5, 11.5] }, { line: [5.5, 13.5] }],
    [{ move: [13.5, 11.5] }, { line: [13.5, 13.5] }],

    [
        { move: [2.5, 15.5] },
        { line: [3, 15.5] },
        { curve: [3.5, 15.5, 3.5, 16] },
        { line: [3.5, 17.5] },
    ],
    [
        { move: [16.5, 15.5] },
        { line: [16, 15.5] },
        { curve: [15.5, 15.5, 15.5, 16] },
        { line: [15.5, 17.5] },
    ],

    [{ move: [5.5, 15.5] }, { line: [7.5, 15.5] }],
    [{ move: [11.5, 15.5] }, { line: [13.5, 15.5] }],

    [
        { move: [2.5, 19.5] },
        { line: [5, 19.5] },
        { curve: [5.5, 19.5, 5.5, 19] },
        { line: [5.5, 17.5] },
    ],
    [
        { move: [5.5, 19] },
        { curve: [5.5, 19.5, 6, 19.5] },
        { line: [7.5, 19.5] },
    ],

    [
        { move: [11.5, 19.5] },
        { line: [13, 19.5] },
        { curve: [13.5, 19.5, 13.5, 19] },
        { line: [13.5, 17.5] },
    ],
    [
        { move: [13.5, 19] },
        { curve: [13.5, 19.5, 14, 19.5] },
        { line: [16.5, 19.5] },
    ],

    [
        { move: [7.5, 13.5] },
        { line: [9, 13.5] },
        { curve: [9.5, 13.5, 9.5, 14] },
        { line: [9.5, 15.5] },
    ],
    [
        { move: [9.5, 14] },
        { curve: [9.5, 13.5, 10, 13.5] },
        { line: [11.5, 13.5] },
    ],

    [
        { move: [7.5, 17.5] },
        { line: [9, 17.5] },
        { curve: [9.5, 17.5, 9.5, 18] },
        { line: [9.5, 19.5] },
    ],
    [
        { move: [9.5, 18] },
        { curve: [9.5, 17.5, 10, 17.5] },
        { line: [11.5, 17.5] },
    ],

    [
        { move: [8.5, 9.5] },
        { line: [8, 9.5] },
        { curve: [7.5, 9.5, 7.5, 10] },
        { line: [7.5, 11] },
        { curve: [7.5, 11.5, 8, 11.5] },
        { line: [11, 11.5] },
        { curve: [11.5, 11.5, 11.5, 11] },
        { line: [11.5, 10] },
        { curve: [11.5, 9.5, 11, 9.5] },
        { line: [10.5, 9.5] },
    ],
];