let isDraw = false;

declare const svgDom: SVGElement;
declare const main: HTMLElement;
declare const basicNumber: number;

enum DrawMode {
    Arrow = 'arrow',
    Rect = 'rect',
    Circle = 'circle',
}

class DragInfoModel {
    start: number[];
    end: number[];
    center: number[];
    width: number;
    height: number;
    length: number;
    offsetX: number;
    offsetY: number;
}

// class DragDomInfoModel {
//     domWidth: number;
//     domHeight: number;
//     translate: number[];
//     rotateDeg: number;
// }

class SVGPathModel {
    id: string;

    dragInfo: DragInfoModel;

    dom: SVGPathElement;
    parent: SVGGElement;
    hitDom: SVGPathElement;

    config: SVGPathConfigModel;

    svgRotateDeg: number;
    // dragDom: DragDomInfoModel;
}

class SVGPathConfigModel {
    level: number;
    hitAreaLevel: number;
    pathColor: string;
    hoverColor: string;
    drawMode: DrawMode;
    DRAG_AREA_EXTEND: number;
}

class Drawer {
    private static _instance: Drawer;
    private _svgPath: SVGPathModel;
    private _nodeMap: Map<string, SVGPathModel> = new Map();

    private _isDragging = false;
    public isEditMode = false;

    private _config: SVGPathConfigModel = {
        ...new SVGPathConfigModel(),
        level: 3,
        hitAreaLevel: 53,
        pathColor: '#f00',
        hoverColor: '#ff0',
        drawMode: DrawMode.Arrow,
        DRAG_AREA_EXTEND: 20,
    };

    public static get instance() {
        if (!this._instance) {
            this._instance = new Drawer();
        }
        return this._instance;
    }

    public bindEvent() {
        document.onmousedown = this._onMousedown;
        document.onmouseup = this._onMouseup;
        document.onmousemove = this._onMousemove;
    }

    public removeEvent() {
        document.onmousedown = null;
        document.onmouseup = null;
        document.onmousemove = null;
    }

    public setMode(mode: DrawMode) {
        this._config.drawMode = mode;
    }

    public deleteNode(id: string) {
        if (this._nodeMap.has(id)) {
            const svgPath = this._nodeMap.get(id);
            svgPath.parent.parentNode.removeChild(svgPath.parent);
            this._nodeMap.delete(id);
        } else {
            console.log('删除失败，点不存在');
        }
    }

    public deleteAll() {

    }

    private _getAngelAByDot(a: number[], b: number[], c: number[]) {
        const offsetX = c[0] - a[0];
        const offsetY = c[1] - a[1];
        const angleA = MathClass.getAngleADeg(a, b, c);
        return offsetY > 0 ? angleA : offsetY === 0 ? (offsetX > 0 ? 0 : 180) : 360 - angleA;
    }

    private _addSVGPath(svgPath: SVGPathModel) {
        this._nodeMap.set(svgPath.id, svgPath);
    }

    private _startDrag() {
        this._isDragging = true;
    }

    private _dragEnd() {
        this._isDragging = false;
    }

    private _setStartPosition(e: {x: number; y: number}) {
        const relativePosition = MarkerCommon.getRelativePosition(svgDom, e);
        this._svgPath.dragInfo.start = [
            relativePosition.x ,
            relativePosition.y ,
        ];
    }

    private _setEndPosition(e: {x: number; y: number}) {
        const relativePosition = MarkerCommon.getRelativePosition(svgDom, e);
        const pointCompare = MarkerCommon.getPointCompareInfo(
            this._svgPath.dragInfo.start,
            [relativePosition.x, relativePosition.y],
            this._config.level
        );

        Object.assign(this._svgPath.dragInfo, {
            end: pointCompare.end,
            center: pointCompare.center,
            width: pointCompare.width,
            height: pointCompare.height,
            length: pointCompare.length,
            offsetX: pointCompare.offsetX,
            offsetY: pointCompare.offsetY,
        });
    }

    // private _setDomSize(svgPath: SVGPathModel, width?, height?, deg?) {
    //     const domWidth = width || svgPath.dragInfo.width;
    //     const domHeight = height || svgPath.dragInfo.height;
    //     svgPath.dragDom.domWidth = domWidth + this._config.DRAG_AREA_EXTEND;
    //     svgPath.dragDom.domHeight = domHeight + this._config.DRAG_AREA_EXTEND;
    //     if (typeof deg === 'number') {
    //         svgPath.dragDom.rotateDeg = deg;
    //     }
    // }

    private _onMousedown = (e) => {
        console.log('_onMousedown');
        if (this.isEditMode) {
            svgEditController.exitEditMode();
            this.isEditMode = false;
            return;
        }

        this._startDrag();

        /*
        mouseSvgPath
         增加隐藏的鼠标区域层，扩大事件范围
         G
        用G包裹起来方便管理
         */
        const id = String(Date.now());
        this._svgPath = {
            id,
            dragInfo: new DragInfoModel(),
            ...new SVGPathModel(),
            // dragDom: {
            //     ...new DragDomInfoModel(),
            //     rotateDeg: 0,
            // },
            svgRotateDeg: 0,
            dom: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
        };
        this._setStartPosition(e);
        this._svgPath.dom.setAttributeNS(null, 'id', id);
        this._svgPath.hitDom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._svgPath.hitDom.setAttributeNS(null, 'stroke-width', String(this._config.hitAreaLevel));
        this._svgPath.hitDom.setAttributeNS(null, 'stroke', 'transparent');
        this._svgPath.hitDom.setAttributeNS(null, 'fill', 'transparent');
        this._svgPath.hitDom.setAttributeNS(null, 'id', 'clickArea');
        this._svgPath.parent = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this._svgPath.parent.setAttributeNS(null, 'pointer-events', 'stroke');
        this._svgPath.parent.appendChild(this._svgPath.dom);
        this._svgPath.parent.appendChild(this._svgPath.hitDom);
        svgDom.appendChild(this._svgPath.parent);
    };

