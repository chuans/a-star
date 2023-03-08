/**
 * Created by Chuans on 2023/3/2
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 17:51
 * Desc:
 */

interface ICallbackFn {
    click: (item: IGrid, key: string) => void;
}

interface IConfig {
    w?: number,
    h?: number,
    // x 轴上的 点数量
    xPointSize?: number;
    // y 轴上的 点数量
    yPointSize?: number;
    // 障碍物的数量，根据数量随机生成
    wallSize?: number;
    on?: ICallbackFn;
}

enum EGridPointType {
    // 默认可移动的点
    Normal = 1,
    // 不可移动的点 障碍物
    Wall,
    // 走过的路径
    Move,
    // 起点
    Start,
    // 终点
    End
}

interface IGrid {
    type: EGridPointType;
    // 格子当前颜色
    color: string;
    // x 点数坐标
    xPoint: number;
    // y 点数坐标
    yPoint: number;
    // 格子的像素起点 x 坐标
    xStartPx: number;
    // 格子的像素起点 y 坐标
    yStartPx: number;
    // 当前格子的 path 路径
    path2D: Path2D;
}

const WALL_COLOR = '#000';
const MOVE_PATH_COLOR = '#3aff33';
const START_POINT_COLOR = 'red';
const END_POINT_COLOR = 'green';

class AStartGame {
    public canvas: HTMLCanvasElement;
    public ctx2d: CanvasRenderingContext2D;
    public gridMap: Map<string, IGrid> = new Map();
    private config: IConfig = {
        w: 800,
        h: 600,
        xPointSize: 30,
        yPointSize: 20,
        wallSize: 100,
        on: {
            click: () => {
            }
        }
    };
    private path: Path = null;
    private xInterval: number;
    private yInterval: number;
    
    // 设置开始结束的状态
    private isSetStart: boolean = false;
    // 设置一个索引，true为开始 false为结束
    private setPointType: boolean = true;
    
    private startPoint: IGrid = null;
    private endPoint: IGrid = null;
    
    constructor(private selector: string, config: IConfig = {}) {
        this.config = { ...this.config, ...config };
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
    public onUpdateGridType(item: IGrid, key: string) {
        const grid = this.gridMap.get(key);
        if (this.isSetStart) {
            if (this.setPointType) {
                grid.type = EGridPointType.Start;
                grid.color = START_POINT_COLOR;
                this.startPoint = grid;
            } else {
                grid.type = EGridPointType.End;
                grid.color = END_POINT_COLOR;
                this.endPoint = grid;
            }
            
            this.setPointType = !this.setPointType;
            if (this.setPointType) this.isSetStart = false;
            return;
        }
        
        const isWall = grid.type === EGridPointType.Wall;
        if (isWall) {
            grid.type = EGridPointType.Normal;
            grid.color = '#fff';
        } else {
            grid.type = EGridPointType.Wall;
            grid.color = WALL_COLOR;
        }
        
    }
    
    /**
     * 重置当前所有点，并重新随机生成
     */
    public onReset() {
        this.initGridData();
        this.updateView();
    }
    
    /**
     * 手动设置开始和结束点
     */
    public onSetStartAndEndPoint() {
        this.isSetStart = true;
        this.gridMap.forEach((grid: IGrid) => {
            if (grid.type === EGridPointType.Start || grid.type === EGridPointType.End) {
                grid.type = EGridPointType.Normal;
                grid.color = '#fff';
            }
        });
    }
    
    /**
     * 设置更新基础配置
     */
    public onUpdateConfig(config: IConfig) {
        this.config = { ...this.config, ...config };
        
        this.initData();
        this.initCanvas();
        this.initGridData();
    }
    
    /**
     * 开始计算路径，并显示可移动路径
     */
    public onPlayMove() {
        this.path.startSearchPath();
    }
    
    /**
     * 初始化一些相当于固定的数据
     * @private
     */
    private initData() {
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
    private initCanvas() {
        const canvas: HTMLCanvasElement = document.querySelector(this.selector);
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
    private initGridData() {
        const { xPointSize, yPointSize } = this.config;
        let wallSize = this.config.wallSize;
        this.gridMap.clear();
        
        for (let i = 0; i < yPointSize; i++) {
            for (let j = 0; j < xPointSize; j++) {
                const item: IGrid = {
                    type: EGridPointType.Normal,
                    color: '#fff',
                    xPoint: j,
                    yPoint: i,
                    xStartPx: j * this.xInterval,
                    yStartPx: i * this.yInterval,
                    path2D: new Path2D()
                };
                item.path2D.rect(item.xStartPx, item.yStartPx, this.xInterval, this.yInterval);
                this.gridMap.set(`${ j }-${ i }`, item);
            }
        }
        const start = this.getMapKeyByPos(0, 0);
        const end = this.getMapKeyByPos(xPointSize - 1, yPointSize - 1);
        // 这里就固定设置起点和终点
        start.type = EGridPointType.Start;
        start.color = START_POINT_COLOR;
        end.type = EGridPointType.Start;
        end.color = END_POINT_COLOR;
        this.startPoint = start;
        this.endPoint = end;
        
        // 简单设置下障碍点
        while (wallSize > 0) {
            const x = this.getRandom(0, xPointSize);
            const y = this.getRandom(0, yPointSize);
            const grid: IGrid = this.getMapKeyByPos(x, y);
            
            if (grid.type === EGridPointType.Normal) {
                grid.type = EGridPointType.Wall;
                grid.color = WALL_COLOR;
                wallSize--;
            }
        }
    }
    
    private onBindEvent() {
        this.canvas.onclick = (e: MouseEvent) => {
            const { offsetX: x, offsetY: y } = e;
            
            this.gridMap.forEach((grid: IGrid, key) => {
                if (this.ctx2d.isPointInPath(grid.path2D, x, y)) {
                    this.config.on.click({ ...grid }, key);
                }
            });
        };
    }
    
    /**
     * 画 x 和 y 轴的间隔线
     * @private
     */
    private drawBackLine() {
        const ctx: CanvasRenderingContext2D = this.ctx2d;
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
    private drawGrid() {
        const ctx: CanvasRenderingContext2D = this.ctx2d;
        
        this.gridMap.forEach((grid, key) => {
            const { color, xStartPx, yStartPx } = grid;
            ctx.fillStyle = color;
            ctx.fillRect(xStartPx, yStartPx, this.xInterval, this.yInterval);
        });
    }
    
    /**
     * 全局更新视图，根据帧率自动刷新
     */
    private updateView = () => {
        this.ctx2d.clearRect(0, 0, this.config.w, this.config.h);
        this.drawGrid();
        this.drawBackLine();
        // 渲染
        requestAnimationFrame(this.updateView);
    };
    
    
    private getRandom: (min: number, max: number) => number = (min, max) => {
        return Math.floor(Math.random() * max) + min;
    };
    
    /**
     * 通过坐标获取节点
     * @private
     */
    private getMapKeyByPos(a: number | string, b: number | string) {
        return this.gridMap.get(`${ a }-${ b }`);
    }
}
