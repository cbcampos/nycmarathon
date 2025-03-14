const googleScriptURL = "https://script.google.com/macros/s/AKfycbwMSKx0KRo0nNriPKW7t7kA1UlIrzXhLI_Fym_QdFS60Lvu8PhYt4SunICrVzgvUMMU/exec";
const mileContainer = document.getElementById("mile-markers");
const progressText = document.getElementById("amountRaised");
const progressFill = document.querySelector(".progress-fill");
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");
const submitButton = document.querySelector(".submit-button");

// Debugging function
function logDebug(message) {
    console.log(message);
    const debugPanel = document.getElementById("debug-log");
    if (debugPanel) {
        debugPanel.innerHTML += `<br>🟢 ${message}`;
        debugPanel.scrollTop = debugPanel.scrollHeight; // Auto-scroll
    }
}

// Toggle debug panel visibility
function toggleDebugPanel() {
    const panel = document.getElementById("debug-panel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
}

// Define mile positions
const miles = Array.from({ length: 26 }, (_, i) => ({
    number: i + 1,
    coords: pixelToPercentage([
        321, 492, 680, 910, 1130, 1322, 1522, 1715, 1820, 2005,
        2130, 2340, 2507, 2665, 2760, 2760, 2965, 3190, 3430, 3648,
        3690, 3485, 3265, 3060, 2865, 2790
    ][i], [
        1175, 1282, 1200, 1170, 1220, 1260, 1275, 1260, 1410, 1265,
        1230, 1260, 1150, 1075, 1125, 915, 890, 890, 890, 920,
        770, 725, 725, 710, 710, 625
    ][i])
}));

// Convert pixel positions to percentage
function pixelToPercentage(x, y) {
    return {
        left: `${((x - 64) / 4001) * 100}%`,
        top: `${((y - 76) / 1817) * 100}%`
    };
}

// Fetch sponsorship data
async function loadSponsorships() {
    logDebug("🔄 Fetching sponsorship data...");
    try {
        // Create a unique callback name
        const callbackName = 'jsonpCallback_' + Math.round(100000 * Math.random());
        
        // Create a script element
        const script = document.createElement('script');
        script.src = `${googleScriptURL}?callback=${callbackName}`;
        
        // Create a promise that will resolve when the callback is called
        const sponsorshipsPromise = new Promise((resolve, reject) => {
            window[callbackName] = (data) => {
                resolve(data);
                // Clean up
                document.body.removeChild(script);
                delete window[callbackName];
            };
            
            script.onerror = () => {
                reject(new Error('Script loading failed'));
                // Clean up
                document.body.removeChild(script);
                delete window[callbackName];
            };
        });
        
        // Add the script to the document
        document.body.appendChild(script);
        
        // Wait for the data
        const sponsorships = await sponsorshipsPromise;
        logDebug("✅ Sponsorship data loaded:", sponsorships);

        let totalRaised = 0;
        miles.forEach(mile => {
            if (sponsorships[mile.number]) {
                mile.sponsored = true;
                mile.sponsor = sponsorships[mile.number].sponsor;
                mile.message = sponsorships[mile.number].message;
                totalRaised += parseInt(sponsorships[mile.number].amount || 100);
            } else {
                mile.sponsored = false;
            }
        });

        updateProgressBar(totalRaised);
        renderMileMarkers();
    } catch (error) {
        logDebug(`❌ Error loading sponsorships: ${error.message}`);
    }
}

// Update progress bar
function updateProgressBar(totalRaised) {
    const goalAmount = 2600;
    progressText.textContent = `$${totalRaised} raised so far`;
    const percentage = (totalRaised / goalAmount) * 100;
    progressFill.style.width = `${percentage}%`;
    logDebug(`🔄 Progress bar updated: $${totalRaised} raised so far (${percentage.toFixed(2)}%)`);
}

// Render mile markers
function renderMileMarkers() {
    if (!mileContainer) return;
    mileContainer.innerHTML = "";

    miles.forEach(mile => {
        const marker = document.createElement("div");
        marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
        marker.textContent = mile.number;
        marker.dataset.mile = mile.number;
        marker.style.left = mile.coords.left;
        marker.style.top = mile.coords.top;

        // Desktop events
        marker.addEventListener("mouseover", (event) => showTooltip(event, mile));
        marker.addEventListener("mouseout", () => hideTooltip());

        // Mobile events
        marker.addEventListener("touchstart", (event) => {
            event.preventDefault(); // Prevent double-tap zoom
            if (!mile.sponsored) {
                openSponsorModal(mile.number);
            } else {
                showTooltip(event, mile);
            }
        });

        // Click event for both desktop and mobile
        marker.addEventListener("click", () => {
            if (!mile.sponsored) {
                openSponsorModal(mile.number);
            }
        });

        mileContainer.appendChild(marker);
    });

    logDebug(`✅ Rendered ${miles.length} mile markers.`);
}

// Show tooltip
function showTooltip(event, mile) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");

    if (mile.sponsored) {
        tooltip.innerHTML = `<h3>Mile ${mile.number} - Sponsored by ${mile.sponsor}</h3><p class="message">"${mile.message}"</p>`;
    } else {
        tooltip.innerHTML = `<h3>Mile ${mile.number} - Needs a Sponsor</h3><button class="sponsor-button">Sponsor This Mile</button>`;
        
        // Add click event listener to the sponsor button
        const sponsorButton = tooltip.querySelector('.sponsor-button');
        sponsorButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            openSponsorModal(mile.number);
            hideTooltip();
        });
    }

    document.body.appendChild(tooltip);
    
    // Position tooltip based on device type
    if ('ontouchstart' in window) {
        // For mobile devices, position at the center of the screen
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
        // For desktop, position near the cursor
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
    }
    
    tooltip.style.display = "block";
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Open sponsor modal
function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    validateForm();
}

