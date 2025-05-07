import Vector from "./Vector.js";
import Field from "./Field.js";
import { min, max } from "d3";

/**
 *  A set of vectors assigned to a regular 2D-grid (lon-lat)
 *  (e.g. a raster representing winds for a region)
 */
export default class VectorField extends Field {
  constructor(params) {
    super(params);

    this.us = params["us"];
    this.vs = params["vs"];
    this.grid = this._buildGrid();
    this.range = this._calculateRange();
  }

  /**
   * Builds a grid with a Vector at each point, from two arrays
   * 'us' and 'vs' following x-ascending & y-descending order
   * (same as in ASCIIGrid)
   * @returns {Array.<Array.<Vector>>} - grid[row][column]--> Vector
   */
  _buildGrid() {
    let grid = this._arraysTo2d(this.us, this.vs, this.nRows, this.nCols);
    return grid;
  }

  _arraysTo2d(us, vs, nRows, nCols) {
    let grid = [];
    let p = 0;

    for (var j = 0; j < nRows; j++) {
      var row = [];
      for (var i = 0; i < nCols; i++, p++) {
        let u = us[p],
          v = vs[p];
        let valid = this._isValid(u) && this._isValid(v);
        row[i] = valid ? new Vector(u, v) : null; // <<<
      }
      grid[j] = row;
    }
    return grid;
  }

  _newDataArrays(params) {
    params["us"] = [];
    params["vs"] = [];
  }
  _pushValueToArrays(params, value) {
    //console.log(value);
    params["us"].push(value.u);
    params["vs"].push(value.v);
  }
  _makeNewFrom(params) {
    return new VectorField(params);
  }

  /**
   * Calculate min & max values (magnitude)
   * @private
   * @returns {Array}
   */
  _calculateRange() {
    // TODO make a clearer method for getting these vectors...
    let vectors = this.getCells()
      .map((pt) => pt.value)
      .filter(function (v) {
        return v !== null;
      });

    if (this._inFilter) {
      vectors = vectors.filter(this._inFilter);
    }

    // TODO check memory crash with high num of vectors!
    let magnitudes = vectors.map((v) => v.magnitude());
    let _min = min(magnitudes);
    let _max = max(magnitudes);

    return [_min, _max];
  }

  /**
   * Is valid (not 'null' nor 'undefined')
   * @private
   * @param   {Object} x object
   * @returns {Boolean}
   */
  _isValid(x) {
    return x !== null && x !== undefined;
  }
}
