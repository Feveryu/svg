const editDom: any = document.getElementById('svgActiveOperation');

enum EditType {
    Translate = 'translate',
    Rotate = 'rotate',
    TopLeft = 'topLeft',
    TopCenter = 'topCenter',
    TopRight = 'topRight',
    CenterLeft = 'centerLeft',
    CenterRight = 'centerRight',
    BottomLeft = 'bottomLeft',
    BottomCenter = 'bottomCenter',
    BottomRight = 'bottomRight',
}

class StartSymmetricPointClass {
    topLeft: number[];
    topCenter: number[];
    topRight: number[];
    centerLeft: number[];
    centerRight: number[];
    bottomLeft: number[];
    bottomCenter: number[];
    bottomRight: number[];
}

class EditDragInfoModel {
    editDom: any;
    svgPath: SVGPathModel;

    dragStartPoint: number[];
    dragEndPoint: number[];
    center: number[];
    startSymmetricPoints: StartSymmetricPointClass;
    offsetX: number;
    offsetY: number;
    startRotateDeg: number;
    endRotateDeg: number;
    rotateDeg: number;
}

interface IPaintingDoms {
    svgPath: SVGPathElement;
    hitDom: SVGPathElement;
    editDom: HTMLElement;
}

interface IPaintingDomArgs {
    level: number;
    hitAreaLevel: number;
    pathColor: string;
    hoverColor: string;
    drawMode: DrawMode;
    DRAG_AREA_EXTEND: number;

    start: number[];
    end: number[];
    length: number;
    center: number[];
    rotateDeg: number;
    width: number;
    height: number;
    // domWidth: number;
    // domHeight: number;
    offsetX: number;
    offsetY: number;
}

class SvgEditController {
    private _editDomNode: HTMLElement[] = editDom.children;

    private _editType: EditType = EditType.Translate;

    private _editDragInfo: EditDragInfoModel;

    private _newDomArgs: IPaintingDomArgs;

    constructor() {
        // 不知道为什么不起作用，在下面做了兼容
        // editDom.onmousedown = (e) => {
        //     e.stopPropagation();
        //     this.setEditType(EditType.Translate);
        // };
        this._editDomNode[0].onmousedown = () => {
            this.setEditType(EditType.TopCenter);
        };
        this._editDomNode[1].onmousedown = () => {
            this.setEditType(EditType.BottomCenter);
        };
        this._editDomNode[2].onmousedown = () => {
            this.setEditType(EditType.CenterLeft);
        };
        this._editDomNode[3].onmousedown = () => {
            this.setEditType(EditType.CenterRight);
        };
        this._editDomNode[4].onmousedown = () => {
            this.setEditType(EditType.TopLeft);
        };
        this._editDomNode[5].onmousedown = () => {
            this.setEditType(EditType.TopRight);
        };
        this._editDomNode[6].onmousedown = () => {
            this.setEditType(EditType.BottomLeft);
        };
        this._editDomNode[7].onmousedown = () => {
            this.setEditType(EditType.BottomRight);
        };
        this._editDomNode[8].onmousedown = () => {
            this.setEditType(EditType.Rotate);
        };
    }

    public bindEvent() {
        document.onmousedown = this._onMousedown;
        document.onmouseup = this._onMouseup;
        document.onmousemove = this._onMousemove;
        window.onkeydown = (e) => {
            if (drawer.isEditMode && 46 === e.keyCode) {
                drawer.deleteNode(this._editDragInfo.svgPath.id);
                this.exitEditMode();
            }
        };
    }

    public resetEvent() {
        drawer.bindEvent();
    }

    public exitEditMode() {
        drawer.isEditMode = false;
        this._cleanDomEvent();
    }

    public setEditType(type: EditType) {
        this._editType = type;
    }

    public setSvgPath(svgPath: SVGPathModel, e) {
        this._editDragInfo = {
            ...new EditDragInfoModel(),
            svgPath,
            editDom,
        };
        this._cleanDomEvent();
        this.setEditType(EditType.Translate);
        this._setOuterDiv();
        this._addEvent();
        this._bindEditDom();
        this._onMousedown(e);
    }

    public refreshEditDom() {
        this._setOuterDiv();
    }

    private _getAngelAByDot(a: number[], b: number[], c: number[]) {
        const offsetX = c[0] - a[0];
        const offsetY = c[1] - a[1];
        const angleA = MathClass.getAngleADeg(a, b, c);
        return offsetY > 0 ? angleA : offsetY === 0 ? (offsetX > 0 ? 0 : 180) : 360 - angleA;
    }

