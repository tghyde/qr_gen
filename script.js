document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const generateBtn = document.getElementById('generate-qr-btn');
    const qrCodeContainer = document.getElementById('qrcode-container');
    const foregroundHexInput = document.getElementById('foreground-hex');
    const backgroundHexInput = document.getElementById('background-hex');
    const downloadBtn = document.getElementById('download-qr-btn');
    const qrBorderSlider = document.getElementById('qr-border-slider');
    const qrBorderValueSpan = document.getElementById('qr-border-value');

    let qrCodeInstance = null; // To hold the QRCode.js instance

    // Define this array early in your script
    const favoriteColors = [
    { name: "V Burgundy", hex: "#951829" },
    { name: "V Dark Burgundy", hex: "#641A2B" },
    { name: "V Gold", hex: "#C6AA76" },
    { name: "V Cream", hex: "#FFF8EF" },
    { name: "V Light Gray", hex: "#D0D0CE" },
    { name: "V Dark Gray", hex: "#63666A" }
];

    // Defaults
    let foregroundColor = '#000000';
    let backgroundColor = '#ffffff';
    let currentQrPadding = 10;

    const favoritesListEl = document.getElementById('favorites-list');

    function populateFavoritesPanel() {
        if (!favoritesListEl) {
            console.error("Favorites list element not found!");
            return;
        }

        favoritesListEl.innerHTML = ''; // Clear any existing items

        favoriteColors.forEach(color => {
            const listItem = document.createElement('li');

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'fav-color-details';

            const swatch = document.createElement('div');
            swatch.className = 'fav-color-swatch';
            swatch.style.backgroundColor = color.hex;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'fav-color-name';
            nameSpan.textContent = color.name;
            nameSpan.title = `${color.name} (${color.hex})`; // Tooltip for full name and hex

            const hexSpan = document.createElement('span');
            hexSpan.className = 'fav-color-hex';
            hexSpan.textContent = color.hex.toUpperCase();

            detailsDiv.appendChild(swatch);
            detailsDiv.appendChild(hexSpan);
            detailsDiv.appendChild(nameSpan);
            

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'fav-buttons';

            const fButton = document.createElement('button');
            fButton.textContent = 'F';
            fButton.title = `Set ${color.name} as Foreground`;
            fButton.addEventListener('click', () => {
                foregroundColor = color.hex;
                if(fgPicker) fgPicker.setColor(color.hex);
                if(foregroundHexInput) foregroundHexInput.value = color.hex.toUpperCase();
                if (qrText.value.trim()) {
                    generateQRCode();
                }
            });

            const bButton = document.createElement('button');
            bButton.textContent = 'B';
            bButton.title = `Set ${color.name} as Background`;
            bButton.addEventListener('click', () => {
                backgroundColor = color.hex;
                if(bgPicker) bgPicker.setColor(color.hex);
                if(backgroundHexInput) backgroundHexInput.value = color.hex.toUpperCase();
                if (qrText.value.trim()) {
                    generateQRCode();
                }
            });

            buttonsDiv.appendChild(fButton);
            buttonsDiv.appendChild(bButton);

            listItem.appendChild(detailsDiv);
            listItem.appendChild(buttonsDiv);
            favoritesListEl.appendChild(listItem);
        });
    }

    // Call it to build the panel when the DOM is ready
    populateFavoritesPanel();

    // Initialize Pickr for Foreground Color
    const fgPicker = Pickr.create({
        el: '#foreground-color-picker',
        theme: 'classic', // or 'monolith', 'nano'
        default: foregroundColor,
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Initialize Pickr for Background Color
    const bgPicker = Pickr.create({
        el: '#background-color-picker',
        theme: 'classic',
        default: backgroundColor,
        components: {
            preview: true,
            opacity: true, // Background typically doesn't need opacity for QR
            hue: true,
            interaction: {
                hex: true,
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // --- Event Listeners for Pickr ---
    fgPicker.on('save', (color, instance) => {
        foregroundColor = color ? color.toHEXA().toString() : '#000000';
        foregroundHexInput.value = foregroundColor.substring(0, 7); // Remove alpha if present for display
        fgPicker.hide(); // Hide picker after selection
        // Automatically regenerate QR code if text exists
        if (qrText.value.trim()) {
            generateQRCode();
        }
    });

    bgPicker.on('save', (color, instance) => {
        backgroundColor = color ? color.toHEXA().toString() : '#ffffff';
        backgroundHexInput.value = backgroundColor.substring(0, 7);
        bgPicker.hide();
        // Automatically regenerate QR code if text exists
        if (qrText.value.trim()) {
            generateQRCode();
        }
    });

    // Sync hex input fields with Pickr initial values
    foregroundHexInput.value = foregroundColor;
    backgroundHexInput.value = backgroundColor;

    // --- Event Listeners for Hex Input Fields ---
    foregroundHexInput.addEventListener('change', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            foregroundColor = hex;
            fgPicker.setColor(hex);
            // Automatically regenerate QR code if text exists
            if (qrText.value.trim()) {
                generateQRCode();
            }
        } else {
            // Revert to picker's current color if invalid
            foregroundHexInput.value = fgPicker.getColor().toHEXA().toString().substring(0,7);
        }
    });

    backgroundHexInput.addEventListener('change', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            backgroundColor = hex;
            bgPicker.setColor(hex);
            // Automatically regenerate QR code if text exists
            if (qrText.value.trim()) {
                generateQRCode();
            }
        } else {
            backgroundHexInput.value = bgPicker.getColor().toHEXA().toString().substring(0,7);
        }
    });

    // --- Initialize Slider UI ---
    if (qrBorderSlider && qrBorderValueSpan) {
        console.log("Slider and Span elements found. Initializing slider UI."); // DEBUG
        qrBorderSlider.value = currentQrPadding;
        qrBorderValueSpan.textContent = currentQrPadding;

        qrBorderSlider.addEventListener('input', () => {
            console.log("Slider input event fired!"); // DEBUG
            currentQrPadding = parseInt(qrBorderSlider.value, 10);
            qrBorderValueSpan.textContent = currentQrPadding;
            console.log("currentQrPadding updated to:", currentQrPadding); // DEBUG

            if (qrText.value.trim()) {
                console.log("Text input has value, calling generateQRCode()."); // DEBUG
                generateQRCode();
            } else {
                console.log("Text input is empty, not calling generateQRCode()."); // DEBUG
            }
        });
    } else {
        // This else block will tell us if the elements weren't found
        console.error("ERROR: QR Border Slider or Value Span element not found in the DOM!");
        if (!qrBorderSlider) {
            console.error("qrBorderSlider element is missing. Check ID: 'qr-border-slider'");
        }
        if (!qrBorderValueSpan) {
            console.error("qrBorderValueSpan element is missing. Check ID: 'qr-border-value'");
        }
    }

    function downloadQRCodeHandler() {
        const text = qrText.value.trim();
        if (!text) {
            alert("Please enter text and generate a QR code first before downloading.");
            return;
        }

        const downloadBaseQrSize = 1024; // High-resolution size for the QR data area
        const displayBaseSizeForReference = 256; // Display QR data area size used for padding reference
        
        // Calculate scaled padding for the download size
        const scaleFactor = downloadBaseQrSize / displayBaseSizeForReference;
        const scaledPaddingForDownload = Math.round(currentQrPadding * scaleFactor);

        const totalDownloadCanvasWidth = downloadBaseQrSize + (2 * scaledPaddingForDownload);
        const totalDownloadCanvasHeight = downloadBaseQrSize + (2 * scaledPaddingForDownload);

        // 1. Create the final download canvas (offscreen)
        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = totalDownloadCanvasWidth;
        downloadCanvas.height = totalDownloadCanvasHeight;
        const downloadCtx = downloadCanvas.getContext('2d');

        // 2. Fill download canvas with the chosen background color
        downloadCtx.fillStyle = backgroundColor;
        downloadCtx.fillRect(0, 0, totalDownloadCanvasWidth, totalDownloadCanvasHeight);
        
        // 3. Create a temporary div for the high-res core QR code
        const tempCoreDownloadDiv = document.createElement('div');
        tempCoreDownloadDiv.style.position = 'absolute'; // Make it invisible
        tempCoreDownloadDiv.style.left = '-9999px';
        document.body.appendChild(tempCoreDownloadDiv);

        try {
            new QRCode(tempCoreDownloadDiv, {
                text: text,
                width: downloadBaseQrSize,
                height: downloadBaseQrSize,
                colorDark: foregroundColor,
                colorLight: backgroundColor,
                correctLevel: QRCode.CorrectLevel.H
            });

            const coreDownloadCanvas = tempCoreDownloadDiv.querySelector('canvas');
            if (coreDownloadCanvas) {
                // 4. Draw the high-res core QR onto our downloadCanvas, centered
                downloadCtx.drawImage(coreDownloadCanvas, scaledPaddingForDownload, scaledPaddingForDownload);

                // 5. Trigger download
                const dataURL = downloadCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = 'qr_code_with_border.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                 console.error("Core QR Canvas for download not generated.");
                 alert("Error: Could not prepare QR image for download.");
            }
        } catch (error) {
            console.error("Error generating QR code for download:", error);
            alert("An error occurred while generating the QR code for download.");
        } finally {
            document.body.removeChild(tempCoreDownloadDiv); // Clean up
        }
    }

    // function downloadQRCodeHandler() {
    //     const text = qrText.value.trim();
    //     if (!text) {
    //         alert("Please enter text and generate a QR code first before downloading.");
    //         return;
    //     }

    //     // --- Parameters for high-quality download ---
    //     const downloadSize = 1024; // e.g., 1024x1024 pixels for high resolution
    //     const downloadFilename = "qr_code.png";

    //     // Create a temporary container for the high-resolution QR code
    //     // This container does not need to be added to the visible DOM
    //     const tempQrContainer = document.createElement('div');

    //     try {
    //         // Generate QR code in the temporary container with high resolution
    //         new QRCode(tempQrContainer, {
    //             text: text,
    //             width: downloadSize,
    //             height: downloadSize,
    //             colorDark: foregroundColor,  // Assumes foregroundColor is globally available
    //             colorLight: backgroundColor, // Assumes backgroundColor is globally available
    //             correctLevel: QRCode.CorrectLevel.H
    //         });

    //         const canvas = tempQrContainer.querySelector('canvas');
    //         if (canvas) {
    //             // Convert canvas to PNG data URL
    //             const dataURL = canvas.toDataURL('image/png');

    //             // Create a temporary link element to trigger the download
    //             const link = document.createElement('a');
    //             link.href = dataURL;
    //             link.download = downloadFilename;

    //             // Append to body, click, and remove (standard way to trigger download)
    //             document.body.appendChild(link);
    //             link.click();
    //             document.body.removeChild(link);
    //         } else {
    //             // This case should ideally not happen if QRCode library works as expected
    //             console.error("Canvas element not found in temporary QR container.");
    //             alert("Could not generate QR code image for download. Canvas not found.");
    //         }
    //     } catch (error) {
    //         console.error("Error generating QR code for download:", error);
    //         alert("An error occurred while generating the QR code for download.");
    //     }
    // }

    // Add event listener to the download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadQRCodeHandler);
    }

    function generateQRCode() {
        const text = qrText.value.trim();
        qrCodeContainer.innerHTML = ''; // Clear previous content (e.g., old canvas)

        if (!text) {
            return; // Silently return if no text
        }

        const displayBaseSize = 256; // The size of the QR code data area for display
        const actualPadding = currentQrPadding; // Pixels of padding on each side

        const totalDisplayCanvasWidth = displayBaseSize + (2 * actualPadding);
        const totalDisplayCanvasHeight = displayBaseSize + (2 * actualPadding);

        // 1. Create the final display canvas (this will be visible)
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = totalDisplayCanvasWidth;
        displayCanvas.height = totalDisplayCanvasHeight;
        const displayCtx = displayCanvas.getContext('2d');

        // 2. Fill display canvas with the chosen background color
        displayCtx.fillStyle = backgroundColor;
        displayCtx.fillRect(0, 0, totalDisplayCanvasWidth, totalDisplayCanvasHeight);

        // 3. Create a temporary, offscreen div for qrcode.js to draw the core QR
        const tempCoreQrDiv = document.createElement('div');
        // qrcode.js requires the element to be in the DOM to calculate sizes correctly,
        // so we make it invisible and add/remove it.
        tempCoreQrDiv.style.position = 'absolute';
        tempCoreQrDiv.style.left = '-9999px';
        document.body.appendChild(tempCoreQrDiv);


        try {
            new QRCode(tempCoreQrDiv, {
                text: text,
                width: displayBaseSize,
                height: displayBaseSize,
                colorDark: foregroundColor,
                colorLight: backgroundColor, // qrcode.js will use this for its own background
                correctLevel: QRCode.CorrectLevel.H
            });

            const coreQrCanvas = tempCoreQrDiv.querySelector('canvas');
            if (coreQrCanvas) {
                // 4. Draw the core QR code (from qrcode.js) onto our displayCanvas
                displayCtx.drawImage(coreQrCanvas, actualPadding, actualPadding);
                qrCodeContainer.appendChild(displayCanvas); // Add the final canvas to the page
            } else {
                console.error("Core QR Canvas not generated by qrcode.js");
                qrCodeContainer.innerHTML = '<p class="error">Error: Core QR canvas not found.</p>';
            }
        } catch (error) {
            console.error("QR Code generation error:", error);
            qrCodeContainer.innerHTML = '<p class="error">Error generating QR code.</p>';
        } finally {
            document.body.removeChild(tempCoreQrDiv); // Clean up the temporary div
        }
    }

    // function generateQRCode() {
    //     const text = qrText.value.trim();
        
    //     // Clear previous QR code display and reset instance
    //     qrCodeContainer.innerHTML = '';
    //     qrCodeInstance = null; // Reset the instance
    
    //     if (!text) {
    //         // If text is empty, we simply clear the QR code area and do nothing further.
    //         // This avoids alerts during automatic color updates if the text field was cleared.
    //         return;
    //     }
    
    //     try {
    //         qrCodeInstance = new QRCode(qrCodeContainer, {
    //             text: text,
    //             width: 256, // Adjust size as needed
    //             height: 256,
    //             colorDark: foregroundColor,
    //             colorLight: backgroundColor,
    //             correctLevel: QRCode.CorrectLevel.H // Highest error correction
    //         });
    //     } catch (error) {
    //         console.error("QR Code generation error:", error);
    //         // Optionally, display a subtle error message in the UI instead of an alert
    //         // For example: qrCodeContainer.innerHTML = '<p class="error">Error generating QR code.</p>';
    //     }
    // }

    // Event listener for the button
    generateBtn.addEventListener('click', generateQRCode);

    // Optional: Generate QR on Enter key in text input
    qrText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });
});