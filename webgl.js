var gl;  // GL context, shared and persistent

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.getExtension("OES_standard_derivatives");
  } catch (e) {
  }

  if (!gl) alert("Could not initialise WebGL, sorry :-(");
}


function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) return null;


  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) str += k.textContent;

    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("GLSL compile error:\n" + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


var shaderProgram;

function initShaders(vs_id, fs_id) {
  var fragmentShader = getShader(gl, vs_id);
  var vertexShader = getShader(gl, fs_id);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.aVertexPosition);

  shaderProgram.aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.aTextureCoord);

  shaderProgram.uXoffset = gl.getUniformLocation(shaderProgram, "uXoffset");
  shaderProgram.uYoffset = gl.getUniformLocation(shaderProgram, "uYoffset");
  shaderProgram.uScale = gl.getUniformLocation(shaderProgram, "uScale");
  shaderProgram.uXrot = gl.getUniformLocation(shaderProgram, "uXrot");
  shaderProgram.uYrot = gl.getUniformLocation(shaderProgram, "uYrot");
  shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.uDims = gl.getUniformLocation(shaderProgram, "uDims");
  // shaderProgram.uTime = gl.getUniformLocation(shaderProgram, "uTime");
}


var textureSize = [1,1];

function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Avoid unsupported wrap modes for not-powers-of-two (NPOT) textures
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Do not generate mipmaps - mipmaps are unsupported for NPOT in WebGL
  gl.bindTexture(gl.TEXTURE_2D, null);
  textureSize = [texture.image.width, texture.image.height];
}


var TextureRGBA;

function initTexture() {
  TextureRGBA = gl.createTexture();
  TextureRGBA.image = new Image();
  TextureRGBA.image.onload = function () {
      handleLoadedTexture(TextureRGBA)
  }
  TextureRGBA.image.src = "texture.png";
}


var quadVertexPositionBuffer;
var quadVertexTextureCoordBuffer;
var quadVertexIndexBuffer;

function initBuffers() {
  quadVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexPositionBuffer);
  vertices = [
      // Vertices for one single quad face
      -1.0, -1.0,  0.0,
       1.0, -1.0,  0.0,
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  quadVertexPositionBuffer.itemSize = 3;
  quadVertexPositionBuffer.numItems = 4;

  quadVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexTextureCoordBuffer);
  var textureCoords = [
    // Use unit square for texcoords across the single quad
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  quadVertexTextureCoordBuffer.itemSize = 2;
  quadVertexTextureCoordBuffer.numItems = 4;

  quadVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadVertexIndexBuffer);

  var quadVertexIndices = [
    // A single quad, made from two triangles
    0, 1, 2,   0, 2, 3
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadVertexIndices), gl.STATIC_DRAW);
  quadVertexIndexBuffer.itemSize = 1;
  quadVertexIndexBuffer.numItems = 6;
}