    private _getStartSymmetricPoint() {
        const editDragInfo = this._editDragInfo;
        const center = this._editDragInfo.svgPath.dragInfo.center;
        const width = editDragInfo.svgPath.dragInfo.width;
        const height = editDragInfo.svgPath.dragInfo.height;
        const rotateDeg = editDragInfo.svgPath.svgRotateDeg;
        let topLeft = [center[0] - width / 2, center[1] - height / 2];
        topLeft = MathClass.getRotatePoint(center, topLeft, rotateDeg);
        let topCenter = [center[0], center[1] - height / 2];
        topCenter = MathClass.getRotatePoint(center, topCenter, rotateDeg);
        let topRight = [center[0] + width / 2, center[1] - height / 2];
        topRight = MathClass.getRotatePoint(center, topRight, rotateDeg);
        let centerLeft = [center[0] - width / 2, center[1]];
        centerLeft = MathClass.getRotatePoint(center, centerLeft, rotateDeg);
        let centerRight = [center[0] + width / 2, center[1]];
        centerRight = MathClass.getRotatePoint(center, centerRight, rotateDeg);
        let bottomLeft = [center[0] - width / 2, center[1] + height / 2];
        bottomLeft = MathClass.getRotatePoint(center, bottomLeft, rotateDeg);
        let bottomCenter = [center[0], center[1] + height / 2];
        bottomCenter = MathClass.getRotatePoint(center, bottomCenter, rotateDeg);
        let bottomRight = [center[0] + width / 2, center[1] + height / 2];
        bottomRight = MathClass.getRotatePoint(center, bottomRight, rotateDeg);
        return {
            topLeft,
            topCenter,
            topRight,
            centerLeft,
            centerRight,
            bottomLeft,
            bottomCenter,
            bottomRight,
        };
    }

    private _setStartPosition(e: {x: number; y: number}) {
        const relativePosition = MarkerCommon.getRelativePosition(svgDom, e);
        const dragStartPoint = [relativePosition.x, relativePosition.y];
        const center = this._editDragInfo.svgPath.dragInfo.center;
        let startSymmetricPoints = this._getStartSymmetricPoint();
        const rotateDeg = this._editDragInfo.svgPath.svgRotateDeg;

        Object.assign(this._editDragInfo, {
            dragStartPoint,
            startRotateDeg: this._getAngelAByDot(center, [center[0] + 1, center[1]], dragStartPoint),
            startSymmetricPoints,
            rotateDeg,
        });
    }

    private _setEndPosition(e: {x: number; y: number}) {
        const relativePosition = MarkerCommon.getRelativePosition(svgDom, e);
        const startPoint = this._editDragInfo.dragStartPoint;
        const dragEndPoint = [relativePosition.x, relativePosition.y];
        const offsetX = dragEndPoint[0] - startPoint[0];
        const offsetY = dragEndPoint[1] - startPoint[1];

        Object.assign(this._editDragInfo, {
            dragEndPoint,
            offsetX,
            offsetY,
        });
    }

    private _cleanDomEvent() {
        editDom.style.display = 'none';
        for (let i = 0; i < this._editDomNode.length; i++) {
            let currentDom: HTMLElement = this._editDomNode[i];
            currentDom.style.display = 'none';
        }
    }

    private _setOuterDiv() {
        const s = this._editDragInfo.svgPath;
        // const p = s.dragDom;
        const args = MarkerCommon.getEditDomArgs({
            width: s.config.drawMode === DrawMode.Arrow ? s.dragInfo.length : s.dragInfo.width,
            height: s.config.drawMode === DrawMode.Arrow ? s.config.level * 4 : s.dragInfo.height,
            center: s.dragInfo.center,
            rotateDeg: s.svgRotateDeg,
            DRAG_AREA_EXTEND: s.config.DRAG_AREA_EXTEND,
        });

        editDom.style.display = 'block';
        editDom.style.width = args.width;
        editDom.style.height = args.height;
        editDom.style.transform = args.transform;
    }

    private _addEvent() {
        switch (this._editDragInfo.svgPath.config.drawMode) {
            case DrawMode.Arrow:
                this._bindArrowEvent();
                break;
            case DrawMode.Rect:
                this._bindRectEvent();
                break;
            case DrawMode.Circle:
                this._bindCircleEvent();
                break;
            default:
                throw new Error('unknow type');
        }
    }

