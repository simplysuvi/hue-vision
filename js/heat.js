window.heatmap = {
  getHeatColor: function(value, alpha) {
    // Adapted from https://stackoverflow.com/a/17268489/1257278
    if (typeof alpha == 'undefined') {
      alpha = 1.0;
    }
    const hue = ((1 - value) * 120).toString(10);
    return 'hsla(' + hue + ',100%,50%,' + alpha + ')';
  },

  fillHeatmap: function(data, ctx, width, height, radius) {
    // Go through a dataset and fill the context with the corresponding circles.
    let pointX, pointY;

    for (let i = 0; i < data.n; i++) {
      pointX = Math.floor(data.x[i] * width);
      pointY = Math.floor(data.y[i] * height);

      ctx.beginPath();
      ctx.fillStyle = this.getHeatColor(0.5, 0.5);
      ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  },

  drawHeatmap: function(dataset) {
    this.clearHeatmap();
    $('#draw-heatmap').prop('disabled', true);
    $('#draw-heatmap').html('In Progress...');

    const heatmap = $('#heatMap')[0];
    const ctx = heatmap.getContext('2d');

    const width = $('body').width();
    const height = $('body').height();

    heatmap.width = width;
    heatmap.height = height;

    this.fillHeatmap(dataset.session, ctx, width, height, 15);

    $('#clear-heatmap').prop('disabled', false);
    $('#draw-heatmap').prop('disabled', false);
    $('#draw-heatmap').html('Draw Heatmap');
  },

  clearHeatmap: function() {
    const heatmap = $('#heatMap')[0];
    const ctx = heatmap.getContext('2d');
    ctx.clearRect(0, 0, heatmap.width, heatmap.height);
  },
};
