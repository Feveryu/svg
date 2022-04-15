import ZingTouch from 'zingtouch';

interface Region {
    isCapture?: boolean;
    isPreventDefault?: boolean;
}

export interface TapEvents extends Region {
    maxDelay?: number;
    numInputs?: number;
    tolerance?: number;
    onTap: (event) => void;
}

export interface SwipeEvents extends Region {
    numInputs?: number;
    escapeVelocity?: number;
    maxRestTime?: number;
    onSwipe: (event) => void;
}

export interface DistanceEvents extends Region {
    onDistance: (event) => void;
}

export interface PanEvents extends Region {
    numInputs?: number;
    threshold?: number;
    onPan: (event) => void;
}

export interface RotateEvents extends Region {
    onRotate: (event) => void;
}

export interface CancelToken {
    region: any;
    event: any;
}

export default class GestureHandler {
    private readonly _ele: HTMLElement;

    constructor(element) {
        this._ele = element;
    }

    public bindTapEvent(events: TapEvents): CancelToken {
        const region = new new ZingTouch.Region(this._ele, events.isCapture, events.isPreventDefault)();
        const longTap = new ZingTouch.Tap({
            maxDelay: events.maxDelay,
            numInputs: events.numInputs,
            tolerance: events.tolerance,
        });
        region.bind(this._ele, longTap, events.onTap);
        return {
            region,
            event: events.onTap,
        };
    }

    public bindSwipeEvent(events: SwipeEvents): CancelToken {
        const region = new new ZingTouch.Region(this._ele, events.isCapture, events.isPreventDefault)();
        const swipe = new ZingTouch.Swipe({
            numInputs: events.numInputs,
            escapeVelocity: events.escapeVelocity,
            maxRestTime: events.maxRestTime,
        });
        region.bind(this._ele, swipe, events.onSwipe);
        return {
            region,
            event: events.onSwipe,
        };
    }

    public bindDistanceEvent(events: DistanceEvents): CancelToken {
        const region = new new ZingTouch.Region(this._ele, events.isCapture, events.isPreventDefault)();
        const distance = new ZingTouch.Distance();
        region.bind(this._ele, distance, events.onDistance);
        return {
            region,
            event: events.onDistance,
        };
    }

    public bindPanEvent(events: PanEvents): CancelToken {
        const region = new new ZingTouch.Region(this._ele, events.isCapture, events.isPreventDefault)();
        const pan = new ZingTouch.Pan({
            numInputs: events.numInputs,
            threshold: events.threshold,
        });
        region.bind(this._ele, pan, events.onPan);
        return {
            region,
            event: events.onPan,
        };
    }

    public bindRotateEvent(events: RotateEvents): CancelToken {
        const region = new new ZingTouch.Region(this._ele, events.isCapture, events.isPreventDefault)();
        const rotate = new ZingTouch.Rotate();
        region.bind(this._ele, rotate, events.onRotate);
        return {
            region,
            event: events.onRotate,
        };
    }

    public unbindEvent(cancelToken: CancelToken) {
        try {
            cancelToken.region.unbind(cancelToken.event);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
}
