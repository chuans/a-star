/**
 * Created by Chuans on 2023/3/2
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 17:51
 * Desc:
 */

interface IConfig {
    w?: number,
    h?: number,
    // x 轴上的 点数量
    xPointSize?: number;
    // y 轴上的 点数量
    yPointSize?: number;
    // 障碍物的数量，根据数量随机生成
    wallSize?: number;
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
    // 格子的像素终点 x 坐标
    xEndPx: number;
    // 格子的像素终点 y 坐标
    yEndPx: number;
}

class AStartGame {
    public ctx2d: CanvasRenderingContext2D;
    public gridMap: IGrid[][] = [];
    private readonly config: IConfig = {
        w: 800,
        h: 600,
        xPointSize: 30,
        yPointSize: 20,
        wallSize: 100
    };
    private xInterval: number;
    private yInterval: number;
    
    constructor(private selector: string, config: IConfig = {}) {
        this.config = { ...this.config, ...config };
        
        this.initData();
        this.initCanvas();
        this.initGridData();
        this.updateView();
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
        
        for (let i = 0; i < yPointSize; i++) {
            const arr: IGrid[] = [];
            for (let j = 0; j < xPointSize; j++) {
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
        this.gridMap[ 0 ][ 0 ].type = EGridPointType.Start
        this.gridMap[ 0 ][ 0 ].color = 'red'
        this.gridMap[ yPointSize-1 ][ xPointSize-1 ].type = EGridPointType.Start
        this.gridMap[ yPointSize-1 ][ xPointSize-1 ].color = 'green'
        
        // 简单设置下障碍点
        while (wallSize > 0) {
            const x = this.getRandom(0, xPointSize);
            const y = this.getRandom(0, yPointSize);
            const grid: IGrid = this.gridMap[ y ][ x ];
            
            if (grid.type === EGridPointType.Normal) {
                grid.type = EGridPointType.Wall;
                grid.color = '#000';
                wallSize--;
            }
        }
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
        
        for (let i = 0; i < this.gridMap.length; i++) {
            const row = this.gridMap[ i ];
            
            for (let j = 0; j < row.length; j++) {
                const { color, xStartPx, xEndPx, yStartPx, yEndPx } = row[ j ];
                ctx.fillStyle = color;
                ctx.fillRect(xStartPx, yStartPx, xEndPx, yEndPx);
            }
        }
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
}
