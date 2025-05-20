document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const sizeGB = parseFloat(form.size.value);
  if (isNaN(sizeGB) || sizeGB <= 0) {
    document.getElementById("status").textContent = "Invalid size. Please enter a positive number.";
    return;
  }

  document.getElementById("status").textContent = "Generating...";

  // Fetch the base data from tramT.txt located in the static folder
  const baseResponse = await fetch("tramT.txt");
  if (!baseResponse.ok) {
    document.getElementById("status").textContent = "Error fetching base file.";
    return;
  }
  const baseData = await baseResponse.text();
  // Calculate the byte size of the baseData accurately
  const baseSize = new Blob([baseData]).size;
  const targetSize = Math.floor(sizeGB * 1024 * 1024 * 1024);

  // If target size is less than the base file size, slice the data instead of streaming.
  if (targetSize < baseSize) {
    const encoded = new TextEncoder().encode(baseData);
    const truncated = encoded.subarray(0, targetSize);
    const blob = new Blob([truncated], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ariel_Tramway_${sizeGB}GiB.txt`;
    a.click();
    document.getElementById("status").textContent = "Download started!";
  } else {
    // Use a ReadableStream to generate the file content chunk by chunk.
    let repeatsLeft = Math.floor(targetSize / baseSize);
    let remainder = targetSize % baseSize;
    const stream = new ReadableStream({
      pull(controller) {
        if (repeatsLeft > 0) {
          const chunk = new TextEncoder().encode(baseData);
          controller.enqueue(chunk);
          repeatsLeft--;
        } else if (remainder > 0) {
          const encoded = new TextEncoder().encode(baseData);
          const remainderChunk = encoded.subarray(0, remainder);
          controller.enqueue(remainderChunk);
          remainder = 0;
        } else {
          controller.close();
        }
      }
    });
  
    // Create a Blob from the stream and trigger the download
    const blob = await new Response(stream, { headers: { "Content-Type": "text/plain" } }).blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ariel_Tramway_${sizeGB}GiB.txt`;
    a.click();
    document.getElementById("status").textContent = "Download started!";
  }
};

