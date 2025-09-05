const uploadInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const downloadsDiv = document.getElementById("downloads");

let uploadedFiles = [];
let tickImageBytes = null;

// Load tick image
fetch("tick.png")
  .then(res => res.arrayBuffer())
  .then(data => {
    tickImageBytes = data;
  });

// Enable button when PDFs are selected
uploadInput.addEventListener("change", (event) => {
  uploadedFiles = Array.from(event.target.files);
  processBtn.disabled = uploadedFiles.length === 0;
});

processBtn.addEventListener("click", async () => {
  if (!tickImageBytes || uploadedFiles.length === 0) return;

  downloadsDiv.innerHTML = ""; // Clear old results

  for (const file of uploadedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const processedPdfBytes = await processSinglePdf(arrayBuffer, file.name);

    // Create download link for this file
    const blob = new Blob([processedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ticked_${file.name}`;
    link.textContent = `Download ticked_${file.name}`;
    link.style.display = "block";

    downloadsDiv.appendChild(link);
  }
});

async function processSinglePdf(pdfBytes, originalFileName) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const tickImage = await pdfDoc.embedPng(tickImageBytes);

  for (let i = 1; i < pages.length - 1; i++) { // skip first & last
    const page = pages[i];
    const { width, height } = page.getSize();

    const tickWidth = width * 0.1; // Tick is 10% of page width
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
