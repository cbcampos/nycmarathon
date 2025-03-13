const googleScriptURL = "https://script.google.com/macros/s/AKfycbzhAX6DHWJSYgCXlavph0pBDu6Xa_yVpbRcEjIIgDGZS6l5C0-QPOD7obUnF1OL-KfQ/exec";
const mileContainer = document.getElementById("mile-markers");
const progressText = document.getElementById("amountRaised");
const progressFill = document.querySelector(".progress-fill");

// Create a debug area
const debugArea = document.createElement("div");
debugArea.id = "debugArea";
debugArea.style.background = "#f8d7da";
debugArea.style.color = "#721c24";
debugArea.style.padding = "10px";
debugArea.style.margin = "10px";
debugArea.style.border = "1px solid #f5c6cb";
debugArea.style.fontFamily = "monospace";
document.body.insertBefore(debugArea, document.body.firstChild);

function logDebug(message) {
    debugArea.innerHTML += `<p>${message}</p>`;
    console.log(message);
}

// Check if required elements exist
if (!mileContainer) {
    logDebug("❌ Error: mile-markers container not found in the DOM.");
}

// Convert pixel positions to percentages for responsive scaling
const pixelToPercentage = (x, y) => ({
    left: `${((x - 64) / 4001) * 100}%`,
    top: `${((y - 76) / 1817) * 100}%`
});

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

logDebug(`✅ Loaded mile positions.`);

// Fetch sponsorships from Google Sheets
async function loadSponsorships() {
    logDebug("🔄 Fetching sponsorship data...");
    try {
        const response = await fetch(`${googleScriptURL}?action=getSponsorshipData`);
        const sponsorships = await response.json();
        let totalRaised = 0;

        logDebug("✅ Sponsorship data loaded from Google Sheets:");
        logDebug(JSON.stringify(sponsorships, null, 2));

        miles.forEach(mile => {
            if (sponsorships[mile.number]) {
                mile.sponsored = true;
                mile.sponsor = sponsorships[mile.number].sponsor;
                mile.message = sponsorships[mile.number].message;
                totalRaised += parseInt(sponsorships[mile.number].amount || 100); // Default $100 per mile
            } else {
                mile.sponsored = false;
                mile.sponsor = null;
                mile.message = null;
            }
        });

        updateProgressBar(totalRaised);
        renderMileMarkers();
    } catch (error) {
        logDebug(`❌ Error loading sponsorships: ${error}`);
    }
}

// Update fundraising progress bar
function updateProgressBar(totalRaised) {
    const goalAmount = 2600;
    progressText.textContent = `$${totalRaised} raised so far`;
    const percentage = (totalRaised / goalAmount) * 100;
    progressFill.style.width = `${percentage}%`;
    logDebug(`🔄 Updating progress bar: $${totalRaised} raised so far (${percentage.toFixed(2)}%)`);
}

// Render mile markers dynamically
function renderMileMarkers() {
    if (!mileContainer) return;
    mileContainer.innerHTML = ""; // Clear existing markers
    logDebug("🔄 Rendering mile markers...");

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
    tooltip.innerHTML = mile.sponsored
        ? `<h3>Mile ${mile.number} - Sponsored by ${mile.sponsor}</h3><p class="message">"${mile.message}"</p>`
        : `<h3>Mile ${mile.number} - Needs a Sponsor</h3><button class="sponsor-button" onclick="openSponsorModal(${mile.number})">Sponsor This Mile</button>`;

    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.style.display = "block";
}

// Hide tooltip
function hideTooltip() {
    tooltip.style.display = "none";
}

// Open sponsor modal
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");

function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "block";
    tooltip.style.display = "none";
    logDebug(`📝 Opening sponsor form for mile ${mile}`);
}

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// Handle form submission
document.getElementById("sponsorForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        mile: document.getElementById("mileNumber").textContent,
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        message: document.getElementById("message").value,
        amount: document.getElementById("amount").value
    };

    logDebug(`📤 Submitting sponsorship for mile ${formData.mile}`);

    try {
        const response = await fetch(googleScriptURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert("Sponsorship submitted successfully!");
            document.getElementById("sponsorForm").reset();
            document.getElementById("sponsorModal").style.display = "none";
            loadSponsorships();
        } else {
            logDebug("❌ Error submitting sponsorship.");
        }
    } catch (error) {
        logDebug(`❌ Submission failed: ${error}`);
    }
});

// Load sponsorships on page load
document.addEventListener("DOMContentLoaded", () => {
    logDebug("🌍 Page loaded. Fetching sponsorship data...");
    loadSponsorships();
});
