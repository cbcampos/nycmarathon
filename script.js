const miles = [
    { number: 1, left: "8%", top: "65%", sponsored: true, sponsor: "AC Campos", message: "Start strong! You've got this!" },
    { number: 23, left: "82%", top: "40%", sponsored: true, sponsor: "Haley Flanery", message: "You're almost there! Push to the finish!" }
];

// Convert pixel locations to percentage-based positions for responsiveness
const pixelToPercentage = (x, y) => ({
    left: `${(x / 4001) * 100}%`,
    top: `${(y / 1817) * 100}%`
});

const milePositions = [
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

// Merge positions into miles array
milePositions.forEach(milePos => {
    const existingMile = miles.find(m => m.number === milePos.number);
    if (!existingMile) {
        miles.push({ number: milePos.number, ...milePos.coords, sponsored: false });
    } else {
        existingMile.left = milePos.coords.left;
        existingMile.top = milePos.coords.top;
    }
});

const mileContainer = document.getElementById("mile-markers");
const tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
document.body.appendChild(tooltip);

let activeTooltip = null;

// Create mile markers dynamically
miles.forEach(mile => {
    const marker = document.createElement("div");
    marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
    marker.textContent = mile.number;
    marker.dataset.mile = mile.number;
    marker.style.left = mile.left;
    marker.style.top = mile.top;

    marker.addEventListener("mouseover", (event) => showTooltip(event, mile));
    marker.addEventListener("mouseout", () => hideTooltip());

    tooltip.addEventListener("mouseover", () => {
        if (activeTooltip) tooltip.style.display = "block";
    });

    tooltip.addEventListener("mouseout", () => hideTooltip());

    marker.addEventListener("click", () => {
        if (!mile.sponsored) {
            openSponsorModal(mile.number);
        }
    });

    mileContainer.appendChild(marker);
});

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
