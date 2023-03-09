/**
 * Created by Chuans on 2023/3/2
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 17:51
 * Desc:
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var EGridPointType;
(function (EGridPointType) {
    // 默认可移动的点
    EGridPointType[EGridPointType["Normal"] = 1] = "Normal";
    // 不可移动的点 障碍物
    EGridPointType[EGridPointType["Wall"] = 2] = "Wall";
    // 走过的路径
    EGridPointType[EGridPointType["Move"] = 3] = "Move";
    // 起点
    EGridPointType[EGridPointType["Start"] = 4] = "Start";
    // 终点
    EGridPointType[EGridPointType["End"] = 5] = "End";
})(EGridPointType || (EGridPointType = {}));
const WALL_COLOR = '#000';
const MOVE_PATH_COLOR = '#3aff33';
const START_POINT_COLOR = 'red';
const END_POINT_COLOR = 'green';
class AStartGame {
    constructor(selector, config = {}) {
        this.selector = selector;
        this.gridMap = new Map();
        this.config = {
            w: 800,
            h: 600,
            xPointSize: 30,
            yPointSize: 20,
            wallSize: 100,
            showPosition: false,
            isQuickPass: true,
            on: {
                click: () => {
                }
            }
        };
        this.path = null;
        // 设置开始结束的状态
        this.isSetStart = false;
        // 设置一个索引，true为开始 false为结束
        this.setPointType = true;
        this.startPoint = null;
        this.endPoint = null;
        /**
         * 全局更新视图，根据帧率自动刷新
         */
        this.updateView = () => {
            this.ctx2d.clearRect(0, 0, this.config.w, this.config.h);
            this.drawGrid();
            this.drawBackLine();
            // 渲染
            requestAnimationFrame(this.updateView);
        };
        this.getRandom = (min, max) => {
            return Math.floor(Math.random() * max) + min;
        };
        this.config = Object.assign(Object.assign({}, this.config), config);
        this.path = new Path();
        this.initData();
        this.initCanvas();
        this.initGridData();
        this.onBindEvent();
        this.updateView();
    }
    /**
     * 实时修改当前格子为 墙壁，或者设置为普通路径
     * @param item
     * @param key
     */
    onUpdateGridType(item, key) {
        const grid = this.gridMap.get(key);
        if (this.isSetStart) {
            if (this.setPointType) {
                grid.type = EGridPointType.Start;
                grid.color = START_POINT_COLOR;
                this.startPoint = grid;
            }
            else {
                grid.type = EGridPointType.End;
                grid.color = END_POINT_COLOR;
                this.endPoint = grid;
            }
            this.setPointType = !this.setPointType;
            if (this.setPointType)
                this.isSetStart = false;
            return;
        }
        const isWall = grid.type === EGridPointType.Wall;
        if (isWall) {
            grid.type = EGridPointType.Normal;
            grid.color = '#fff';
        }
        else {
            grid.type = EGridPointType.Wall;
            grid.color = WALL_COLOR;
        }
    }
    /**
     * 重置当前所有点，并重新随机生成
     */
    onReset() {
        this.initData();
        this.initCanvas();
        this.initGridData();
    }
    /**
     * 手动设置开始和结束点
     */
    onSetStartAndEndPoint() {
        this.isSetStart = true;
        this.gridMap.forEach((grid) => {
            if (grid.type === EGridPointType.Start || grid.type === EGridPointType.End) {
                grid.type = EGridPointType.Normal;
                grid.color = '#fff';
            }
        });
    }
    /**
     * 设置更新基础配置
     */
    onUpdateConfig(config) {
        this.config = Object.assign(Object.assign({}, this.config), config);
        this.initData();
        this.initCanvas();
        this.initGridData();
    }
    onSetQuickPass(isQuick) {
        this.config.isQuickPass = isQuick;
    }
    /**
     * 开始计算路径，并显示可移动路径
     */
    onPlayMove(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.path.startSearchPath(this.startPoint, this.endPoint, this.gridMap, this.config.isQuickPass);
            if (result.ok) {
                cb(result.ok, result.time);
                console.log(result);
                this.startRenderMovePath(result.paths);
            }
            else {
                cb(false);
            }
        });
    }
    /**
     * 初始化一些相当于固定的数据
     * @private
     */
    initData() {
        const { w, h, xPointSize, yPointSize } = this.config;
        // x 轴上的线是纵向的，所以需要知道 x 轴的间隔值
        this.xInterval = w / xPointSize;
        // y 轴同理
        this.yInterval = h / yPointSize;
    }
    /**
     * 初始化 canvas 结构，并获取画布
     * @private
     */
    initCanvas() {
        const canvas = document.querySelector(this.selector);
        if (!canvas) {
            console.error('当前浏览器不支持 Canvas，或者找不到 Dom');
            return;
        }
        canvas.height = this.config.h;
        canvas.width = this.config.w;
        this.ctx2d = canvas.getContext('2d');
        this.canvas = canvas;
    }
    /**
     * 初始化核心数据
     * 1：初始化每个格子的数据 二维数组
     * 2：设置格子的类型 type
     *      a：type=1 可移动的点
     *      b：type=2 墙壁 不可移动的点
     *      c：type=3 当前的走过的路径
     * @private
     */
    initGridData() {
        const { xPointSize, yPointSize } = this.config;
        let wallSize = this.config.wallSize;
        this.gridMap.clear();
        for (let i = 0; i < yPointSize; i++) {
            for (let j = 0; j < xPointSize; j++) {
                const item = {
                    type: EGridPointType.Normal,
                    color: '#fff',
                    xPoint: j,
                    yPoint: i,
                    xStartPx: j * this.xInterval,
                    yStartPx: i * this.yInterval,
                    path2D: new Path2D()
                };
                item.path2D.rect(item.xStartPx, item.yStartPx, this.xInterval, this.yInterval);
                this.gridMap.set(`${j}-${i}`, item);
            }
        }
        const start = this.getMapKeyByPos(0, 0);
        const end = this.getMapKeyByPos(xPointSize - 1, yPointSize - 1);
        // 这里就固定设置起点和终点
        start.type = EGridPointType.Start;
        start.color = START_POINT_COLOR;
        end.type = EGridPointType.End;
        end.color = END_POINT_COLOR;
        this.startPoint = start;
        this.endPoint = end;
        // 简单设置下障碍点
        while (wallSize > 0) {
            const x = this.getRandom(0, xPointSize);
            const y = this.getRandom(0, yPointSize);
            const grid = this.getMapKeyByPos(x, y);
            if (grid.type === EGridPointType.Normal) {
                grid.type = EGridPointType.Wall;
                grid.color = WALL_COLOR;
                wallSize--;
            }
        }
    }
    onBindEvent() {
        this.canvas.onclick = (e) => {
            const { offsetX: x, offsetY: y } = e;
            this.gridMap.forEach((grid, key) => {
                if (this.ctx2d.isPointInPath(grid.path2D, x, y)) {
                    this.config.on.click(Object.assign({}, grid), key);
                }
            });
        };
    }
    /**
     * 开始路径动画
     * @private
     */
    startRenderMovePath(paths) {
        let i = 0;
        const timer = setInterval(() => {
            if (!paths[i]) {
                clearInterval(timer);
                return;
            }
            const gd = this.gridMap.get(paths[i].key);
            gd.type = EGridPointType.Move;
            gd.color = MOVE_PATH_COLOR;
            i++;
        }, 100);
    }
    /**
     * 画 x 和 y 轴的间隔线
     * @private
     */
    drawBackLine() {
        const ctx = this.ctx2d;
        const { w, h, xPointSize, yPointSize } = this.config;
        ctx.beginPath();
        for (let i = 1; i < xPointSize; i++) {
            const px = i * this.xInterval;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
        }
        for (let i = 1; i < yPointSize; i++) {
            const py = i * this.yInterval;
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#c7c7c7';
        ctx.stroke();
        ctx.closePath();
    }
    /**
     * 画格子的内容
     * @private
     */
    drawGrid() {
        const ctx = this.ctx2d;
        this.gridMap.forEach((grid, key) => {
            const { color, xStartPx, yStartPx } = grid;
            ctx.fillStyle = color;
            ctx.fillRect(xStartPx, yStartPx, this.xInterval, this.yInterval);
        });
        if (!this.config.showPosition)
            return;
        this.gridMap.forEach((grid) => {
            const { type, xStartPx, xPoint, yPoint, yStartPx } = grid;
            if (type !== EGridPointType.Normal) {
                ctx.fillStyle = '#fff';
            }
            else {
                ctx.fillStyle = '#000';
            }
            ctx.fillText(`${xPoint}-${yPoint}`, xStartPx + 2, yStartPx + 15);
        });
    }
    /**
     * 通过坐标获取节点
     * @private
     */
    getMapKeyByPos(a, b) {
        return this.gridMap.get(`${a}-${b}`);
    }
}
