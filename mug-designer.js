window.onload = () => {

  /* =============================
     CANVAS SETUP
  ============================= */
  const canvas = new fabric.Canvas("c", {
    preserveObjectStacking: true,
    selection: true,
  });

  /* DOM shortcuts */
  const $ = (id) => document.getElementById(id);

  const fileImage = $("fileImage");
  const btnLoadUrl = $("btnLoadUrl");
  const imgUrl = $("imgUrl");
  const btnAddText = $("btnAddText");
  const btnAddRect = $("btnAddRect");
  const fontFamily = $("fontFamily");
  const btnBgRemove = $("btnBgRemove");
  const propX = $("propX");
  const propY = $("propY");
  const propW = $("propW");
  const propH = $("propH");
  const propR = $("propR");
  const propO = $("propO");
  const propFont = $("propFont");
  const propColor = $("propColor");
  const layers = $("layers");
  const btnBring = $("btnBring");
  const btnSend = $("btnSend");
  const btnDuplicate = $("btnDuplicate");
  const btnDelete = $("btnDelete");
  const btnApplyFilters = $("btnApplyFilters");
  const btnResetFilters = $("btnResetFilters");
  const filterBrightness = $("filterBrightness");
  const filterContrast = $("filterContrast");
  const filterGray = $("filterGray");
  const filterTransparency = $("filterTransparency");
  const filterBlur = $("filterBlur");
  const btnExport = $("btnExport");
  const canvasW = $("canvasW");
  const canvasH = $("canvasH");
  const btnResize = $("btnResize");
  const btnFit = $("btnFit");

  /* ====================================================
     IMPORT ASSETS — LOCAL (CORS SAFE)
  ==================================================== */
  fileImage.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      fabric.Image.fromURL(
        evt.target.result,
        (img) => {
          img.set({ left: 100, top: 100, selectable: true });
          canvas.add(img).setActiveObject(img);
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(f);
  };

  /* ====================================================
     LOAD IMAGE / SVG BY URL (CORS SAFE)
  ==================================================== */
  btnLoadUrl.onclick = () => {
    const url = imgUrl.value;
    if (!url) return;

    if (url.toLowerCase().endsWith(".svg")) {
      fabric.loadSVGFromURL(
        url,
        (objects, options) => {
          const svg = fabric.util.groupSVGElements(objects, options);
          svg.set({ left: 100, top: 100 });
          canvas.add(svg).setActiveObject(svg);
        },
        { crossOrigin: "anonymous" }
      );
      return;
    }

    fabric.Image.fromURL(
      url,
      (img) => {
        img.set({ left: 100, top: 100 });
        canvas.add(img).setActiveObject(img);
      },
      { crossOrigin: "anonymous" }
    );
  };

  /* =============================================
     ADD TEXT + SHAPES
  ============================================= */
  btnAddText.onclick = () => {
    const t = new fabric.Textbox("Double click to edit", {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: "#000000",
      editable: true,
      fontFamily: "Arial",
    });
    canvas.add(t).setActiveObject(t);
  };

  btnAddRect.onclick = () => {
    const r = new fabric.Rect({
      left: 120,
      top: 120,
      width: 200,
      height: 150,
      fill: "#cccccc",
    });
    canvas.add(r).setActiveObject(r);
  };


  /* =============================
PROPERTY PANEL SYNC
============================= */
  canvas.on("selection:updated", updatePanel);
  canvas.on("selection:created", updatePanel);
  canvas.on("selection:cleared", () => {
    document.getElementById("properties").style.opacity = 0.3;
  });


  function updatePanel() {
    const o = canvas.getActiveObject();
    if (!o) return;
    document.getElementById("properties").style.opacity = 1;


    propX.value = Math.round(o.left);
    propY.value = Math.round(o.top);
    propW.value = Math.round(o.getScaledWidth());
    propH.value = Math.round(o.getScaledHeight());
    propR.value = Math.round(o.angle);
    propO.value = o.opacity;
    propFont.value = o.fontSize || 40;
    propColor.value = o.fill || "#000";
  }


  [propX, propY, propW, propH, propR, propO, propFont, propColor].forEach((el) => {
    el.addEventListener("input", () => {
      const o = canvas.getActiveObject();
      if (!o) return;


      const id = el.id;


      if (id === "propX") o.set({ left: parseFloat(propX.value) });
      if (id === "propY") o.set({ top: parseFloat(propY.value) });


      if (id === "propW") o.scaleToWidth(parseFloat(propW.value));
      if (id === "propH") o.scaleToHeight(parseFloat(propH.value));


      if (id === "propR") o.set({ angle: parseFloat(propR.value) });
      if (id === "propO") o.set({ opacity: parseFloat(propO.value) });


      if (o.type === "textbox" && id === "propFont") o.set({ fontSize: parseFloat(propFont.value) });


      if (id === "propColor" && "fill" in o) o.set({ fill: propColor.value });


      canvas.requestRenderAll();
    });
  });

  /* =============================================
     FONT FAMILY
  ============================================= */
  fontFamily.oninput = () => {
    const o = canvas.getActiveObject();
    if (o && (o.type === "textbox" || o.type === "i-text")) {
      o.set("fontFamily", fontFamily.value);
      canvas.requestRenderAll();
    }
  };

  /* ====================================================
        BACKGROUND REMOVAL (COLOR-BASED)
  ==================================================== */
  const bgColorPicker = $("bgColorPicker");
  const bgTolerance = $("bgTolerance");
  const tolValue = $("tolValue");
  const btnSampleColor = $("btnSampleColor");

  if (bgTolerance && tolValue) {
    bgTolerance.oninput = () => {
      tolValue.textContent = bgTolerance.value;
    };
  }

  btnBgRemove.onclick = () => {
    const o = canvas.getActiveObject();
    if (!o || o.type !== "image") {
      alert("Select an image first!");
      return;
    }

    btnBgRemove.textContent = "Processing...";
    btnBgRemove.disabled = true;

    const raw = parseInt(bgTolerance.value || "40", 10);
    const distanceNormalized = Math.min(1, Math.max(0, raw / 255));

    const filter = new fabric.Image.filters.RemoveColor({
      color: bgColorPicker.value,
      distance: distanceNormalized
    });

    o.filters = [filter];
    o.applyFilters();
    canvas.requestRenderAll();

    btnBgRemove.textContent = "Remove Background";
    btnBgRemove.disabled = false;
  };

  /* ====================================================
        EYEDROPPER WITH HOVER + MAGNIFIER
  ==================================================== */
  let eyedropperEnabled = false;
  const magnifier = $("magnifier");
  let eyedropTarget = null;
  let savedObjectStates = null;
  let savedCanvasSelection = null;
  let savedCursor = null;

  function readRenderedPixelAt(canvasX, canvasY, targetObject) {
    if (!targetObject) return null;
    const objects = canvas.getObjects();
    savedObjectStates = objects.map(o => ({ obj: o, visible: o.visible, selectable: o.selectable, evented: o.evented }));

    objects.forEach(o => {
      o.visible = (o === targetObject);
      o.selectable = false;
      o.evented = false;
    });

    canvas.requestRenderAll();

    const lower = canvas.lowerCanvasEl;
    const rect = lower.getBoundingClientRect();
    const ratioX = lower.width / rect.width;
    const ratioY = lower.height / rect.height;
    const pixelRatio = (ratioX + ratioY) / 2;

    const bx = Math.floor(canvasX * pixelRatio);
    const by = Math.floor(canvasY * pixelRatio);

    let pixel = null;
    try {
      const ctx = lower.getContext("2d");
      const data = ctx.getImageData(bx, by, 1, 1).data;
      pixel = data;
    } catch (err) {
      pixel = null;
    }

    savedObjectStates.forEach(s => {
      s.obj.visible = s.visible;
      s.obj.selectable = s.selectable;
      s.obj.evented = s.evented;
    });
    canvas.requestRenderAll();

    return pixel;
  }

  btnSampleColor.onclick = () => {
    const o = canvas.getActiveObject();
    if (!o || o.type !== "image") {
      alert("Select an image first!");
      return;
    }

    eyedropTarget = o;
    savedCanvasSelection = canvas.selection;
    savedCursor = canvas.defaultCursor;
    canvas.selection = false;
    canvas.defaultCursor = "crosshair";
    canvas.getObjects().forEach(obj => {
      obj.origSelectable = obj.selectable;
      obj.origEvented = obj.evented;
      obj.selectable = false;
      obj.evented = false;
    });

    eyedropperEnabled = true;
    if (magnifier) magnifier.style.display = "block";
    btnSampleColor.textContent = "Hover & click to pick";
    btnSampleColor.classList.add("bg-yellow-300");
  };

  function cancelEyedropper() {
    eyedropperEnabled = false;
    if (magnifier) magnifier.style.display = "none";
    canvas.getObjects().forEach(obj => {
      if (typeof obj.origSelectable !== "undefined") obj.selectable = obj.origSelectable;
      if (typeof obj.origEvented !== "undefined") obj.evented = obj.origEvented;
      delete obj.origSelectable;
      delete obj.origEvented;
    });
    if (typeof savedCanvasSelection !== "undefined") canvas.selection = savedCanvasSelection;
    if (typeof savedCursor !== "undefined") canvas.defaultCursor = savedCursor;
    btnSampleColor.textContent = "Pick color from image";
    btnSampleColor.classList.remove("bg-yellow-300");
    canvas.requestRenderAll();
    eyedropTarget = null;
  }

  canvas.on("mouse:move", (opt) => {
    if (!eyedropperEnabled || !eyedropTarget) return;
    const p = canvas.getPointer(opt.e, true);
    const pixel = readRenderedPixelAt(p.x, p.y, eyedropTarget);

    if (!pixel || !magnifier) return;

    const [r, g, b, a] = pixel;
    const zoomCanvas = document.createElement("canvas");
    zoomCanvas.width = 48;
    zoomCanvas.height = 48;
    const zctx = zoomCanvas.getContext("2d");
    zctx.imageSmoothingEnabled = false;
    zctx.fillStyle = `rgba(${r},${g},${b},${(a || 255) / 255})`;
    zctx.fillRect(0, 0, 48, 48);
    magnifier.style.left = (opt.e.clientX + 18) + "px";
    magnifier.style.top = (opt.e.clientY + 18) + "px";
    magnifier.style.backgroundImage = `url(${zoomCanvas.toDataURL()})`;
    magnifier.style.borderColor = `rgb(${r},${g},${b})`;
  });

  canvas.on("mouse:down", (opt) => {
    if (!eyedropperEnabled || !eyedropTarget) return;
    const p = canvas.getPointer(opt.e, true);
    const pixel = readRenderedPixelAt(p.x, p.y, eyedropTarget);
    if (!pixel) {
      cancelEyedropper();
      return;
    }
    const [r, g, b] = pixel;
    const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
    if (bgColorPicker) bgColorPicker.value = hex;
    cancelEyedropper();
    try { canvas.setActiveObject(eyedropTarget); } catch (e) { }
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && eyedropperEnabled) cancelEyedropper();
  });

  /* ====================================================
        LIVE FILTERS: Brightness, Contrast, Grayscale, Blur, Transparency
  ==================================================== */
  function applyFiltersLive() {
    const o = canvas.getActiveObject();
    if (!o || o.type !== "image") return;

    const filters = [];
    const b = parseInt(filterBrightness.value);
    const c = parseInt(filterContrast.value);
    filters.push(new fabric.Image.filters.Brightness({ brightness: b/100 }));
    filters.push(new fabric.Image.filters.Contrast({ contrast: c/100 }));
    if (filterGray.checked) filters.push(new fabric.Image.filters.Grayscale());

    const blurVal = parseFloat(filterBlur.value);
    if (blurVal > 0) filters.push(new fabric.Image.filters.Blur({ blur: blurVal }));

    o.filters = filters;
    o.opacity = parseFloat(filterTransparency.value);

    o.applyFilters();
    canvas.requestRenderAll();
  }

  [filterBrightness, filterContrast, filterGray, filterBlur, filterTransparency].forEach(el => {
    el.addEventListener("input", applyFiltersLive);
  });

  btnResetFilters.onclick = () => {
    const o = canvas.getActiveObject();
    if (o && o.type === "image") {
      filterBrightness.value = 0;
      filterContrast.value = 0;
      filterGray.checked = false;
      filterBlur.value = 0;
      filterTransparency.value = 1;
      applyFiltersLive();
    }
  };
  /* =============================
     LAYERS
  ============================= */
  function refreshLayers() {
    layers.innerHTML = "";
    canvas.getObjects().forEach((o, i) => {
      const div = document.createElement("div");
      div.className = "flex justify-between bg-gray-100 p-2 rounded";
      div.innerHTML = `
        <span>${o.type}</span>
        <button data-i="${i}" class="px-2 py-1 bg-gray-300 rounded">Select</button>
      `;
      div.querySelector("button").onclick = () => {
        canvas.setActiveObject(o);
        canvas.requestRenderAll();
      };
      layers.appendChild(div);
    });
  }
  canvas.on("object:added", refreshLayers);
  canvas.on("object:removed", refreshLayers);
  canvas.on("object:modified", refreshLayers);

  /* =============================
     ARRANGE / DUPLICATE / DELETE
  ============================= */
  btnBring.onclick = () => {
    const o = canvas.getActiveObject();
    if (o) canvas.bringForward(o);
  };
  btnSend.onclick = () => {
    const o = canvas.getActiveObject();
    if (o) canvas.sendBackwards(o);
  };
  btnDuplicate.onclick = () => {
    const o = canvas.getActiveObject();
    if (!o) return;
    o.clone(cl => {
      cl.left = o.left + 20;
      cl.top = o.top + 20;
      canvas.add(cl);
    });
  };
  btnDelete.onclick = () => {
    const o = canvas.getActiveObject();
    if (o) canvas.remove(o);
  };

  /* =============================
     EXPORT PNG
  ============================= */
  btnExport.onclick = () => {
    const data = canvas.toDataURL({ format: "png" });
    const a = document.createElement("a");
    a.href = data;
    a.download = "mug-design.png";
    a.click();
  };

  /* =============================
     CANVAS SIZE
  ============================= */
  btnResize.onclick = () => {
    canvas.setWidth(parseInt(canvasW.value));
    canvas.setHeight(parseInt(canvasH.value));
    canvas.requestRenderAll();
  };
  btnFit.onclick = () => {
    canvas.setZoom(1);
    canvas.requestRenderAll();
  };


  
/* =============================
   GOOGLE FONTS API LOADER
============================= */
const API_KEY = "AIzaSyA6f3-ZgDt5KTWjzvf8W5TSplr9EBMP-Ng"

const fontSelect = document.getElementById("fontFamily");

async function loadGoogleFontsList() {
  if (!fontSelect) return;

  try {
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=alpha`
    );

    if (!res.ok) {
      console.error("Google API error:", res.status);
      return;
    }

    const data = await res.json();

    // Clear placeholder options
    fontSelect.innerHTML = "";

    // Insert all fonts alphabetically
    data.items.forEach(font => {
      const opt = document.createElement("option");
      opt.value = font.family;
      opt.textContent = font.family;
      fontSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Error loading fonts:", err);
  }
}

function loadGoogleFontDynamically(fontFamily) {
  const id = "font-" + fontFamily.replace(/\s+/g, "-");

  // prevent duplicates
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = id;
  link.href =
    `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;900&display=swap`;

  document.head.appendChild(link);
}

// Load the whole font list once on startup
loadGoogleFontsList();

// Apply font to active text object
fontSelect.addEventListener("change", () => {
  const font = fontSelect.value;

  loadGoogleFontDynamically(font);

  const obj = canvas.getActiveObject();
  if (obj && obj.type === "textbox") {

    document.fonts.load(`16px "${font}"`).then(() => {
      obj.set("fontFamily", font);
      canvas.requestRenderAll();
    });
  }
});




/* =============================
   FILTERS
============================= */
btnApplyFilters.onclick = () => {
  const o = canvas.getActiveObject();
  if (!o || o.type !== "image") return;

  o.filters = [];

  const bright = parseInt(filterBrightness.value);
  const contrast = parseInt(filterContrast.value);

  o.filters.push(new fabric.Image.filters.Brightness({ brightness: bright / 100 }));
  o.filters.push(new fabric.Image.filters.Contrast({ contrast: contrast / 100 }));
  if (filterGray.checked) o.filters.push(new fabric.Image.filters.Grayscale());

  o.applyFilters();
  canvas.requestRenderAll();
};

btnResetFilters.onclick = () => {
  const o = canvas.getActiveObject();
  if (o && o.type === "image") {
    o.filters = [];
    o.applyFilters();
    canvas.requestRenderAll();
  }
};



};


console.log("Script is ready")