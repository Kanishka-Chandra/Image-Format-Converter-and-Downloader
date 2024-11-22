chrome.runtime.onInstalled.addListener(() => {
  // Main context menu
  chrome.contextMenus.create({
    id: "download-image",
    title: "Download Image As...",
    contexts: ["image"],
  });

  // Submenu items for formats
  ["webp", "jpg", "png"].forEach((format) => {
    chrome.contextMenus.create({
      id: `download-image-${format}`,
      title: format.toUpperCase(),
      parentId: "download-image",
      contexts: ["image"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("download-image-") && info.srcUrl) {
    const format = info.menuItemId.replace("download-image-", "");
    const url = info.srcUrl;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        createImageBitmap(blob).then((imageBitmap) => {
          const canvas = new OffscreenCanvas(
            imageBitmap.width,
            imageBitmap.height
          );
          const ctx = canvas.getContext("2d");
          ctx.drawImage(imageBitmap, 0, 0);
          canvas
            .convertToBlob({ type: `image/${format}` })
            .then((convertedBlob) => {
              convertedBlob.arrayBuffer().then((buffer) => {
                const base64Data = arrayBufferToBase64(buffer);
                const dataUrl = `data:image/${format};base64,${base64Data}`;
                chrome.downloads.download(
                  {
                    url: dataUrl,
                    filename: `image.${format}`,
                    saveAs: true,
                  },
                  () => {
                    // Download initiated
                  }
                );
              });
            });
        });
      })
      .catch((err) => {
        console.error("Error downloading or converting the image:", err);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Image Format Converter and Downloader",
          message: "Failed to download or convert the image.",
        });
      });
  }
});

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
