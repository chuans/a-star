/**
 * Created by Chuans on 2023/3/2
 * Author: Chuans
 * Github: https://github.com/chuans
 * Time: 17:51
 * Desc:
 */
class AStartGame {
    public ctx2d: CanvasRenderingContext2D;
    
    constructor(private selector: string) {
        this.initCanvas();
    }
    
    private initCanvas() {
        const canvas: HTMLCanvasElement = document.querySelector(this.selector);
        if (!canvas) {
            console.error('当前浏览器不支持 Canvas，或者找不到 Dom');
            return
        }
        
        this.ctx2d = canvas.getContext('2d');
    }
}
