const miles = [
    { number: 1, left: "13%", top: "65%", sponsored: true, sponsor: "AC Campos", message: "Start strong! You've got this!" },
    { number: 23, left: "84%", top: "51%", sponsored: true, sponsor: "Haley Flanery", message: "You're almost there! Push to the finish!" }
];

// Generate all 26 miles dynamically
for (let i = 1; i <= 26; i++) {
    if (!miles.find(m => m.number === i)) {
        miles.push({ number: i, left: `${10 + i * 3}%`, top: "60%", sponsored: false });
    }
}

const mileContainer = document.getElementById("mile-markers");
const tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
document.body.appendChild(tooltip);

miles.forEach(mile => {
    const marker = document.createElement("div");
    marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
    marker.textContent = mile.number;
    marker.dataset.mile = mile.number;
    marker.style.left = mile.left;
    marker.style.top = mile.top;

    marker.addEventListener("mouseover", (event) => {
        tooltip.innerHTML = mile.sponsored 
            ? `<h3>Mile ${mile.number} - Sponsored by ${mile.sponsor}</h3><p class="message">"${mile.message}"</p>` 
            : `<h3>Mile ${mile.number} - Needs a Sponsor</h3><button class="sponsor-button" onclick="openSponsorModal(${mile.number})">Sponsor This Mile</button>`;

        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.style.display = "block";
    });

    marker.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
    });

    marker.addEventListener("click", () => {
        if (!mile.sponsored) {
            openSponsorModal(mile.number);
        }
    });

    mileContainer.appendChild(marker);
});

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
