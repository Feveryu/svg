export interface MouseDownEvent {
    onMouseDown: (event: MouseEvent) => void;
    onMouseDownAndMove: (event: MouseEvent) => void;
    onMouseDownAndUp: (event: MouseEvent) => void;
}

export interface KeyPressEvent {
    onKeypress: (e) => void;
}

export default class DomEventHandler {
    private readonly _ele: HTMLElement;

    constructor(element) {
        this._ele = element;
    }

    public bindMousedownEvent(events: MouseDownEvent): any {
        const mouseDownEvent = (e) => {
            const documentMousemove = document.onmousemove;
            const documentMouseup = document.onmouseup;

            events.onMouseDown(e);
            document.onmousemove = events.onMouseDownAndMove;
            document.onmouseup = (eUp) => {
                events.onMouseDownAndUp(eUp);
                document.onmousemove = documentMousemove;
                document.onmouseup = documentMouseup;
            };
        };
        this._ele.addEventListener('mousedown', mouseDownEvent);
        return mouseDownEvent;
    }

    public unbindMouseDownEvent(onMouseDown: any) {
        this._ele.removeEventListener('mousedown', onMouseDown);
    }

    public bindKeyboardEvent(events: KeyPressEvent) {
        document.addEventListener('onkeypress', events.onKeypress);
        return events.onKeypress;
    }

    public unbindKeyboardEvent(events: KeyPressEvent) {
        document.removeEventListener('onkeypress', events.onKeypress);
    }
}
