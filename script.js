const googleScriptURL = "https://script.google.com/macros/s/AKfycbyUibrVxkBz6BwmwRIBEgMHoYXMOhbRUW6mckIespeTlz8rrWZVX8YnbhZQhl3RZ2Gs/exec";
const mileContainer = document.getElementById("mile-markers");
const progressText = document.getElementById("amountRaised");
const progressFill = document.querySelector(".progress-fill");

// Debug area (creates an element if not already on the page)
function setupDebugging() {
    let debugArea = document.getElementById("debugArea");
    if (!debugArea) {
        debugArea = document.createElement("div");
        debugArea.id = "debugArea";
        debugArea.style = "background:#f8f8f8; padding:10px; border:1px solid #ccc; margin-top:10px; max-height:200px; overflow-y:auto; font-size:12px;";
        document.body.appendChild(debugArea);
    }
}

// Function to log debug messages to console and on the page
function logDebug(message) {
    console.log(message); // Logs in the browser console
    let debugArea = document.getElementById("debugArea");
    if (debugArea) {
        debugArea.innerHTML += `<p>${message}</p>`;
    }
}

// Initialize the debugging display
setupDebugging();

// Fetch sponsorship data from Google Sheets
async function loadSponsorships() {
    logDebug("🔄 Fetching sponsorship data...");
    try {
        const response = await fetch(`${googleScriptURL}?action=getSponsorshipData`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const sponsorships = await response.json();
        logDebug("✅ Sponsorship data loaded: " + JSON.stringify(sponsorships, null, 2));

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

// Update the fundraising progress bar
function updateProgressBar(totalRaised) {
    const goalAmount = 2600;
    progressText.textContent = `$${totalRaised} raised so far`;
    const percentage = (totalRaised / goalAmount) * 100;
    progressFill.style.width = `${percentage}%`;
    logDebug(`🔄 Progress bar updated: $${totalRaised} raised so far (${percentage.toFixed(2)}%)`);
}

// Render mile markers on the map
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

// Show tooltip for mile marker
function showTooltip(event, mile) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");

    tooltip.innerHTML = mile.sponsored
        ? `<h3>Mile ${mile.number} - Sponsored by ${mile.sponsor}</h3><p class="message">"${mile.message}"</p>`
        : `<h3>Mile ${mile.number} - Needs a Sponsor</h3><button class="sponsor-button" onclick="openSponsorModal(${mile.number})">Sponsor This Mile</button>`;

    document.body.appendChild(tooltip);
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.style.display = "block";
}

// Hide the tooltip when mouse leaves
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Open sponsor modal when mile is clicked
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");

function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "block";
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

// Load sponsorships when the page loads
document.addEventListener("DOMContentLoaded", () => {
    logDebug("🌍 Page loaded. Fetching sponsorship data...");
    loadSponsorships();
});