    private _onMouseup = (e) => {
        if (!this._svgPath || !this._svgPath.dragInfo || !this._svgPath.dragInfo.start) return;

        this._dragEnd();
        this._setEndPosition(e);

        if (this._svgPath.dragInfo.length < 10) {
            svgDom.removeChild(this._svgPath.parent);
            this._svgPath = null;
        } else {
            /*
            mouseup的时候添加鼠标悬浮事件
            * 使用嵌套函数封锁svgPath状态
            * 如果是拖拽过程中不激活选中状态
             */
            const config = {
                ...this._config,
            };
            this._svgPath.config = config;
            const svgPath = this._svgPath;
            this._svgPath = null;
            // const offset = config.DRAG_AREA_EXTEND / 2;
            // svgPath.dragDom.translate = [svgPath.dragInfo.width / 2 + offset, svgPath.dragInfo.height / 2 + offset];
            svgPath.hitDom.onmouseover = () => {
                if (this._isDragging) return;
                svgPath.dom.setAttributeNS(null, 'stroke', config.hoverColor);
                if (config.drawMode === 'arrow') {
                    svgPath.dom.setAttributeNS(null, 'fill', config.hoverColor);
                }
            };
            svgPath.hitDom.onmouseout = () => {
                svgPath.dom.setAttributeNS(null, 'stroke', config.pathColor);
                if (config.drawMode === 'arrow') {
                    svgPath.dom.setAttributeNS(null, 'fill', config.pathColor);
                }
            };
            svgPath.hitDom.onmousedown = (e) => {
                this.isEditMode = true;
                svgEditController.setSvgPath(svgPath, e);
            };
            this._addSVGPath(svgPath);
        }
    };

    private _onMousemove = (e) => {
        if (!this._svgPath || !this._svgPath.dragInfo || !this._svgPath.dragInfo.start) return;
        this._setEndPosition(e);
        this._updatePath(this._svgPath);
    };

    private _updatePath(svgPath: SVGPathModel) {
        if (!isDraw) {
            isDraw = true;
            setTimeout(() => {
                this._draw(svgPath);
                isDraw = false;
            }, 50);
        }
    }

    private _draw(svgPath: SVGPathModel) {
        switch (this._config.drawMode) {
            case 'arrow':
                this._drawArrow(svgPath);
                break;
            case 'rect':
                this._drawRect(svgPath);
                break;
            case 'circle':
                this._drawCircle(svgPath);
                break;
            default:
                throw new Error('unknow mode');
        }
    }

    private _drawDragArea(svgPath: SVGPathModel) {
        svgPath.hitDom.setAttributeNS(null, 'd', svgPath.dom.getAttribute('d'));
        svgPath.hitDom.setAttributeNS(null, 'transform', svgPath.dom.getAttribute('transform'));
    }

    private _drawArrow(svgPath: SVGPathModel) {
        const config = this._config;
        const str = MarkerCommon.getArrowPath({
            length: svgPath.dragInfo.length,
            level: this._config.level,
        });
        const rotateDeg = this._getAngelAByDot(
            svgPath.dragInfo.start,
            [svgPath.dragInfo.start[0] + 1, svgPath.dragInfo.start[1]],
            svgPath.dragInfo.end
        );
        svgPath.dom.setAttributeNS(null, 'd', str);
        svgPath.dom.setAttributeNS(null, 'stroke-width', String(config.level));
        svgPath.dom.setAttributeNS(null, 'stroke', config.pathColor);
        svgPath.dom.setAttributeNS(null, 'fill', config.pathColor);
        svgPath.dom.setAttributeNS(
            null,
            'transform',
            `translate(${svgPath.dragInfo.center.join(',')}) rotate(${rotateDeg})`
        );
        svgPath.svgRotateDeg = rotateDeg
        // this._setDomSize(svgPath, svgPath.dragInfo.length, 4 * config.level, rotateDeg);
        this._drawDragArea(svgPath);
        // document
    }

    private _drawCircle(svgPath: SVGPathModel) {
        const config = this._config;
        const str = MarkerCommon.getCirclePath({
            width: svgPath.dragInfo.width,
            height: svgPath.dragInfo.height,
        });
        svgPath.dom.setAttributeNS(null, 'd', str);
        svgPath.dom.setAttributeNS(null, 'stroke-width', String(config.level));
        svgPath.dom.setAttributeNS(null, 'stroke', config.pathColor);
        // fill需要填写none，为了达到悬浮边线才激活选中状态
        svgPath.dom.setAttributeNS(null, 'fill', 'none');
        svgPath.dom.setAttributeNS(null, 'transform', `translate(${svgPath.dragInfo.center.join(',')})`);
        // this._setDomSize(svgPath);
        this._drawDragArea(svgPath);
    }

    private _drawRect(svgPath: SVGPathModel) {
        const config = this._config;
        const str = MarkerCommon.getRectPath({
            width: svgPath.dragInfo.width,
            height: svgPath.dragInfo.height,
        });

        svgPath.dom.setAttributeNS(null, 'd', str);
        svgPath.dom.setAttributeNS(null, 'stroke-width', String(config.level));
        svgPath.dom.setAttributeNS(null, 'stroke', config.pathColor);
        svgPath.dom.setAttributeNS(null, 'fill', 'none');
        svgPath.dom.setAttributeNS(null, 'transform', `translate(${svgPath.dragInfo.center.join(',')})`);
        // this._setDomSize(svgPath);
        this._drawDragArea(svgPath);
    }
}

const drawer = new Drawer();
