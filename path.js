var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Path {
    constructor() {
        this.nodeMap = new Map();
        this.openList = new Map();
        this.closeList = new Map();
        /**
         * 水平方向和斜边的数值，通过勾股定理可以计算
         * 设水平格子的长宽为 10
         * 那么斜边就等于 = c = √￣(a^2 + b^2)  ≈ 14.14 取整方便运算
         * @private
         */
        this.HORIZONTAL_DIR = 10;
        this.OBLIQUE_DIR = 14;
        this.baseNodeValue = {
            F: 0,
            G: 0,
            H: 0,
            key: '',
            parent: null
        };
    }
    /**
     * 开始搜索路径
     */
    startSearchPath(start, end, nodeMap, isQuickPass) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isQuickPass = isQuickPass;
            this.openList.clear();
            this.closeList.clear();
            this.nodeMap.clear();
            return new Promise(resolve => {
                this.startPoint = Object.assign(Object.assign(Object.assign({}, start), this.baseNodeValue), { key: `${start.xPoint}-${start.yPoint}` });
                this.endPoint = Object.assign(Object.assign(Object.assign({}, end), this.baseNodeValue), { key: `${end.xPoint}-${end.yPoint}` });
                this.updateNodeMapInfo(nodeMap);
                const startT = Date.now();
                const lastNode = this.calc(this.startPoint);
                const endT = Date.now();
                if (!lastNode) {
                    return resolve({
                        ok: false
                    });
                }
                return resolve({
                    ok: true,
                    // 通过回溯路径找到最短的一条
                    paths: Path.getFinalPathByNode(lastNode),
                    time: endT - startT
                });
            });
        });
    }
    updateNodeMapInfo(gridMap) {
        gridMap.forEach((node, key) => {
            this.nodeMap.set(key, Object.assign(Object.assign(Object.assign({}, node), this.baseNodeValue), { key }));
        });
    }
    /**
     * 开始计算
     * @private
     */
    calc(currentNode) {
        if (!currentNode) {
            // 如果都算完了 都没找到终点说明找不到一条可达路径
            return null;
        }
        // 1：将开始节 A 点放入打开列表
        if (!this.openList.has(currentNode.key)) {
            this.openList.set(currentNode.key, currentNode);
        }
        // 2：查找 A 点周围的格子并设置开始为开始节点为他们的父节点
        const aroundNode = this.getAroundNodesByNode(currentNode);
        // 3：把 A 节点加入关闭列表，并在打开列表中删除
        this.openList.delete(currentNode.key);
        this.closeList.set(currentNode.key, currentNode);
        // 4 计算节点的各项值 F G H，以及其他处理
        // 5 检测点是否在开启列表里面，并计算
        // 6 通过计算新进入打开列表的点的代价值是否更低 如果更低则启用 否则不变
        // 7 一直循环直到找到终点
        for (let i = 0; i < aroundNode.length; i++) {
            const node = aroundNode[i];
            if (this.closeList.get(node.key)) {
                aroundNode.splice(i, 1);
                i--;
                continue;
            }
            const historyParent = node.parent;
            // 设置他们的父节点
            node.parent = currentNode;
            // 在这里优先判断一下是否找到了终点，如果有终点 则直接返回终点的 node
            if (node.type === EGridPointType.End) {
                return node;
            }
            const { F, G, H } = this.getPathValueInfo(node);
            if (node.F !== 0 && F > node.F) {
                node.parent = historyParent;
            }
            else {
                node.F = F;
                node.G = G;
                node.H = H;
            }
            // 放入打开列表
            this.openList.set(node.key, node);
        }
        // 5 拿到当前打开列表里面 F 值最低的点，设置为当前节点
        const lowestInfo = ['', 99999];
        for (const [key, node] of this.openList) {
            if (node.F < lowestInfo[1]) {
                lowestInfo[0] = key;
                lowestInfo[1] = node.F;
            }
        }
        return this.calc(this.openList.get(lowestInfo[0]));
    }
    /**
     * 获取节点的 F 值
     * 轴差相加就等于曼哈顿距离（水平垂直距离相加）
     * @private  1,0  9,9  8,9
     */
    getPathValueInfo(node) {
        const { xPoint, yPoint } = this.endPoint;
        const { xPoint: curX, yPoint: curY } = node;
        const parent = node.parent;
        // H 值固定不变
        const H = Math.abs(xPoint - curX) + Math.abs(yPoint - curY);
        // 如果大于 1 则一定是斜边，否则就是水平或者垂直
        const distance = Math.pow(node.xPoint - parent.xPoint, 2) + Math.pow(node.yPoint - parent.yPoint, 2);
        // G 起点到当前点的代价总和
        const G = (distance === 1 ? this.HORIZONTAL_DIR : this.OBLIQUE_DIR) + parent.G;
        const F = G + H;
        return { F, G, H };
    }
    /**
     * 通过给定节点获取给定节点周围的节点
     * @param node
     * @private
     */
    getAroundNodesByNode(node) {
        /**
         * 获取四边 + 四个斜边的角
         * 上右下左 上左 上右 下右 下左
         * 如果关闭了快速通过，则旁边有墙的话 就不能走斜边 「玩法之一」
         */
        const dirPosList = [
            // 上
            [0, -1],
            // 右
            [1, 0],
            // 下
            [0, 1],
            // 左
            [-1, 0],
            // 上左 上 左
            [-1, -1, 0, -1, -1, 0],
            // 上右 上 右
            [1, -1, 0, -1, 1, 0],
            // 下右 右 下
            [1, 1, 1, 0, 0, 1],
            // 下左 下 左
            [-1, 1, 0, 1, -1, 0]
        ];
        const result = [];
        for (let i = 0; i < dirPosList.length; i++) {
            const dir = dirPosList[i];
            const _node = this.nodeMap.get(`${node.xPoint + dir[0]}-${node.yPoint + dir[1]}`);
            const isNormal = _node && _node.type !== EGridPointType.Wall;
            if (isNormal) {
                if (!this.isQuickPass && dir.length > 2) {
                    const other1 = this.nodeMap.get(`${node.xPoint + dir[2]}-${node.yPoint + dir[3]}`);
                    const other2 = this.nodeMap.get(`${node.xPoint + dir[4]}-${node.yPoint + dir[5]}`);
                    if ((other1 && other1.type !== EGridPointType.Wall) && (other2 && other2.type !== EGridPointType.Wall)) {
                        result.push(_node);
                    }
                }
                else {
                    result.push(_node);
                }
            }
        }
        return result;
    }
    static getFinalPathByNode(lastNode) {
        const pathNodes = [];
        let cur = lastNode;
        while (cur.parent) {
            pathNodes.push(cur);
            cur = cur.parent;
        }
        pathNodes.shift();
        pathNodes.reverse();
        return pathNodes;
    }
}
