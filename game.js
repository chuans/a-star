/**
 * Created by Chuans on 2023/3/2
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 17:51
 * Desc:
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var AStartGame = /** @class */ (function () {
    function AStartGame(selector, config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        this.selector = selector;
        this.gridMap = [];
        this.config = {
            w: 800,
            h: 600,
            xPointSize: 30,
            yPointSize: 20,
            wallSize: 100
        };
        /**
         * 全局更新视图，根据帧率自动刷新
         */
        this.updateView = function () {
            _this.ctx2d.clearRect(0, 0, _this.config.w, _this.config.h);
            _this.drawGrid();
            _this.drawBackLine();
            // 渲染
            requestAnimationFrame(_this.updateView);
        };
        this.getRandom = function (min, max) {
            return Math.floor(Math.random() * max) + min;
        };
        this.config = __assign(__assign({}, this.config), config);
        this.initData();
        this.initCanvas();
        this.initGridData();
        this.onBindEvent();
        this.updateView();
    }
    /**
     * 初始化一些相当于固定的数据
     * @private
     */
    AStartGame.prototype.initData = function () {
        var _a = this.config, w = _a.w, h = _a.h, xPointSize = _a.xPointSize, yPointSize = _a.yPointSize;
        // x 轴上的线是纵向的，所以需要知道 x 轴的间隔值
        this.xInterval = w / xPointSize;
        // y 轴同理
        this.yInterval = h / yPointSize;
    };
    /**
     * 初始化 canvas 结构，并获取画布
     * @private
     */
    AStartGame.prototype.initCanvas = function () {
        var canvas = document.querySelector(this.selector);
        if (!canvas) {
            console.error('当前浏览器不支持 Canvas，或者找不到 Dom');
            return;
        }
        canvas.height = this.config.h;
        canvas.width = this.config.w;
        this.ctx2d = canvas.getContext('2d');
        this.canvas = canvas;
    };
    /**
     * 初始化核心数据
     * 1：初始化每个格子的数据 二维数组
     * 2：设置格子的类型 type
     *      a：type=1 可移动的点
     *      b：type=2 墙壁 不可移动的点
     *      c：type=3 当前的走过的路径
     * @private
     */
    AStartGame.prototype.initGridData = function () {
        var _a = this.config, xPointSize = _a.xPointSize, yPointSize = _a.yPointSize;
        var wallSize = this.config.wallSize;
        for (var i = 0; i < yPointSize; i++) {
            var arr = [];
            for (var j = 0; j < xPointSize; j++) {
                arr.push({
                    type: EGridPointType.Normal,
                    color: '#fff',
                    xPoint: j,
                    yPoint: i,
                    xStartPx: j * this.xInterval,
                    yStartPx: i * this.yInterval,
                    xEndPx: (j + 1) * this.xInterval,
                    yEndPx: (i + 1) * this.yInterval
                });
            }
            this.gridMap.push(arr);
        }
        // 这里就固定设置起点和终点
        this.gridMap[0][0].type = EGridPointType.Start;
        this.gridMap[0][0].color = 'red';
        this.gridMap[yPointSize - 1][xPointSize - 1].type = EGridPointType.Start;
        this.gridMap[yPointSize - 1][xPointSize - 1].color = 'green';
        // 简单设置下障碍点
        while (wallSize > 0) {
            var x = this.getRandom(0, xPointSize);
            var y = this.getRandom(0, yPointSize);
            var grid = this.gridMap[y][x];
            if (grid.type === EGridPointType.Normal) {
                grid.type = EGridPointType.Wall;
                grid.color = '#000';
                wallSize--;
            }
        }
    };
    AStartGame.prototype.onBindEvent = function () {
        var _this = this;
        this.canvas.onmousedown = function (e) {
            var x = e.offsetX, y = e.offsetY;
            // 判断（x,y）是否在路径heartPath中
            var isIn = _this.ctx2d.isPointInPath(_this.heartPath, x, y);
            if (isIn) {
                _this.eventMapList.hover.forEach(function (item) {
                    item();
                });
            }
            else {
                _this.eventMapList.leave.forEach(function (item) {
                    item();
                });
            }
        };
    };
    /**
     * 画 x 和 y 轴的间隔线
     * @private
     */
    AStartGame.prototype.drawBackLine = function () {
        var ctx = this.ctx2d;
        var _a = this.config, w = _a.w, h = _a.h, xPointSize = _a.xPointSize, yPointSize = _a.yPointSize;
        ctx.beginPath();
        for (var i = 1; i < xPointSize; i++) {
            var px = i * this.xInterval;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
        }
        for (var i = 1; i < yPointSize; i++) {
            var py = i * this.yInterval;
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#c7c7c7';
        ctx.stroke();
        ctx.closePath();
    };
    /**
     * 画格子的内容
     * @private
     */
    AStartGame.prototype.drawGrid = function () {
        var ctx = this.ctx2d;
        for (var i = 0; i < this.gridMap.length; i++) {
            var row = this.gridMap[i];
            for (var j = 0; j < row.length; j++) {
                var _a = row[j], color = _a.color, xStartPx = _a.xStartPx, xEndPx = _a.xEndPx, yStartPx = _a.yStartPx, yEndPx = _a.yEndPx;
                ctx.fillStyle = color;
                ctx.fillRect(xStartPx, yStartPx, xEndPx, yEndPx);
            }
        }
    };
    return AStartGame;
}());