    private _bindArrowEvent() {
        this._editDomNode[2].style.display = 'block';
        this._editDomNode[3].style.display = 'block';
        this._editDomNode[8].style.display = 'block';
    }

    private _bindCircleEvent() {
        for (let i = 0; i < this._editDomNode.length; i++) {
            this._editDomNode[i].style.display = 'block';
        }
    }

    private _bindRectEvent() {
        for (let i = 0; i < this._editDomNode.length; i++) {
            this._editDomNode[i].style.display = 'block';
        }
    }

    private _bindEditDom() {
        this._editDragInfo.editDom.onmousedown = this._onMousedown;
    }

    private _onMousedown = (e) => {
        console.log('edit onmousedown');
        document.getElementsByTagName('body')[0].style.userSelect = 'none';
        e.stopPropagation();
        this._setStartPosition(e);
        this.bindEvent();
    };

    private _onMouseup = (e) => {
        console.log('edit onmouseup');
        document.getElementsByTagName('body')[0].style.userSelect = 'auto';
        this._setEndPosition(e);
        this._draw();
        this._updateSvgPath();
        this.setEditType(EditType.Translate);
        this.resetEvent();
    };

    private _onMousemove = (e) => {
        console.log('edit onmousemove');
        this._setEndPosition(e);
        this._draw();
    };

    private _updateSvgPath() {
        this._editDragInfo.svgPath.svgRotateDeg = this._newDomArgs.rotateDeg % 360;
        // this._editDragInfo.svgPath.dragDom.domWidth = this._newDomArgs.domWidth;
        // this._editDragInfo.svgPath.dragDom.domHeight = this._newDomArgs.domHeight;
        this._editDragInfo.svgPath.dragInfo.start = this._newDomArgs.start;
        this._editDragInfo.svgPath.dragInfo.end = this._newDomArgs.end;
        this._editDragInfo.svgPath.dragInfo.center = this._newDomArgs.center;
        this._editDragInfo.svgPath.dragInfo.length = this._newDomArgs.length;
        this._editDragInfo.svgPath.dragInfo.width = this._newDomArgs.width;
        this._editDragInfo.svgPath.dragInfo.height = this._newDomArgs.height;
        this._editDragInfo.svgPath.dragInfo.offsetX = this._newDomArgs.offsetX;
        this._editDragInfo.svgPath.dragInfo.offsetY = this._newDomArgs.offsetY;
    }

    private _draw() {
        switch (this._editType) {
            case EditType.Translate:
                this._updateTranslation(this._editDragInfo);
                break;
            case EditType.Rotate:
                this._updateRotate(this._editDragInfo);
                break;
            case EditType.TopLeft:
                this._updateCorner(this._editDragInfo);
                break;
            case EditType.TopCenter:
                this._updateVerticalTop(this._editDragInfo);
                break;
            case EditType.TopRight:
                this._updateCorner(this._editDragInfo);
                break;
            case EditType.CenterLeft:
                this._updateHorizontalLeft(this._editDragInfo);
                break;
            case EditType.CenterRight:
                this._updateHorizontalRight(this._editDragInfo);
                break;
            case EditType.BottomLeft:
                this._updateCorner(this._editDragInfo);
                break;
            case EditType.BottomCenter:
                this._updateVerticalBottom(this._editDragInfo);
                break;
            case EditType.BottomRight:
                this._updateCorner(this._editDragInfo);
                break;
            default:
                throw new Error('unknow edit type');
        }
    }

