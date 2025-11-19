
// Resize image if it exceeds max size (4096x4096)
function resizeImageIfNeeded(url, callback) {
  const MAX_SIZE = 4096;
  const img = new window.Image();
  img.onload = function () {
    if (img.width <= MAX_SIZE && img.height <= MAX_SIZE) {
      callback(url);
      return;
    }
    const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
    const newW = Math.round(img.width * scale);
    const newH = Math.round(img.height * scale);
    const canvasTmp = document.createElement('canvas');
    canvasTmp.width = newW;
    canvasTmp.height = newH;
    const ctx = canvasTmp.getContext('2d');
    ctx.drawImage(img, 0, 0, newW, newH);
    canvasTmp.toBlob((blob) => {
      const resizedUrl = URL.createObjectURL(blob);
      callback(resizedUrl);
    }, 'image/png');
  };
  img.onerror = function () {
    callback(url); // fallback
  };
  img.crossOrigin = 'anonymous';
  img.src = url;
}

/* =============================
   CANVAS SETUP
============================= */
const canvas = new fabric.Canvas("c", {
  preserveObjectStacking: true,
  selection: true,
});

/* =============================
   IMPORT ASSETS (LOCAL FILE)
============================= */
const fileImage = document.getElementById("fileImage");
fileImage.onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;

  const url = URL.createObjectURL(f);
  resizeImageIfNeeded(url, (resizedUrl) => {
    fabric.Image.fromURL(
      resizedUrl,
      (img) => {
        img.set({ left: 100, top: 100, selectable: true });
        canvas.add(img).setActiveObject(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
};

/* =============================
   LOAD IMAGE OR SVG BY URL
============================= */
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

  resizeImageIfNeeded(url, (resizedUrl) => {
    fabric.util.loadImage(
      resizedUrl,
      (imgEl) => {
        if (!imgEl) {
          fabric.Image.fromURL(resizedUrl, (img) => {
            img.set({ left: 100, top: 100 });
            canvas.add(img).setActiveObject(img);
            alert("Image loaded without CORS — filters disabled.");
          });
          return;
        }

        const fabricImg = new fabric.Image(imgEl);
        fabricImg.set({ left: 100, top: 100 });
        canvas.add(fabricImg).setActiveObject(fabricImg);
      },
      { crossOrigin: "anonymous" }
    );
  });
// Resize image if it exceeds max size (4096x4096)
function resizeImageIfNeeded(url, callback) {
  const MAX_SIZE = 4096;
  const img = new window.Image();
  img.onload = function () {
    if (img.width <= MAX_SIZE && img.height <= MAX_SIZE) {
      callback(url);
      return;
    }
    const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
    const newW = Math.round(img.width * scale);
    const newH = Math.round(img.height * scale);
    const canvasTmp = document.createElement('canvas');
    canvasTmp.width = newW;
    canvasTmp.height = newH;
    const ctx = canvasTmp.getContext('2d');
    ctx.drawImage(img, 0, 0, newW, newH);
    canvasTmp.toBlob((blob) => {
      const resizedUrl = URL.createObjectURL(blob);
      callback(resizedUrl);
    }, 'image/png');
  };
  img.onerror = function () {
    callback(url); // fallback
  };
  img.crossOrigin = 'anonymous';
  img.src = url;
}
};

/* =============================
   ADD TEXT + SHAPES
============================= */
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
   FONT FAMILY SELECTION
============================= */
const fontFamily = document.getElementById("fontFamily");
if (fontFamily) {
  fontFamily.oninput = () => {
    const o = canvas.getActiveObject();
    if (o && o.type === "textbox") {
      o.set("fontFamily", fontFamily.value);
      canvas.requestRenderAll();
    }
  };
}

/* =============================
   BACKGROUND REMOVAL (AI LOCAL)
============================= */

btnBgRemove.onclick = async () => {
  btnBgRemove.textContent = "Processing...";
  btnBgRemove.disabled = true;
  try {
    await removeBackground();
  } catch (err) {
    console.error(err);
    alert("Background removal failed. See console.");
  } finally {
    btnBgRemove.textContent = "Remove Background";
    btnBgRemove.disabled = false;
  }
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

[ propX, propY, propW, propH, propR, propO, propFont, propColor ].forEach((el) => {
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

/* =============================
   LAYERS MANAGER
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
      updatePanel();
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
  o.clone((cl) => {
    cl.set({ left: o.left + 20, top: o.top + 20 });
    canvas.add(cl);
  });
};

btnDelete.onclick = () => {
  const o = canvas.getActiveObject();
  if (o) canvas.remove(o);
};

/* =============================
   FILTERS
============================= */
btnApplyFilters.onclick = () => {
  const o = canvas.getActiveObject();
  if (!o || o.type !== "image") return;

  o.filters = [];

  const b = parseInt(filterBrightness.value);
  const c = parseInt(filterContrast.value);

  o.filters.push(new fabric.Image.filters.Brightness({ brightness: b / 100 }));
  o.filters.push(new fabric.Image.filters.Contrast({ contrast: c / 100 }));

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

/* =============================
   EXPORT
============================= */
btnExport.onclick = () => {
  const data = canvas.toDataURL({ format: "png" });
  download(data, "mug-design.png");
};

function download(data, filename) {
  const a = document.createElement("a");
  a.href = data;
  a.download = filename;
  a.click();
}

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

// BACKGROUND REMOVAL
async function removeBackground() {
  const o = canvas.getActiveObject();
  if (!o || o.type !== "image") {
    alert("Select an image first.");
    return;
  }

  // Simple built‑in background removal using RemoveColor filter
  // This removes white backgrounds by default
  const filter = new fabric.Image.filters.RemoveColor({
    color: "#FFFFFF",
    distance: 0.15
  });

  o.filters.push(filter);
  o.applyFilters();
  canvas.requestRenderAll();
}

console.log("Mug Designer initialized.");