// Close modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
});

// Close modal when clicking outside the form
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

// Validate form before enabling submit button
function validateForm() {
    const requiredFields = document.querySelectorAll("#sponsorForm input[required], #sponsorForm textarea[required]");
    let allFilled = Array.from(requiredFields).every(field => field.value.trim() !== "");

    submitButton.disabled = !allFilled;
}

// Attach validation to required fields
document.querySelectorAll("#sponsorForm input[required], #sponsorForm textarea[required]").forEach(field => {
    field.addEventListener("input", validateForm);
});

// Handle form submission
document.getElementById("sponsorForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get the submit button and show loading state
    const submitButton = document.querySelector(".submit-button");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    submitButton.style.opacity = "0.7";
    submitButton.style.cursor = "not-allowed";

    logDebug("🚀 Form Submission Started");

    const formData = {
        mile: document.getElementById("mileNumber").textContent,
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        message: document.getElementById("message").value.trim(),
        amount: document.getElementById("amount").value.trim()
    };

    logDebug("📤 Submitting Form Data:", JSON.stringify(formData, null, 2));

    try {
        // Create a unique callback name
        const callbackName = 'formCallback_' + Math.round(100000 * Math.random());
        
        // Create a script element for JSONP
        const script = document.createElement('script');
        
        // Create the URL with all form data as query parameters
        const params = new URLSearchParams({
            ...formData,
            callback: callbackName
        });
        
        script.src = `${googleScriptURL}?${params.toString()}`;
        
        // Create a promise that will resolve when the callback is called
        const submissionPromise = new Promise((resolve, reject) => {
            // Set up the callback function
            window[callbackName] = (response) => {
                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response ? response.error : 'Submission failed'));
                }
                // Clean up
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };
            
            // Handle script load error
            script.onerror = () => {
                reject(new Error('Failed to submit form'));
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };
        });

        // Set a timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Submission is taking longer than expected, but your sponsorship may have been recorded. Please check back in a few minutes.'));
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            }, 5000);
        });

        // Add script to document to start the request
        document.body.appendChild(script);

        // Wait for either success or timeout
        const response = await Promise.race([submissionPromise, timeoutPromise]);
        
        logDebug("✅ Submission successful:", response);

        // Show appropriate success message based on email status
        if (response.emailSent) {
            alert("🎉 Sponsorship submitted successfully! Check your email for payment instructions.");
        } else {
            alert("🎉 Sponsorship submitted successfully! You will receive payment instructions shortly.");
        }
        
        // Close the modal and reset body overflow
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        
        // Reset the form
        document.getElementById("sponsorForm").reset();
        
        // Reload sponsorships to update the map
        await loadSponsorships();
        
    } catch (error) {
        logDebug("❌ Submission Failed:", error.message);
        alert(error.message);
        // Make sure to reset body overflow even on error
        document.body.style.overflow = "auto";
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = "Submit Sponsorship";
        submitButton.style.opacity = "1";
        submitButton.style.cursor = "pointer";
    }
});

// Load sponsorships when page loads
document.addEventListener("DOMContentLoaded", () => {
    loadSponsorships();
    initMobileMapControls();
});

// Initialize mobile map controls
function initMobileMapControls() {
    // Only initialize mobile controls if we're on a mobile device
    if (window.innerWidth > 768) {
        return; // Exit if we're on desktop
    }

    // Wrap the map image in a scrollable container
    const mapImage = document.querySelector('.map-image');
    if (!mapImage.parentElement.classList.contains('map-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'map-wrapper';
        mapImage.parentNode.insertBefore(wrapper, mapImage);
        wrapper.appendChild(mapImage);
        
        // Move mile markers inside wrapper to scale with map
        const mileMarkersContainer = document.getElementById('mile-markers');
        if (mileMarkersContainer) {
            wrapper.appendChild(mileMarkersContainer);
        }
    }

    // Add touch event listeners for panning
    const wrapper = document.querySelector('.map-wrapper');
    if (wrapper) {
        let lastX = 0;
        let lastY = 0;
        let isDragging = false;
        let currentX = 0;
        let currentY = 0;

        wrapper.addEventListener('touchstart', (e) => {
            isDragging = true;
            lastX = e.touches[0].pageX;
            lastY = e.touches[0].pageY;
            wrapper.style.transition = 'none';
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.touches[0].pageX - lastX;
            const deltaY = e.touches[0].pageY - lastY;
            
            currentX += deltaX;
            currentY += deltaY;
            
            // Limit panning to keep map visible
            const maxX = wrapper.offsetWidth * 0.5;
            const maxY = wrapper.offsetHeight * 0.5;
            
            currentX = Math.max(Math.min(currentX, maxX), -maxX);
            currentY = Math.max(Math.min(currentY, maxY), -maxY);
            
            wrapper.style.transform = `translate(${currentX}px, ${currentY}px)`;
            
            lastX = e.touches[0].pageX;
            lastY = e.touches[0].pageY;
        }, { passive: true });

        wrapper.addEventListener('touchend', () => {
            isDragging = false;
            wrapper.style.transition = 'transform 0.3s ease-out';
        });
    }
}

// Remove unused navigation functions
function getCurrentTransform() {
    const wrapper = document.querySelector('.map-wrapper');
    const transform = window.getComputedStyle(wrapper).getPropertyValue('transform');
    const matrix = new DOMMatrix(transform);
    return {
        x: matrix.m41,
        y: matrix.m42
    };
}
