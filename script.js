const googleScriptURL = "https://script.google.com/macros/s/AKfycbzhAX6DHWJSYgCXlavph0pBDu6Xa_yVpbRcEjIIgDGZS6l5C0-QPOD7obUnF1OL-KfQ/exec";
const mileContainer = document.getElementById("mile-markers");
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
const miles = [
    { number: 1, coords: pixelToPercentage(321, 1175) },
    { number: 2, coords: pixelToPercentage(492, 1282) },
    { number: 3, coords: pixelToPercentage(680, 1200) },
    { number: 4, coords: pixelToPercentage(910, 1170) },
    { number: 5, coords: pixelToPercentage(1130, 1220) },
    { number: 6, coords: pixelToPercentage(1322, 1260) },
    { number: 7, coords: pixelToPercentage(1522, 1275) },
    { number: 8, coords: pixelToPercentage(1715, 1260) },
    { number: 9, coords: pixelToPercentage(1820, 1410) },
    { number: 10, coords: pixelToPercentage(2005, 1265) },
    { number: 11, coords: pixelToPercentage(2130, 1230) },
    { number: 12, coords: pixelToPercentage(2340, 1260) },
    { number: 13, coords: pixelToPercentage(2507, 1150) },
    { number: 14, coords: pixelToPercentage(2665, 1075) },
    { number: 15, coords: pixelToPercentage(2760, 1125) },
    { number: 16, coords: pixelToPercentage(2760, 915) },
    { number: 17, coords: pixelToPercentage(2965, 890) },
    { number: 18, coords: pixelToPercentage(3190, 890) },
    { number: 19, coords: pixelToPercentage(3430, 890) },
    { number: 20, coords: pixelToPercentage(3648, 920) },
    { number: 21, coords: pixelToPercentage(3690, 770) },
    { number: 22, coords: pixelToPercentage(3485, 725) },
    { number: 23, coords: pixelToPercentage(3265, 725) },
    { number: 24, coords: pixelToPercentage(3060, 710) },
    { number: 25, coords: pixelToPercentage(2865, 710) },
    { number: 26, coords: pixelToPercentage(2790, 625) }
];

// Fetch sponsorships from Google Sheets
async function loadSponsorships() {
    try {
        const response = await fetch(`${googleScriptURL}?action=getSponsorshipData`);
        const sponsorships = await response.json();

        miles.forEach(mile => {
            if (sponsorships[mile.number]) {
                mile.sponsored = true;
                mile.sponsor = sponsorships[mile.number].sponsor;
                mile.message = sponsorships[mile.number].message;
            } else {
                mile.sponsored = false;
                mile.sponsor = null;
                mile.message = null;
            }
        });

        renderMileMarkers();
    } catch (error) {
        console.error("Error loading sponsorships:", error);
    }
}

// Render mile markers dynamically
function renderMileMarkers() {
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

// Show tooltip
function showTooltip(event, mile) {
    activeTooltip = mile;
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
    activeTooltip = null;
}

// Open sponsor modal
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");

function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "block";
    tooltip.style.display = "none";
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
            loadSponsorships(); // Refresh sponsorships from the sheet
        } else {
            alert("Error submitting sponsorship.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Submission failed. Please try again.");
    }
});

// Load sponsorships when the page loads
document.addEventListener("DOMContentLoaded", loadSponsorships);
