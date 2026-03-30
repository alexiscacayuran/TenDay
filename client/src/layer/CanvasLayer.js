import L from "leaflet";

export default class CanvasLayer extends L.Layer {
  constructor(options = {}) {
    super();
    L.setOptions(this, options);
    this._map = null;
    this._canvas = null;
    this._frame = null;
    this._delegate = null;
  }

  delegate(del) {
    this._delegate = del;
    return this;
  }

  needRedraw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
    }
    return this;
  }

  _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  }

  _onLayerDidMove() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  }

  getEvents() {
    const events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove,
    };
    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }
    return events;
  }

  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create("canvas", "leaflet-layer");

    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    const animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      this._canvas,
      "leaflet-zoom-" + (animated ? "animated" : "hide")
    );

    const pane = this.options.pane
      ? map.getPanes()[this.options.pane]
      : map._panes.overlayPane;
    pane.appendChild(this._canvas);

    map.on(this.getEvents(), this);

    const del = this._delegate || this;
    del.onLayerDidMount?.();
    this.needRedraw();
  }

  onRemove(map) {
    const del = this._delegate || this;
    del.onLayerWillUnmount?.();

    const pane = this.options.pane
      ? map.getPanes()[this.options.pane]
      : map._panes.overlayPane;
    pane.removeChild(this._canvas);

    map.off(this.getEvents(), this);
    this._canvas = null;
  }

  drawLayer() {
    if (!this._map || !this._canvas) {
      console.warn(
        "CanvasLayer.drawLayer called before layer was fully added."
      );
      return;
    }
    const size = this._map.getSize();
    const bounds = this._map.getBounds();
    const zoom = this._map.getZoom();
    const center = this.LatLonToMercator(this._map.getCenter());
    const corner = this.LatLonToMercator(
      this._map.containerPointToLatLng(this._map.getSize())
    );

    const del = this._delegate || this;
    del.onDrawLayer?.({
      layer: this,
      canvas: this._canvas,
      bounds,
      size,
      zoom,
      center,
      corner,
    });

    this._frame = null;
  }

  LatLonToMercator(latlng) {
    return {
      x: (latlng.lng * 6378137 * Math.PI) / 180,
      y: Math.log(Math.tan(((90 + latlng.lat) * Math.PI) / 360)) * 6378137,
    };
  }

  _animateZoom(e) {
    const scale = this._map.getZoomScale(e.zoom);
    const offset = this._map._latLngToNewLayerPoint(
      this._map.getBounds().getNorthWest(),
      e.zoom,
      e.center
    );
    L.DomUtil.setTransform(this._canvas, offset, scale);
  }
}
