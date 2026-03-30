import Field from "./Field";
import { timer } from "d3";
import L from "leaflet";

export default class VectorFieldAnim extends Field {
  constructor(vectorField, options = {}) {
    super(vectorField, options);
    L.Util.setOptions(this, options);
    this.timer = null;
  }

  onLayerDidMount() {
    super.onLayerDidMount();
    this._map.on("move resize", this._stopAnimation, this);
  }

  onLayerWillUnmount() {
    super.onLayerWillUnmount();
    this._map.off("move resize", this._stopAnimation, this);
    this._stopAnimation();
  }

  _hideCanvas() {
    super._hideCanvas();
    this._stopAnimation();
  }

  onDrawLayer(viewInfo) {
    if (
      !this._field ||
      typeof this._field.randomPosition !== "function" ||
      typeof this._field.valueAt !== "function" ||
      typeof this._field.hasValueAt !== "function"
    ) {
      console.warn("VectorFieldAnim: field is not ready. Skipping draw.");
      return;
    }

    if (!this.isVisible()) return;

    this._updateOpacity();

    const ctx = this._getDrawingContext();
    const paths = this._prepareParticlePaths();

    const moveParticles = () => {
      paths.forEach((par) => {
        if (par.age > this.options.maxAge) {
          par.age = 0;
          this._field.randomPosition(par);
        }

        const vector = this._field.valueAt(par.x, par.y);
        if (vector === null) {
          par.age = this.options.maxAge;
        } else {
          const xt = par.x + vector.u * this.options.velocityScale;
          const yt = par.y + vector.v * this.options.velocityScale;

          if (this._field.hasValueAt(xt, yt)) {
            par.xt = xt;
            par.yt = yt;
            par.m = vector.magnitude();
          } else {
            par.age = this.options.maxAge;
          }
        }
        par.age += 1;
      });
    };

    const drawParticles = () => {
      const prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = prev;

      ctx.fillStyle = `rgba(0, 0, 0, ${this.options.fade})`;
      ctx.lineWidth = this.options.width;
      ctx.strokeStyle = this.options.color;

      paths.forEach((par) => this._drawParticle(viewInfo, ctx, par));
    };

    this.timer = timer(() => {
      moveParticles();
      drawParticles();
    }, this.options.duration);
  }

  _drawParticle(viewInfo, ctx, par) {
    if (
      par.x === undefined ||
      par.y === undefined ||
      par.xt === undefined ||
      par.yt === undefined ||
      !this._map
    ) {
      return; // Skip invalid or uninitialized particle
    }

    const source = new L.LatLng(par.y, par.x);
    const target = new L.LatLng(par.yt, par.xt);

    if (viewInfo.bounds.contains(source) && par.age <= this.options.maxAge) {
      const pA = viewInfo.layer._map.latLngToContainerPoint(source);
      const pB = viewInfo.layer._map.latLngToContainerPoint(target);

      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);

      par.x = par.xt;
      par.y = par.yt;

      if (typeof this.options.color === "function") {
        ctx.strokeStyle = this.options.color(par.m);
      }

      if (typeof this.options.width === "function") {
        ctx.lineWidth = this.options.width(par.m);
      }

      ctx.stroke();
    }
  }

  _prepareParticlePaths() {
    const paths = [];
    for (let i = 0; i < this.options.paths; i++) {
      const p = this._field.randomPosition();
      if (p.x !== undefined && p.y !== undefined) {
        p.age = this._randomAge();
        paths.push(p);
      }
    }
    return paths;
  }

  _randomAge() {
    return Math.floor(Math.random() * this.options.maxAge);
  }

  _stopAnimation() {
    if (this.timer) {
      this.timer.stop();
      this.timer = null;
    }
  }
}
