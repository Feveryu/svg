class MathClass {
    public static getAngleADeg(a: number[], b: number[], c: number[]) {
        const AB2 = Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2);
        const AC2 = Math.pow(c[0] - a[0], 2) + Math.pow(c[1] - a[1], 2);
        const BC2 = Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2);
        const cosA = (AB2 + AC2 - BC2) / (2 * Math.sqrt(AC2) * Math.sqrt(AB2));
        return Math.round((Math.acos(cosA) * 180) / Math.PI);
    }

    /*
    用a,b两点绘制出一条直线，求过点c的垂线与这条直线的交点
     */
    public static getVerticalPoint(a: number[], b: number[], c: number[]) {
        if (b[0] === a[0]) {
            return [b[0], c[1]];
        } else if (b[1] === a[1]) {
            return [c[0], b[1]];
        } else {
            const slop = (b[1] - a[1]) / (b[0] - a[0]);
            const a1 = a[1] - a[0] * slop;
            const a2 = c[1] + c[0] / slop;
            const x = (a2 - a1) / (slop + 1 / slop);
            const y = x * slop + a1;
            return [x, y];
        }
    }

    public static getRotatePoint(a: number[], b: number[], angle: number) {
        const radian = (angle * Math.PI) / 180;
        let v = [b[0] - a[0], b[1] - a[1]];
        const cosVal = Math.cos(radian);
        const sinVal = Math.sin(radian);
        v = [v[0] * cosVal - v[1] * sinVal, v[0] * sinVal + v[1] * cosVal];
        return [a[0] + v[0], a[1] + v[1]];
    }

    /*
    获取旋转后的矩形的边点（说不清，反正就是算一个变化后的点）
     */
    public static getRelativePoint(a: number[], b: number[], angle: number) {
        if (angle === 90) {
            return [b[0], a[1]];
        } else if (angle === 0) {
            return [a[0], b[1]];
        } else {
            const radian = (angle * Math.PI) / 180;
            let slop = Math.tan(radian);
            slop = -1 / slop;
            const a1 = a[1] - a[0] * slop;
            const a2 = b[1] + b[0] / slop;
            const x = (a2 - a1) / (slop + 1 / slop);
            const y = x * slop + a1;
            return [x, y];
        }
    }

    public static getRelativeHorizontalPoint(a: number[], b: number[], angle: number) {
        if (angle === 90) {
            return [a[0], b[1]];
        } else if (angle === 0) {
            return [b[0], a[1]];
        } else {
            const radian = (angle * Math.PI) / 180;
            let slop = Math.tan(radian);
            const a1 = a[1] - a[0] * slop;
            const a2 = b[1] + b[0] / slop;
            const x = (a2 - a1) / (slop + 1 / slop);
            const y = x * slop + a1;
            return [x, y];
        }
    }
}
