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
  const btnExport = $("btnExport");
  const canvasW = $("canvasW");
  const canvasH = $("canvasH");
  const btnResize = $("btnResize");
  const btnFit = $("btnFit");

  /* =============================
     IMPORT ASSETS (LOCAL FILE)
  ============================= */
  fileImage.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    fabric.Image.fromURL(
      URL.createObjectURL(f),
      (img) => {
        img.set({ left: 100, top: 100, selectable: true });
        canvas.add(img).setActiveObject(img);
      },
      { crossOrigin: "anonymous" }
    );
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

    fabric.util.loadImage(
      url,
      (imgEl) => {
        if (!imgEl) {
          fabric.Image.fromURL(url, (img) => {
            img.set({ left: 100, top: 100 });
            canvas.add(img).setActiveObject(img);
          });
          return;
        }
        const fabricImg = new fabric.Image(imgEl);
        fabricImg.set({ left: 100, top: 100 });
        canvas.add(fabricImg).setActiveObject(fabricImg);
      },
      { crossOrigin: "anonymous" }
    );
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
     FONT FAMILY
  ============================= */
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
     BACKGROUND REMOVAL (Node backend)
  ============================= */
  btnBgRemove.onclick = async () => {
  const o = canvas.getActiveObject();
  if (!o || o.type !== "image") {
    alert("Select an image first!");
    return;
  }

  try {
    btnBgRemove.textContent = "Processing...";
    btnBgRemove.disabled = true;

    // ALWAYS WORKS: extract as PNG from canvas
    const dataURL = o.toDataURL({ format: "png" });
    const imgBlob = await fetch(dataURL).then((r) => r.blob());

    const formData = new FormData();
    formData.append("image", imgBlob, "upload.png");

    const response = await fetch("http://localhost:3000/remove-bg", {
      method: "POST",
      mode: "cors",
      body: formData,
    });

    if (!response.ok) throw new Error("Background removal failed");

    const resultBlob = await response.blob();
    const resultUrl = URL.createObjectURL(resultBlob);

    fabric.Image.fromURL(resultUrl, (img) => {
      img.set({
        left: o.left,
        top: o.top,
        scaleX: o.scaleX,
        scaleY: o.scaleY,
        selectable: true,
      });

      canvas.remove(o);
      canvas.add(img).setActiveObject(img);
      canvas.requestRenderAll();
    });
  } catch (err) {
    console.error("Remove BG Error:", err);
    alert("Background removal failed.");
  } finally {
    btnBgRemove.textContent = "Remove Background";
    btnBgRemove.disabled = false;
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

    if (filterGray.checked)
      o.filters.push(new fabric.Image.filters.Grayscale());

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
};
