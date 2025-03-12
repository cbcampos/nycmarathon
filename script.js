const miles = [
    { number: 1, sponsored: true, sponsor: "Sarah J.", message: "Start strong! You've got this!" },
    { number: 2, sponsored: true, sponsor: "Marcus T.", message: "Keep moving forward!" },
    { number: 3, sponsored: false },
    { number: 4, sponsored: false },
    { number: 5, sponsored: false }
];

const mileContainer = document.getElementById("mile-markers");

// Create mile markers dynamically
miles.forEach(mile => {
    const marker = document.createElement("div");
    marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
    marker.textContent = mile.number;
    marker.dataset.mile = mile.number;
    marker.style.left = `${mile.number * 4}%`;
    marker.style.top = "50%";

    marker.addEventListener("click", () => openSponsorModal(mile.number));

    mileContainer.appendChild(marker);
});

// Open sponsor modal
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");
const sponsorForm = document.getElementById("sponsorForm");

function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "block";
}

// Close modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// Handle form submission
sponsorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    modal.style.display = "none";
    document.getElementById("thank-you").style.display = "block";
});
