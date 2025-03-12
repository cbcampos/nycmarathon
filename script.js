const miles = [
    { number: 1, left: "13%", top: "65%", sponsored: true, sponsor: "Sarah J.", message: "Start strong! You've got this!" },
    { number: 2, left: "18%", top: "67%", sponsored: true, sponsor: "Marcus T.", message: "Keep moving forward!" },
    { number: 3, left: "23%", top: "65%", sponsored: false },
    { number: 4, left: "29%", top: "64%", sponsored: false },
    { number: 5, left: "35%", top: "65%", sponsored: false },
    { number: 6, left: "40%", top: "67%", sponsored: false },
    { number: 7, left: "45%", top: "67%", sponsored: false },
    { number: 8, left: "49%", top: "67%", sponsored: false },
    { number: 9, left: "52%", top: "70%", sponsored: false },
    { number: 10, left: "55%", top: "70%", sponsored: false },
    { number: 11, left: "58%", top: "66%", sponsored: false },
    { number: 12, left: "62%", top: "65%", sponsored: false },
    { number: 13, left: "67%", top: "65%", sponsored: false },
    { number: 14, left: "70%", top: "62%", sponsored: false },
    { number: 15, left: "73%", top: "63%", sponsored: false },
    { number: 16, left: "75%", top: "57%", sponsored: false },
    { number: 17, left: "79%", top: "57%", sponsored: false },
    { number: 18, left: "82%", top: "57%", sponsored: false },
    { number: 19, left: "86%", top: "57%", sponsored: false },
    { number: 20, left: "90%", top: "57%", sponsored: false },
    { number: 21, left: "92%", top: "53%", sponsored: false },
    { number: 22, left: "87%", top: "51%", sponsored: false },
    { number: 23, left: "84%", top: "51%", sponsored: false },
    { number: 24, left: "80%", top: "51%", sponsored: false },
    { number: 25, left: "76%", top: "51%", sponsored: false },
    { number: 26, left: "73%", top: "49%", sponsored: false }
];

const mileContainer = document.getElementById("mile-markers");

// Create mile markers dynamically
miles.forEach(mile => {
    const marker = document.createElement("div");
    marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
    marker.textContent = mile.number;
    marker.dataset.mile = mile.number;
    marker.style.left = mile.left;
    marker.style.top = mile.top;

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
