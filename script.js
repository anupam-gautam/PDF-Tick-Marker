const uploadInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const downloadsDiv = document.getElementById("downloads");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const dropZone = document.getElementById("dropZone");

let uploadedFiles = [];
let tickImageBytes = null;
let processedFiles = [];

// Load tick image
fetch("tick.png")
  .then(res => res.arrayBuffer())
  .then(data => {
    tickImageBytes = data;
  });

// Drag & Drop Events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
  uploadedFiles.push(...files);
  if (uploadedFiles.length > 0) processBtn.disabled = false;
  alert(`${files.length} PDF(s) added!`);
});

// File Picker
uploadInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files);
  uploadedFiles.push(...files);
  processBtn.disabled = uploadedFiles.length === 0;
});

// Process PDFs
processBtn.addEventListener("click", async () => {
  if (!tickImageBytes || uploadedFiles.length === 0) return;

  downloadsDiv.innerHTML = "";
  processedFiles = [];
  downloadZipBtn.disabled = true;

  let completed = 0;

  for (const file of uploadedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const processedPdfBytes = await processSinglePdf(arrayBuffer);

    // Save processed file in memory
    processedFiles.push({ name: `${file.name}`, bytes: processedPdfBytes });

    // Create download link
    const blob = new Blob([processedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ticked_${file.name}`;
    link.textContent = `Download ticked_${file.name}`;
    downloadsDiv.appendChild(link);

    // Update progress
    completed++;
    const percent = Math.round((completed / uploadedFiles.length) * 100);
    progressBar.value = percent;
    progressText.textContent = `${percent}%`;
  }

  downloadZipBtn.disabled = false;
  alert("Processing complete!");
});

async function processSinglePdf(pdfBytes) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const tickImage = await pdfDoc.embedPng(tickImageBytes);

  for (let i = 1; i < pages.length - 1; i++) { // skip first & last
    const page = pages[i];
    const { width, height } = page.getSize();
//scale up tick size
    const tickWidth = width * 0.5; // 10% of page width
    const tickHeight = (tickImage.height / tickImage.width) * tickWidth;

    // Slight random offset for human effect
    const offsetX = (Math.random() * 20) - 10;
    const offsetY = (Math.random() * 20) - 10;

    const centerX = (width / 2) - (tickWidth / 2) + offsetX;
    const centerY = (height / 2) - (tickHeight / 2) + offsetY;

    page.drawImage(tickImage, {
      x: centerX,
      y: centerY,
      width: tickWidth,
      height: tickHeight,
    });
  }

  return await pdfDoc.save();
}

// Download all as ZIP
downloadZipBtn.addEventListener("click", async () => {
  if (processedFiles.length === 0) return;

  const zip = new JSZip();

  processedFiles.forEach(file => {
    zip.file(file.name, file.bytes);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);

  const link = document.createElement("a");
  link.href = url;
  link.download = "ticked_pdfs.zip";
  link.click();
});
