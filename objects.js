export default class PipePair {
    constructor(x, id, element) {
        this.x = parseInt(x);
        this.id = id;
        this.element = element
        this.scored = false;
    }

    updateX(dx) {
        this.x -= dx;
        this.element.style.left = this.x + 'px';
    }
}
