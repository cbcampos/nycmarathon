const googleScriptURL = "https://script.google.com/macros/s/AKfycbzNvrwrZRcX8M2Vy7H3u1l3nTgZ97-hboVxnNnJRn2kbmaaRNihf1oWzmpAA-CAOk7jgg/exec";
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

        marker.addEventListener("mouseover", (event) => showTooltip(event, mile));
        marker.addEventListener("mouseout", () => hideTooltip());

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
        sponsorButton.addEventListener('click', () => {
            openSponsorModal(mile.number);
            hideTooltip();
        });
    }

    document.body.appendChild(tooltip);
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
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
        // Create a form element
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = googleScriptURL;
        form.target = 'hidden_iframe';

        // Add form data as hidden fields
        Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Add form to document and submit
        document.body.appendChild(form);
        form.submit();

        // Wait for submission to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Clean up
        document.body.removeChild(form);
        document.body.removeChild(iframe);

        // Show success message
        alert("🎉 Sponsorship submitted successfully!");
        
        // Close the modal
        modal.style.display = "none";
        
        // Reset the form
        document.getElementById("sponsorForm").reset();
        
        // Reload sponsorships to update the map
        await loadSponsorships();
        
    } catch (error) {
        logDebug("❌ Submission Failed:", error);
        alert("Error submitting sponsorship. Check console for details.");
    }
});

// Load sponsorships when page loads
document.addEventListener("DOMContentLoaded", loadSponsorships);
