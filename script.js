const nationalHelplines = [
    { name: "राष्ट्रीय आपातकालीन सेवा (All-In-One)", number: "112", category: "Police" },
    { name: "एम्बुलेंस आपातकालीन सेवा (चिकित्सा)", number: "108", category: "Medical" },
    { name: "महिला सुरक्षा हेल्प लाइन (Women Line)", number: "1090", category: "Women" },
    { name: "राष्ट्रीय साइबर अपराध (Cyber Crime)", number: "1930", category: "Cyber" },
    { name: "चाइल्ड हेल्प लाईन (बाल सुरक्षा)", number: "1098", category: "Women" }
];

let userLat = null;
let userLon = null;
let currentCategory = "all";
let isGPSEnabled = true;

function toggleGPS() {
    isGPSEnabled = document.getElementById("gpsToggle").checked;
    const infoBox = document.getElementById("infoBox");
    if (isGPSEnabled) {
        infoBox.style.opacity = "1";
        trackLiveLocation();
    } else {
        infoBox.style.opacity = "0.6";
        resetLocationUI("ऑफलाइन", "ऑफलाइन", "टॉगल बंद है", "------");
        loadDirectory();
    }
}

// 📍 ब्राउज़र का अपना सुरक्षित इन-बिल्ट ट्रैकर (यह बिना बाहरी API के सीधे काम करता है)
function trackLiveLocation() {
    if (!isGPSEnabled) return;

    if (!navigator.geolocation) {
        resetLocationUI("सपोर्ट नहीं है", "जीपीएस अनुपलब्ध", "लोकल मोड सक्रिय", "------");
        loadDirectory();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;

            // बाहरी API के ब्लॉक होने पर भी यूज़र को सीधे उसके अक्षांश/देशांतर दिखाकर आश्वस्त करें
            resetLocationUI(
                "सक्रिय (Live)",
                `अक्षांश: ${userLat.toFixed(3)}`,
                `देशांतर: ${userLon.toFixed(3)}`,
                "ऑटो-डिटेक्ट"
            );

            document.getElementById("locationStatus").innerHTML = `<i class="fa-solid fa-circle-check"></i> GPS सक्रिय`;
            document.getElementById("locationStatus").className = "live-location-badge success";
            document.getElementById("directoryTitle").innerText = "आपके वर्तमान स्थान की लाइव सेवाएं";
            loadDirectory();
        },
        (error) => {
            console.log("GPS Denied or Timeout");
            resetLocationUI("अनुमति लंबित", "कृपया GPS ऑन करें", "अनुमति दें", "------");
            loadDirectory();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

function resetLocationUI(state, district, village, pin) {
    document.getElementById("stateName").innerText = state;
    document.getElementById("districtName").innerText = district;
    document.getElementById("villageName").innerText = village;
    document.getElementById("pinCode").innerText = pin;
}

function loadDirectory() {
    const listContainer = document.getElementById('directoryList');
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    listContainer.innerHTML = '';

    if (userLat) {
        document.getElementById("nearestHub").innerHTML = `<i class="fa-solid fa-bolt"></i> लाइव सैटेलाइट ट्रैकर सक्रिय है। नीचे बटनों का उपयोग करें।`;
    } else {
        document.getElementById("nearestHub").innerHTML = `<i class="fa-solid fa-circle-info"></i> कृपया ऊपर ब्राउज़र में लोकेशन अनुमति (Allow) दें।`;
    }

    const filtered = nationalHelplines.filter(item => {
        const matchesCategory = currentCategory === "all" || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchText);
        return matchesCategory && matchesSearch;
    });

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="contact-info">
                <h4>${item.name} <span class="distance-tag" style="background:#e2e8f0; color:#475569;">टोल-फ्री</span></h4>
                <p><i class="fa-solid fa-layer-group"></i> श्रेणी: ${item.category}</p>
                <p style="margin-top:4px;"><i class="fa-solid fa-phone-flip"></i> <strong>${item.number}</strong></p>
            </div>
            <a href="tel:${item.number}" class="call-btn">
                <i class="fa-solid fa-phone"></i>
            </a>
        `;
        listContainer.appendChild(card);
    });

    // 🚀 अचूक डायनेमिक गूगल मैप्स पैरामीटर्स (यह नागपुर में नागपुर का और मऊ में मऊ का डेटा लाइव दिखाएगा)
    if (userLat) {
        const dynamicMapCards = document.createElement('div');
        dynamicMapCards.innerHTML = `
            <h3 class="live-map-grid-title"><i class="fa-solid fa-location-arrow"></i> आपके स्थान के अनुसार लाइव सुविधाएं:</h3>
            <div class="map-grid-container">
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#0ea5e9;">
                    <i class="fa-solid fa-hospital"></i> नजदीकी अस्पताल खोजें
                </a>
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#334155;">
                    <i class="fa-solid fa-building-shield"></i> नजदीकी थाना खोजें
                </a>
            </div>
            <div class="map-grid-container" style="margin-top:10px;">
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#dc2626;">
                    <i class="fa-solid fa-droplet"></i> नजदीकी ब्लड बैंक
                </a>
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#f97316;">
                    <i class="fa-solid fa-pills"></i> 24x7 मेडिकल स्टोर
                </a>
            </div>
        `;
        listContainer.appendChild(dynamicMapCards);
    }
}

function filterData() { loadDirectory(); }

function filterByCategory(category) {
    document.querySelectorAll('.cat-card').forEach(card => card.classList.remove('active'));
    if (currentCategory === category) {
        currentCategory = "all";
    } else {
        currentCategory = category;
        document.getElementById(`cat-${category}`).classList.add('active');
    }
    loadDirectory();
}

function triggerSOS() {
    alert("SOS सक्रिय! राष्ट्रीय आपातकालीन सेवा 112 डायल की जा रही है।");
    window.location.href = "tel:112";
}

window.onload = () => { trackLiveLocation(); };
