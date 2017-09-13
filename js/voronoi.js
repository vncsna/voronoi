// variables...................................................................
var svg = d3.select("svg"), voronoi,
          points, sites, polygon, link,
          site, defaultTheme, changeColor = false;

var params = {
  points: 42,
  type: "diagram",
  smoothness: smoothBorders,
  colorfulness: function(){
    changeColor = true;
    smoothColors();
  }
};

var gui = new dat.GUI(),
    typeControl = gui.add(params, "type",
      ["trip", "diagram", "drag and drop"]),
    pointsControl = gui.add(params, "points").min(1).max(256).step(1);
 gui.add(params, "smoothness");
 gui.add(params, "colorfulness");

// event listeners.............................................................
window.onresize = resized;
typeControl.onFinishChange(typeOf);
pointsControl.onChange(newVoronoi);

// initial state...............................................................
newVoronoi();

// functions...................................................................
function moved() {
  sites[0] = d3.mouse(this);
  redraw();
}

function resized() {
	var width = window.innerWidth,
			height = window.innerHeight;

  svg
    .attr("width", width)
    .attr("height", height);

  voronoi = d3.voronoi()
    .extent([[-1, -1], [width + 1, height + 1]]);

  sites = points
    .map(function(d) { return [d[0] * width, d[1] * height]; });

  redraw();
}

function dragstarted(){
	d3.select(this).classed("active", true);
}

function dragged(d){
  var temp, next;

  d3.select(this)
    .attr("cx", d.x = d3.event.x)
    .attr("cy", d.y = d3.event.y);

  sites = [];
  temp = svg.selectAll("circle").data();
  for(var i = 0; i < temp.length; i++){
    next = temp[i];
    if(temp[i].x != null)
      next[0] = temp[i].x;
    if(temp[i].y != null)
      next[1] = temp[i].y;
    sites.push(temp[i]);
  }

  redraw();
}

function dragended(){
  d3.select(this).classed("active", false);
}

function typeOf(value){
  var circle = d3.selectAll("circle");

  svg.on("touchmove mousemove", null);

  if(value == "drag and drop"){
    circle.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
          .transition().attr("r", 10);
  }
  else {
    circle.on("start", null)
          .on("drag", null)
          .on("end", null);
    if(value == "diagram"){
      svg.on("touchmove mousemove", moved);
      circle.transition().attr("r", 3);
    }
    else {
      circle.transition().attr("r", 6);
    }
  }
}

// basic functions ............................................................
function newVoronoi(){
  var width = window.innerWidth,
		  height = window.innerHeight,
      radius = params.type == "diagram" ? 3: 
              (params.type == "trip" ? 6 : 10);

  svg.attr("width", width)
     .attr("height", height);

  voronoi = d3.voronoi()
    .extent([[-1, -1], [width + 1, height + 1]]);

	svg.selectAll("*").remove();

	points = d3.range(params.points)
	  .map(function(d) { return [Math.random(), Math.random()]; });

  sites = points
    .map(function(d) { return [d[0] * width, d[1] * height]; });

	polygon = svg.append("g")
			.attr("class", "polygons")
		.selectAll("path")
	  .data(voronoi.polygons(sites))
	  .enter().append("path")
			.call(redrawPolygon);

	link = svg.append("g")
	    .attr("class", "links")
	  .selectAll("line")
	  .data(voronoi.links(sites))
	  .enter().append("line")
	    .call(redrawLink);

	site = svg.append("g")
	    .attr("class", "sites")
	  .selectAll("circle")
	  .data(sites)
	  .enter().append("circle")
	    .attr("r", radius)
	    .call(redrawSite);
  
  typeOf(params.type);
  smoothColors();
  redraw();
}

function smoothColors(){
  var theme, color, palette = [
    ["#412b32","#574b66","#8d8a78","#ab9f83","#ead6c8"],  //random
    ["#828DB5","#3B3A71","#1F1E38","#5769AE","#BEA996"],  //star light
    ["#1B2310","#6A7669","#909A97","#B3ABAC","#87878E"],  //game of thrones
    ["#3F413A","#515A64","#78A8B1","#9BAEB6","#D6C1A4"],  //the lego movie
    ["#424937","#384037","#8B2F2A","#877D14","#E1B154"]   //paper mario
  ];
  
  console.log("paletteLength: " + palette.length);

  if(changeColor || defaultTheme == undefined){
    theme = Math.floor(Math.random() * palette.length);
    defaultTheme = theme;
  }
  else
    theme = defaultTheme;

  console.log("defaultTheme: " + defaultTheme);
  
  d3.selectAll("path").each(function(){
    color = Math.floor(Math.random() * 5);
    d3.select(this).transition().style("fill", palette[theme][color]);
  });

  changeColor = false;
}

function smoothBorders(){

}

function redraw() {
  var diagram = voronoi(sites);
  polygon = polygon.data(diagram.polygons()).call(redrawPolygon);
  link = link.data(diagram.links()), link.exit().remove();
  link = link.enter().append("line").merge(link).call(redrawLink);
  site = site.data(sites).call(redrawSite);
}

function redrawPolygon(polygon) {
  polygon
    .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });
}

function redrawLink(link) {
  link
      .attr("x1", function(d) { return d.source[0]; })
      .attr("y1", function(d) { return d.source[1]; })
      .attr("x2", function(d) { return d.target[0]; })
      .attr("y2", function(d) { return d.target[1]; });
}

function redrawSite(site) {
  site
      .attr("cx", function(d) { return d[0]; })
      .attr("cy", function(d) { return d[1]; });
}