function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition,
    quadVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.aTextureCoord,
    quadVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, TextureRGBA);
  gl.uniform1i(shaderProgram.uSampler, 0); // Texture unit 0

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadVertexIndexBuffer);

  // Zoom and pan the view
  gl.uniform1f(shaderProgram.uXoffset, xOffset);
  gl.uniform1f(shaderProgram.uYoffset, yOffset);
  gl.uniform1f(shaderProgram.uScale, scale);
  gl.uniform1f(shaderProgram.uXrot, xRot);
  gl.uniform1f(shaderProgram.uYrot, yRot);
  gl.uniform2fv(shaderProgram.uDims, textureSize);

  // Check what time it is and set a uniform variable for animation
  var currentTime = (new Date).getTime(); // Returns milliseconds
  gl.uniform1f(shaderProgram.uTime, 0.001 * (currentTime - startTime));

  // Draw the single quad
  gl.drawElements(gl.TRIANGLES, quadVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

var startTime = (new Date).getTime();

function tick() {
  requestAnimFrame(tick);
  drawScene();
}

var xOffset = 0.0;
var yOffset = 0.0;
var xOldOffset = 0.0;
var yOldOffset = 0.0;
var xRot = 0.0;
var yRot = 0.0;
var xOldRot = 0.0;
var yOldRot = 0.0;
var scale = 1.0;
var xMouseDown;
var yMouseDown;
var drag = 0;
var shiftdrag = 0;

function webGLStart() {
  var canvas = document.getElementById("shaderdemo-canvas");

  canvas.onmousedown = function ( ev ) {
    drag = 1;
    shiftdrag = (ev.shiftKey) ? 1: 0;
    xMouseDown = ev.clientX; 
    yMouseDown = ev.clientY;
    xOldOffset = xOffset;
    yOldOffset = yOffset;
    xOldRot = xRot;
    yOldRot = yRot;
  }

  canvas.onmouseup = function ( ev ) {
    var xDelta = ev.clientX - xMouseDown;
    var yDelta = ev.clientY - yMouseDown;
    if(shiftdrag == 1) {
      xRot = xOldRot + (xDelta / canvas.width) * 6.0;
      yRot = yOldRot + (yDelta / canvas.height) * 6.0;
      if(yRot < -1.55) yRot = -1.55;
      if(yRot > 1.55) yRot = 1.55;        
    }
    else {
      xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0);
      yOffset = yOldOffset - (yDelta / canvas.height / scale * 2.0); // Flip y
    }
    drag = 0;
    shiftdrag = 0;
    drawScene();
  }

  // "onmousedrag" currently doesn't work, it seems, hence this kludge
  canvas.onmousemove = function ( ev ) {
    if(drag == 0) return;
    var xDelta = ev.clientX - xMouseDown;
    var yDelta = ev.clientY - yMouseDown;
    if(shiftdrag == 1) {
      xRot = xOldRot + (xDelta / canvas.width) * 6.0;
      yRot = yOldRot + (yDelta / canvas.height) * 6.0;
      if(yRot < -1.55) yRot = -1.55;
      if(yRot > 1.55) yRot = 1.55;        
    }
    else {
      xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0);
      yOffset = yOldOffset - (yDelta / canvas.height / scale * 2.0); // Flip y
    }
    drawScene();
  }

  var wheelHandler = function(ev) {
    var factor = 1.1; // Scale increment per click
    if (ev.shiftKey) factor = 1.01;
    scale *= ((ev.detail || ev.wheelDelta) < 0) ? factor : 1.0/factor;
    drawScene();
    ev.preventDefault();
  };
  canvas.addEventListener('DOMMouseScroll', wheelHandler, false);
  canvas.addEventListener('mousewheel', wheelHandler, false);

  canvas.ontouchstart = function ( ev ) {
    ev.preventDefault();
    drag = 1;
    shiftdrag = 1; // TODO: Make fundamental changes to recognize two-finger grab and pinch
    if (ev.targetTouches) ev = ev.targetTouches[0];
    xMouseDown = ev.pageX;
    yMouseDown = ev.pageY;
    xOldOffset = xOffset;
    yOldOffset = yOffset;
    xOldRot = xRot;
    yOldRot = yRot;
  }

  canvas.ontouchend = function ( ev ) {
    ev.preventDefault();
    if (ev.targetTouches) ev = ev.targetTouches[0];
    var xDelta = ev.pageX - xMouseDown;
    var yDelta = ev.pageY - yMouseDown;
    if(shiftdrag == 1) {
      xRot = xOldRot + (xDelta / canvas.width) * 6.0;
      yRot = yOldRot + (yDelta / canvas.height) * 6.0;
      if(yRot < -1.55) yRot = -1.55;
      if(yRot > 1.55) yRot = 1.55;        
    } else {
      xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0);
      yOffset = yOldOffset - (yDelta / canvas.height / scale * 2.0); // Flip y
    }
    drag = 0;
    shiftdrag = 0;
    drawScene();
  }

  canvas.ontouchmove = function ( ev ) {
    ev.preventDefault();

    if(drag == 0) return;
    if (ev.targetTouches) ev = ev.targetTouches[0];

    var xDelta = ev.pageX - xMouseDown;
    var yDelta = ev.pageY - yMouseDown;

    if(shiftdrag == 1) {
      xRot = xOldRot + (xDelta / canvas.width) * 6.0;
      yRot = yOldRot + (yDelta / canvas.height) * 6.0;
      if(yRot < -1.55) yRot = -1.55;
      if(yRot > 1.55) yRot = 1.55;        
    } else {
      xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0);
      yOffset = yOldOffset - (yDelta / canvas.height / scale * 2.0); // Flip y
    }
    drawScene();
  }

  initGL(canvas);
  initShaders("shader-vs", "shader-fs-1");
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

function showcontent(captionid, shaderid) {
  var captionPane = document.getElementById("caption-pane");
  var shaderPane = document.getElementById("shader-pane");
  var captionString = "";
  captionString += document.getElementById(captionid).innerHTML;
  captionPane.innerHTML = captionString;
  var shaderScript = document.getElementById(shaderid);
  var shaderString = '<pre class="brush: GLSL;">\n';
  if (!shaderScript) {
    shaderString += "// (code not found)";
  } else {
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType == 3) {
        shaderString += k.textContent;
      }
      k = k.nextSibling;
    }
  }
  shaderString += "</pre>\n";
  shaderPane.innerHTML = shaderString;
  initShaders('shader-vs', shaderid);
  SyntaxHighlighter.highlight(shaderPane);
}