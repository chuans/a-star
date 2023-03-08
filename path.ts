/**
 * Created by Chuans on 2023/3/7
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 19:41
 * Desc:
 */
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

interface IPathNode extends IGrid {
    F: number;
    G: number;
    H: number;
    cost: number;
    parent: IPathNode;
    key: string;
}


class Path {
    private nodeMap: Map<string, IPathNode>;
    
    private openList: Map<string, IPathNode>;
    private closeList: Map<string, IPathNode>;
    
    /**
     * 水平方向和斜边的数值，通过勾股定理可以计算
     * 设水平格子的长宽为 10
     * 那么斜边就等于 = c = √￣(a^2 + b^2)  ≈ 14.14 取整方便运算
     * @private
     */
    private HORIZONTAL_DIR: number = 10;
    private OBLIQUE_DIR: number = 14;
    
    private startPoint: IPathNode;
    private endPoint: IPathNode;
    
    /**
     * 开始搜索路径
     */
    public startSearchPath(start: IGrid, end: IGrid, nodeMap: Map<string, IGrid>) {
        this.updateGridMapInfo(nodeMap);
        const lastNode = this.calc(this.startPoint);
    
        console.log(lastNode);
    }
    
    private updateGridMapInfo(gridMap: Map<string, IGrid>) {
        gridMap.forEach((node, key) => {
            this.nodeMap.set(key, {
                ...node,
                F: 0,
                G: 0,
                H: 0,
                cost: 0,
                key,
                parent: null
            });
        });
    }
    
    /**
     * 开始计算
     * @private
     */
    private calc(currentNode: IPathNode): IPathNode {
        if (!currentNode) {
            // 如果都算完了 都没找到终点说明找不到一条可达路径
            return null;
        }
        
        // 1：将开始节 A 点放入打开列表
        if (!this.openList.has(currentNode.key)) {
            this.openList.set(currentNode.key, currentNode);
        }
        
        // 2：查找 A 点周围的格子并设置开始为开始节点为他们的父节点
        const aroundNode: IPathNode[] = this.getAroundNodesByNode(this.startPoint);
        
        // 3：把 A 节点加入关闭列表，并在打开列表中删除
        this.openList.delete(currentNode.key);
        this.closeList.set(currentNode.key, this.startPoint);
        
        // 4 计算节点的各项值 F G H，以及其他处理
        for (let i = 0; i < aroundNode.length; i++) {
            const node = aroundNode[ i ];
            
            if (this.closeList.get(node.key)) {
                aroundNode.splice(i, 1);
                i--;
                continue;
            }
            
            // 设置他们的父节点
            node.parent = this.startPoint;
            
            // 在这里优先判断一下是否找到了终点，如果有终点 则直接返回终点的 node
            if (node.type === EGridPointType.End) {
                return node;
            }
            
            this.setValueF(node);
            // 放入打开列表
            this.openList.set(node.key, node);
        }
        
        // 5 拿到当前打开列表里面 F 值最低的点，设置为当前节点
        const lowestInfo = ['', 99999];
        
        for (const [key, node] of this.openList) {
            if (node.F < lowestInfo[ 1 ]) {
                lowestInfo[ 0 ] = key;
                lowestInfo[ 1 ] = node.F;
            }
        }
        
        this.calc(this.openList.get(lowestInfo[ 0 ] as string));
    }
    
    /**
     * 获取节点的 F 值
     * 轴差相加就等于曼哈顿距离（水平垂直距离相加）
     * @private  1,0  9,9  8,9
     */
    private setValueF(node: IPathNode) {
        const { xPoint, yPoint } = this.endPoint;
        const { xPoint: curX, yPoint: curY } = node;
        const parent = node.parent;
        // H 值固定不变
        node.H = Math.abs(xPoint - curX) + Math.abs(yPoint - curY);
        
        // 如果大于 1 则一定是斜边，否则就是水平或者垂直
        const distance = Math.pow(node.xPoint - parent.xPoint, 2) + Math.pow(node.yPoint - parent.yPoint, 2);
        // G 起点到当前点的代价总和
        node.G = (distance === 1 ? this.HORIZONTAL_DIR : this.OBLIQUE_DIR) + parent.G;
        
        node.F = node.G + node.H;
    }
    
    /**
     * 通过给定节点获取给定节点周围的节点
     * @param node
     * @private
     */
    private getAroundNodesByNode(node: IPathNode): IPathNode[] {
        /**
         * 获取四边 + 四个斜边的角
         * 上右下左 上左 上右 下右 下左
         */
        const dirPosList: number[][] = [[0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]];
        const result: IPathNode[] = [];
        
        for (let i = 0; i < dirPosList.length; i++) {
            const dir = dirPosList[ i ];
            const _node = this.nodeMap.get(`${ node.xPoint + dir[ 0 ] }-${ node.yPoint + dir[ 1 ] }`);
            
            if (_node && _node.type === EGridPointType.Normal) {
                result.push(_node);
            }
        }
        
        return result;
    }
}
