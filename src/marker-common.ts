class MarkerCommon {
    public static getElementViewPosition(element) {
        let actualLeft, current, elementScrollLeft, left, actualTop, elementScrollTop, right;
        //计算x坐标
        actualLeft = element.offsetLeft;
        current = element.offsetParent;
        while (current !== null) {
            actualLeft += current.offsetLeft + current.clientLeft;
            current = current.offsetParent;
        }
        if (document.compatMode == 'BackCompat') {
            elementScrollLeft = document.body.scrollLeft;
        } else {
            elementScrollLeft = document.documentElement.scrollLeft;
        }
        left = actualLeft - elementScrollLeft;
        //计算y坐标
        actualTop = element.offsetTop;
        current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop + current.clientTop;
            current = current.offsetParent;
        }
        if (document.compatMode == 'BackCompat') {
            elementScrollTop = document.body.scrollTop;
        } else {
            elementScrollTop = document.documentElement.scrollTop;
        }
        right = actualTop - elementScrollTop;
        //返回结果
        return {x: left, y: right};
    }

    public static getNewOffset(offsetX, offsetY) {
        const aspectRatio = main.clientWidth / main.clientHeight;
        const newOffsetX = offsetX / (main.clientWidth / (aspectRatio * basicNumber * 2)) - aspectRatio * basicNumber;
        const newOffsetY = offsetY / (main.clientHeight / (basicNumber * 2)) - basicNumber;

        return {
            x: newOffsetX,
            y: newOffsetY,
        };
    }

    public static getRealisticPointByWorld(worldPoint: number[]) {
        const aspectRatio = main.clientWidth / main.clientHeight;
        const realisticPointX =
            (worldPoint[0] + aspectRatio * basicNumber) * (main.clientWidth / (aspectRatio * basicNumber * 2));
        const realisticPointY = (worldPoint[1] + basicNumber) * (main.clientHeight / (basicNumber * 2));

        return [realisticPointX, realisticPointY];
    }

    public static getEditDomArgs(svgDomArgs: {
        width: number;
        height: number;
        rotateDeg: number;
        center: number[];
        DRAG_AREA_EXTEND: number;
    }) {
        const aspectRatio = main.clientWidth / main.clientHeight;
        const realisticCenter = this.getRealisticPointByWorld(svgDomArgs.center);
        const realisticWidth =
            (svgDomArgs.width + svgDomArgs.DRAG_AREA_EXTEND) * (main.clientWidth / (aspectRatio * basicNumber * 2));
        const realisticHeight =
            (svgDomArgs.height + svgDomArgs.DRAG_AREA_EXTEND) * (main.clientHeight / (basicNumber * 2));
        const relativeTranslate1 = {x: -realisticWidth / 2, y: -realisticHeight / 2};

        return {
            width: `${realisticWidth}px`,
            height: `${realisticHeight}px`,
            transform: `translate(${relativeTranslate1.x}px, ${relativeTranslate1.y}px) translate(${realisticCenter[0]}px, ${realisticCenter[1]}px) rotate(${svgDomArgs.rotateDeg}deg)`,
        };
    }

    public static getRelativePosition(dom: any, e: any) {
        const elementViewPosition = this.getElementViewPosition(dom.parentNode);
        let offsetX = e.clientX - elementViewPosition.x;
        let offsetY = e.clientY - elementViewPosition.y;
        console.log(offsetX, offsetX);
        offsetX = offsetX > 0 ? (offsetX < dom.parentNode.clientWidth ? offsetX : dom.parentNode.clientWidth) : 0;
        offsetY = offsetY > 0 ? (offsetY < dom.parentNode.clientHeight ? offsetY : dom.parentNode.clientHeight) : 0;
        return this.getNewOffset(offsetX, offsetY);
        // return {
        //     x: offsetX,
        //     y: offsetY
        // };
    }

    public static getPointCompareInfo(start: number[], end: number[], minLevel: number) {
        const startPoint = start;
        // const endPoint = [end[0] < 0 ? 0 : end[0], end[1] < 0 ? 0 : end[1]];
        const endPoint = end;
        const center = [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2];
        const offsetX = endPoint[0] - startPoint[0];
        const offsetY = endPoint[1] - startPoint[1];
        let length = Number(Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)).toFixed(5));
        length = minLevel * 4 > length ? minLevel * 4 : length;
        let width = offsetX > 0 ? offsetX : -offsetX;
        let height = offsetY > 0 ? offsetY : -offsetY;
        width = minLevel > width ? minLevel : width;
        height = minLevel > height ? minLevel : height;

        return {
            start: startPoint,
            end: endPoint,
            center,
            offsetX,
            offsetY,
            length,
            width,
            height,
        };
    }

    public static getArrowPath(config: {length: number; level: number}) {
        let lineLength: number = config.length;
        const point1 = [-lineLength / 2, -config.level];
        const point2 = [0, config.level * 2];
        const point3 = [lineLength - config.level * 4, 0];
        const point4 = [0, config.level * 2];
        const point5 = [config.level * 4, -config.level * 3];
        const point6 = [-config.level * 4, -config.level * 3];
        const point7 = [0, config.level * 2];
        const points = [];
        points.push(point1, point2, point3, point4, point5, point6, point7);
        let str = 'M';
        for (let i = 0; i < 7; i++) {
            str += `${i ? 'l' : ''} ${points[i].join(', ')} `;
        }
        str += 'z';
        return str;
    }

    public static getCirclePath(config: {width: number; height: number}) {
        return `M ${-config.width / 2} 0 a ${config.width / 2} ${config.height / 2} 0 0 1 ${
            config.width
        } 0 a ${config.width / 2} ${config.height / 2} 0 0 1 ${-config.width} 0 z`;
    }

    public static getRectPath(config: {width: number; height: number}) {
        const point1 = [-config.width / 2, -config.height / 2];
        const point2 = [0, config.height];
        const point3 = [config.width, 0];
        const point4 = [0, -config.height];
        const points = [];
        points.push(point1, point2, point3, point4);
        let str = 'M';
        for (let i = 0; i < 4; i++) {
            str += `${i ? 'l' : ''} ${points[i].join(', ')} `;
        }
        str += 'z';
        return str;
    }

    public static getStartSymmetricPointByPoint(startSymmetricPoints: StartSymmetricPointClass, editType: EditType) {
        switch (editType) {
            case EditType.TopLeft:
                return startSymmetricPoints.bottomRight;
            case EditType.TopCenter:
                return startSymmetricPoints.bottomCenter;
            case EditType.TopRight:
                return startSymmetricPoints.bottomLeft;
            case EditType.CenterLeft:
                return startSymmetricPoints.centerRight;
            case EditType.CenterRight:
                return startSymmetricPoints.centerLeft;
            case EditType.BottomLeft:
                return startSymmetricPoints.topRight;
            case EditType.BottomCenter:
                return startSymmetricPoints.topCenter;
            case EditType.BottomRight:
                return startSymmetricPoints.topLeft;
            default:
                return [0, 0];
        }
    }
}