    private _updateTranslation(editDragInfo: EditDragInfoModel) {
        const start = editDragInfo.svgPath.dragInfo.start;
        const end = editDragInfo.svgPath.dragInfo.end;
        const pointCompare = MarkerCommon.getPointCompareInfo(
            [start[0] + editDragInfo.offsetX, start[1] + editDragInfo.offsetY],
            [end[0] + editDragInfo.offsetX, end[1] + editDragInfo.offsetY],
            editDragInfo.svgPath.config.level
        );

        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                // ...editDragInfo.svgPath.dragDom,
                ...pointCompare,
                width: editDragInfo.svgPath.dragInfo.width,
                height: editDragInfo.svgPath.dragInfo.height,
                rotateDeg: editDragInfo.svgPath.svgRotateDeg
            }
        );
    }

    private _updateRotate(editDragInfo: EditDragInfoModel) {
        const center = editDragInfo.svgPath.dragInfo.center;
        const start = editDragInfo.svgPath.dragInfo.start;
        const end = editDragInfo.svgPath.dragInfo.end;
        editDragInfo.endRotateDeg = this._getAngelAByDot(center, [center[0] + 1, center[1]], editDragInfo.dragEndPoint);
        let newRotateDeg =
            editDragInfo.svgPath.svgRotateDeg + editDragInfo.endRotateDeg - editDragInfo.startRotateDeg;
        newRotateDeg = newRotateDeg < 0 ? newRotateDeg + 360 : newRotateDeg;
        const newStart = MathClass.getRotatePoint(center, start, newRotateDeg);
        const newEnd = MathClass.getRotatePoint(center, end, newRotateDeg);
        const pointCompare = MarkerCommon.getPointCompareInfo(newStart, newEnd, editDragInfo.svgPath.config.level);

        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                // ...editDragInfo.svgPath.dragDom,
                ...pointCompare,
                rotateDeg: newRotateDeg,
                width: editDragInfo.svgPath.dragInfo.width,
                height: editDragInfo.svgPath.dragInfo.height,
            }
        );
    }

    private _updateCorner(editDragInfo: EditDragInfoModel) {
        const rotateDeg = editDragInfo.svgPath.svgRotateDeg;
        const startPoint = MarkerCommon.getStartSymmetricPointByPoint(
            editDragInfo.startSymmetricPoints,
            this._editType
        );
        const endPointBefore = editDragInfo.dragEndPoint;
        const endPointAfter = MathClass.getRotatePoint(startPoint, endPointBefore, -rotateDeg);
        const centerBefore = [(startPoint[0] + endPointBefore[0]) / 2, (startPoint[1] + endPointBefore[1]) / 2];
        const centerAfter = [(startPoint[0] + endPointAfter[0]) / 2, (startPoint[1] + endPointAfter[1]) / 2];
        const offset = [centerBefore[0] - centerAfter[0], centerBefore[1] - centerAfter[1]];
        const pointCompare = MarkerCommon.getPointCompareInfo(
            [startPoint[0] + offset[0], startPoint[1] + offset[1]],
            [endPointAfter[0] + offset[0], endPointAfter[1] + offset[1]],
            editDragInfo.svgPath.config.level
        );
        // const domWidth = pointCompare.width + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = pointCompare.height + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                ...pointCompare,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateVerticalTop(editDragInfo: EditDragInfoModel) {
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.rotateDeg;
        const centerLeft = editDragInfo.startSymmetricPoints.centerLeft;
        const offset = [centerLeft[0] - center[0], centerLeft[1] - center[1]];
        const relativePoint = MathClass.getRelativePoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const endBefore = [relativePoint[0] + offset[0], relativePoint[1] + offset[1]];
        const startBefore = editDragInfo.startSymmetricPoints.bottomRight;
        const centerAfter = [(startBefore[0] + endBefore[0]) / 2, (startBefore[1] + endBefore[1]) / 2];
        const pointCompare = MarkerCommon.getPointCompareInfo(
            MathClass.getRotatePoint(centerAfter, startBefore, -rotateDeg),
            MathClass.getRotatePoint(centerAfter, endBefore, -rotateDeg),
            editDragInfo.svgPath.config.level
        );
        // const domWidth = pointCompare.width + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = pointCompare.height + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                ...pointCompare,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateVerticalBottom(editDragInfo: EditDragInfoModel) {
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.rotateDeg;
        const centerLeft = editDragInfo.startSymmetricPoints.centerLeft;
        const offset = [centerLeft[0] - center[0], centerLeft[1] - center[1]];
        const relativePoint = MathClass.getRelativePoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const endBefore = [relativePoint[0] + offset[0], relativePoint[1] + offset[1]];
        const startBefore = editDragInfo.startSymmetricPoints.topRight;
        const centerAfter = [(startBefore[0] + endBefore[0]) / 2, (startBefore[1] + endBefore[1]) / 2];
        const pointCompare = MarkerCommon.getPointCompareInfo(
            MathClass.getRotatePoint(centerAfter, startBefore, -rotateDeg),
            MathClass.getRotatePoint(centerAfter, endBefore, -rotateDeg),
            editDragInfo.svgPath.config.level
        );
        // const domWidth = pointCompare.width + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = pointCompare.height + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                ...pointCompare,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateHorizontalLeft(editDragInfo: EditDragInfoModel) {
        if (editDragInfo.svgPath.config.drawMode === DrawMode.Arrow) {
            this._updateHorizontalLeftArrow(editDragInfo);
        } else {
            this._updateHorizontalLeftNormal(editDragInfo);
        }
    }

    private _updateHorizontalRight(editDragInfo: EditDragInfoModel) {
        if (editDragInfo.svgPath.config.drawMode === DrawMode.Arrow) {
            this._updateHorizontalRightArrow(editDragInfo);
        } else {
            this._updateHorizontalRightNormal(editDragInfo);
        }
    }

    private _updateHorizontalLeftNormal(editDragInfo: EditDragInfoModel) {
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.rotateDeg;
        const bottomCenter = editDragInfo.startSymmetricPoints.bottomCenter;
        const offset = [bottomCenter[0] - center[0], bottomCenter[1] - center[1]];
        const relativePoint = MathClass.getRelativeHorizontalPoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const endBefore = [relativePoint[0] + offset[0], relativePoint[1] + offset[1]];
        const startBefore = editDragInfo.startSymmetricPoints.topRight;
        const centerAfter = [(startBefore[0] + endBefore[0]) / 2, (startBefore[1] + endBefore[1]) / 2];
        const pointCompare = MarkerCommon.getPointCompareInfo(
            MathClass.getRotatePoint(centerAfter, startBefore, -rotateDeg),
            MathClass.getRotatePoint(centerAfter, endBefore, -rotateDeg),
            editDragInfo.svgPath.config.level
        );
        // const domWidth = pointCompare.width + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = pointCompare.height + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                ...pointCompare,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateHorizontalLeftArrow(editDragInfo: EditDragInfoModel) {
        const centerRight = editDragInfo.startSymmetricPoints.centerRight;
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.svgPath.svgRotateDeg;
        const start = MathClass.getRelativeHorizontalPoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const pointCompare = MarkerCommon.getPointCompareInfo(start, centerRight, editDragInfo.svgPath.config.level);
        // const domWidth = pointCompare.length + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = editDragInfo.svgPath.dragDom.domHeight;

        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                // ...editDragInfo.svgPath.dragDom,
                ...pointCompare,
                width: pointCompare.length,
                height: editDragInfo.svgPath.dragInfo.height,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateHorizontalRightNormal(editDragInfo: EditDragInfoModel) {
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.rotateDeg;
        const bottomCenter = editDragInfo.startSymmetricPoints.bottomCenter;
        const offset = [bottomCenter[0] - center[0], bottomCenter[1] - center[1]];
        const relativePoint = MathClass.getRelativeHorizontalPoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const endBefore = [relativePoint[0] + offset[0], relativePoint[1] + offset[1]];
        const startBefore = editDragInfo.startSymmetricPoints.topLeft;
        const centerAfter = [(startBefore[0] + endBefore[0]) / 2, (startBefore[1] + endBefore[1]) / 2];
        const pointCompare = MarkerCommon.getPointCompareInfo(
            MathClass.getRotatePoint(centerAfter, startBefore, -rotateDeg),
            MathClass.getRotatePoint(centerAfter, endBefore, -rotateDeg),
            editDragInfo.svgPath.config.level
        );
        // const domWidth = pointCompare.width + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = pointCompare.height + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                ...pointCompare,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateHorizontalRightArrow(editDragInfo: EditDragInfoModel) {
        const centerLeft = editDragInfo.startSymmetricPoints.centerLeft;
        const center = editDragInfo.svgPath.dragInfo.center;
        const rotateDeg = editDragInfo.svgPath.svgRotateDeg;
        const start = MathClass.getRelativeHorizontalPoint(center, editDragInfo.dragEndPoint, rotateDeg);
        const pointCompare = MarkerCommon.getPointCompareInfo(start, centerLeft, editDragInfo.svgPath.config.level);
        // const domWidth = pointCompare.length + editDragInfo.svgPath.config.DRAG_AREA_EXTEND;
        // const domHeight = editDragInfo.svgPath.dragDom.domHeight;

        this._updateDom(
            {
                svgPath: editDragInfo.svgPath.dom,
                hitDom: editDragInfo.svgPath.hitDom,
                editDom: editDragInfo.editDom,
            },
            {
                ...editDragInfo.svgPath.config,
                // ...editDragInfo.svgPath.dragDom,
                ...pointCompare,
                width: pointCompare.length,
                height: editDragInfo.svgPath.dragInfo.height,
                rotateDeg,
                // domWidth,
                // domHeight,
            }
        );
    }

    private _updateDom(doms: IPaintingDoms, domArgs: IPaintingDomArgs) {
        this._newDomArgs = domArgs;

        switch (domArgs.drawMode) {
            case DrawMode.Arrow:
                this._redrawArrow(doms, domArgs);
                break;
            case DrawMode.Rect:
                this._redrawRect(doms, domArgs);
                break;
            case DrawMode.Circle:
                this._redrawCircle(doms, domArgs);
                break;
            default:
                throw new Error('unknow type _updateDom');
        }
    }

    private _redrawArrow(doms: IPaintingDoms, domArgs: IPaintingDomArgs) {
        const dStr = MarkerCommon.getArrowPath({
            length: domArgs.length,
            level: domArgs.level,
        });
        doms.svgPath.setAttributeNS(null, 'd', dStr);
        doms.svgPath.setAttributeNS(null, 'stroke-width', String(domArgs.level));
        doms.svgPath.setAttributeNS(null, 'stroke', domArgs.pathColor);
        doms.svgPath.setAttributeNS(null, 'fill', domArgs.pathColor);
        doms.svgPath.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        doms.hitDom.setAttributeNS(null, 'd', dStr);
        doms.hitDom.setAttributeNS(null, 'stroke-width', String(domArgs.hitAreaLevel));
        doms.hitDom.setAttributeNS(null, 'stroke', 'transparent');
        doms.hitDom.setAttributeNS(null, 'fill', 'transparent');
        doms.hitDom.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        const args = MarkerCommon.getEditDomArgs({...domArgs, height: domArgs.level * 4, width: domArgs.length});
        doms.editDom.style.width = args.width;
        doms.editDom.style.height = args.height;
        doms.editDom.style.transform = args.transform;
    }

    private _redrawRect(doms: IPaintingDoms, domArgs: IPaintingDomArgs) {
        const str = MarkerCommon.getRectPath({
            width: domArgs.width,
            height: domArgs.height,
        });
        doms.svgPath.setAttributeNS(null, 'd', str);
        doms.svgPath.setAttributeNS(null, 'stroke-width', String(domArgs.level));
        doms.svgPath.setAttributeNS(null, 'stroke', domArgs.pathColor);
        doms.svgPath.setAttributeNS(null, 'fill', 'none');
        doms.svgPath.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        doms.hitDom.setAttributeNS(null, 'd', str);
        doms.hitDom.setAttributeNS(null, 'stroke-width', String(domArgs.hitAreaLevel));
        doms.hitDom.setAttributeNS(null, 'stroke', 'transparent');
        doms.hitDom.setAttributeNS(null, 'fill', 'transparent');
        doms.hitDom.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        const args = MarkerCommon.getEditDomArgs(domArgs);
        doms.editDom.style.width = args.width;
        doms.editDom.style.height = args.height;
        doms.editDom.style.transform = args.transform;
    }

    private _redrawCircle(doms: IPaintingDoms, domArgs: IPaintingDomArgs) {
        const str = MarkerCommon.getCirclePath({
            width: domArgs.width,
            height: domArgs.height,
        });
        doms.svgPath.setAttributeNS(null, 'd', str);
        doms.svgPath.setAttributeNS(null, 'stroke-width', String(domArgs.level));
        doms.svgPath.setAttributeNS(null, 'stroke', domArgs.pathColor);
        // fill需要填写none，为了达到悬浮边线才激活选中状态
        doms.svgPath.setAttributeNS(null, 'fill', 'none');
        doms.svgPath.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        doms.hitDom.setAttributeNS(null, 'd', str);
        doms.hitDom.setAttributeNS(null, 'stroke-width', String(domArgs.hitAreaLevel));
        doms.hitDom.setAttributeNS(null, 'stroke', 'transparent');
        doms.hitDom.setAttributeNS(null, 'fill', 'transparent');
        doms.hitDom.setAttributeNS(
            null,
            'transform',
            `translate(${domArgs.center.join(',')}) rotate(${domArgs.rotateDeg})`
        );

        const args = MarkerCommon.getEditDomArgs(domArgs);
        doms.editDom.style.width = args.width;
        doms.editDom.style.height = args.height;
        doms.editDom.style.transform = args.transform;
    }
}

const svgEditController = new SvgEditController();
