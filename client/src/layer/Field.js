import CanvasLayer from "./CanvasLayer"; // modern import
import L from "leaflet";

export default class Field extends CanvasLayer {
  constructor(field, options = {}) {
    super(options); // CanvasLayer constructor
    L.Util.setOptions(this, options);
    this._visible = true;
    if (field) this.setData(field);
  }

  getEvents() {
    const events = super.getEvents();
    events.zoomstart = this._hideCanvas.bind(this);
    events.zoomend = this._showCanvas.bind(this);
    return events;
  }

  onLayerDidMount() {
    this._enableIdentify();
    this._ensureCanvasAlignment();
  }

  show() {
    this._visible = true;
    this._showCanvas();
    this._enableIdentify();
  }

  hide() {
    this._visible = false;
    this._hideCanvas();
    this._disableIdentify();
  }

  isVisible() {
    return this._visible;
  }

  _showCanvas() {
    if (this._canvas && this._visible) {
      this._canvas.style.visibility = "visible";
    }
  }

  _hideCanvas() {
    if (this._canvas) {
      this._canvas.style.visibility = "hidden";
    }
  }

  _enableIdentify() {
    this._map.on("click", this._onClick, this);
    this._map.on("mousemove", this._onMouseMove, this);

    if (this.options.onClick) this.on("click", this.options.onClick, this);
    if (this.options.onMouseMove)
      this.on("mousemove", this.options.onMouseMove, this);
  }

  _disableIdentify() {
    this._map.off("click", this._onClick, this);
    this._map.off("mousemove", this._onMouseMove, this);

    if (this.options.onClick) this.off("click", this.options.onClick, this);
    if (this.options.onMouseMove)
      this.off("mousemove", this.options.onMouseMove, this);
  }

  _ensureCanvasAlignment() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
  }

  onLayerWillUnmount() {
    this._disableIdentify();
  }

  needRedraw() {
    if (this._map && this._field) {
      super.needRedraw();
    }
  }

  // Abstract placeholder (must be implemented by subclass)
  onDrawLayer(viewInfo) {
    throw new TypeError("Must be overridden");
  }

  setData(field) {
    if (this.options.inFilter) {
      field.setFilter(this.options.inFilter);
    }
    this._field = field;
    this.needRedraw();
    this.fire("load");
  }

  setFilter(f) {
    this.options.inFilter = f;
    if (this._field) this._field.setFilter(f);
    this.needRedraw();
  }

  setOpacity(opacity) {
    this.options.opacity = opacity;
    if (this._canvas) {
      this._updateOpacity();
    }
    return this;
  }

  getBounds() {
    const bb = this._field.extent();
    return L.latLngBounds(L.latLng(bb[1], bb[0]), L.latLng(bb[3], bb[2]));
  }

  _onClick(e) {
    const result = this._queryValue(e);
    this.fire("click", result);
  }

  _onMouseMove(e) {
    const result = this._queryValue(e);
    this._changeCursorOn(result);
    this.fire("mousemove", result);
  }

  _changeCursorOn(result) {
    if (!this.options.mouseMoveCursor) return;

    const { value, noValue } = this.options.mouseMoveCursor;
    const style = this._map.getContainer().style;
    style.cursor = result.value !== null ? value : noValue;
  }

  _updateOpacity() {
    L.DomUtil.setOpacity(this._canvas, this.options.opacity);
  }

  _queryValue(e) {
    const value = this._field
      ? this._field.valueAt(e.latlng.lng, e.latlng.lat)
      : null;
    return { latlng: e.latlng, value };
  }

  _getDrawingContext() {
    const ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    return ctx;
  }
}
