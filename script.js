const googleScriptURL = "https://script.google.com/macros/s/AKfycbzhAX6DHWJSYgCXlavph0pBDu6Xa_yVpbRcEjIIgDGZS6l5C0-QPOD7obUnF1OL-KfQ/exec";
const mileContainer = document.getElementById("mile-markers");

// Tooltip setup
const tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
document.body.appendChild(tooltip);
let activeTooltip = null;

// Convert pixel positions to percentages for responsive scaling
const pixelToPercentage = (x, y) => ({
    left: `${((x - 64) / 4001) * 100}%`,
    top: `${((y - 76) / 1817) * 100}%`
});

// Define initial mile positions
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

// Fetch sponsorships from Google Sheets
async function loadSponsorships() {
    try {
        const response = await fetch(`${googleScriptURL}?action=getSponsorshipData`);
        const sponsorships = await response.json();
        let totalRaised = 0;

        miles.forEach(mile => {
            if (sponsorships[mile.number]) {
                mile.sponsored = true;
                mile.sponsor = sponsorships[mile.number].sponsor;
                mile.message = sponsorships[mile.number].message;
                totalRaised += 100; // Assume $100 per sponsorship
            } else {
                mile.sponsored = false;
                mile.sponsor = null;
                mile.message = null;
            }
        });

        updateProgressBar(totalRaised);
        renderMileMarkers();
    } catch (error) {
        console.error("Error loading sponsorships:", error);
    }
}

// Update fundraising progress bar
function updateProgressBar(totalRaised) {
    const progressText = document.getElementById("amountRaised");
    const progressFill = document.querySelector(".progress-fill");
    
    progressText.textContent = `$${totalRaised} raised so far`;
    const percentage = (totalRaised / 2600) * 100;
    progressFill.style.width = `${percentage}%`;
}

// Render mile markers dynamically
function renderMileMarkers() {
    if (!mileContainer) return;
    mileContainer.innerHTML = ""; // Clear existing markers

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
}

// Load sponsorships on page load
document.addEventListener("DOMContentLoaded", loadSponsorships);
