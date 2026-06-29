// केवल राष्ट्रीय हेल्पलाइन नंबर जो पूरे भारत में हमेशा काम करते हैं
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

// 🔌 लोकेशन ऑन/ऑफ टॉगल फीचर
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

// 📍 लाइव लोकेशन ट्रैक करने का मुख्य फंक्शन
function trackLiveLocation() {
    if (!isGPSEnabled) return;

    if (!navigator.geolocation) {
        fetchIPLocation(); // जीपीएस न होने पर सीधे इंटरनेट नेटवर्क से खोजें
        return;
    }

    // मोबाइल और कंप्यूटर के जीपीएस सिग्नल को रिस्पॉन्स देने के लिए 5 सेकंड का समय दें
    const geoOptions = {
        enableHighAccuracy: true, // मोबाइल के इन-बिल्ट जीपीएस से सटीक लोकेशन निकालने के लिए
        timeout: 5000,           
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;
            fetchAddressFromCoords(userLat, userLon);
        },
        (error) => {
            console.log("GPS Blocked/Timeout. Fetching Location via Internet Network...");
            fetchIPLocation(); // अगर जीपीएस ब्लॉक या टाइमआउट हो तो सीधे इंटरनेट नेटवर्क (IP) से लाइव स्थान जानें
        }, 
        geoOptions
    );
}

// 🌐 लाइव इंटरनेट नेटवर्क ट्रैकर (यह मोबाइल नेटवर्क के टावर से लाइव सिटी और पिनकोड खींचता है)
async function fetchIPLocation() {
    try {
        const response = await fetch('https://ipapi.co');
        const data = await response.json();
        
        userLat = data.latitude;
        userLon = data.longitude;

        resetLocationUI(
            data.region || "ढूँढ रहे हैं...",
            data.city || "ढूँढ रहे हैं...",
            "स्थानीय क्षेत्र",
            data.postal || "------"
        );

        document.getElementById("locationStatus").innerHTML = `<i class="fa-solid fa-network-wired"></i> नेटवर्क एक्टिव`;
        document.getElementById("locationStatus").className = "live-location-badge success";
        document.getElementById("directoryTitle").innerText = `आपातकालीन सेवाएं: ${data.city || 'आपके क्षेत्र'} के पास`;
        
        loadDirectory();
    } catch (e) {
        console.error("Network Fetch Failed", e);
        resetLocationUI("कनेक्शन एरर", "इंटरनेट धीमा है", "कृपया रिफ्रेश करें", "------");
    }
}

// 🗺️ जीपीएस कोऑर्डिनेट्स से बिल्कुल लाइव नाम (गांव, जिला, पिनकोड) निकालने का फंक्शन
async function fetchAddressFromCoords(lat, lon) {
    try {
        const response = await fetch(`https://bigdatacloud.net{lat}&longitude=${lon}&localityLanguage=hi`);
        const data = await response.json();
        
        const state = data.principalSubdivision || "भारत का राज्य";
        const district = data.city || data.localityInfo.administrative?.name || "आपका जिला";
        const village = data.locality || data.village || "आपका कस्बा";
        const pincode = data.postcode || "------";

        resetLocationUI(state, district, village, pincode);
        
        document.getElementById("locationStatus").innerHTML = `<i class="fa-solid fa-circle-check"></i> GPS एक्टिव`;
        document.getElementById("locationStatus").className = "live-location-badge success";
        document.getElementById("directoryTitle").innerText = `आपातकालीन सेवाएं: ${village}, ${district} के लिए`;
    } catch (error) {
        console.error("Coords Fetch Failed", error);
    }
    loadDirectory();
}

// यूआई (UI) टेक्स्ट अपडेट करने का कॉमन फंक्शन
function resetLocationUI(state, district, village, pin) {
    document.getElementById("stateName").innerText = state;
    document.getElementById("districtName").innerText = district;
    document.getElementById("villageName").innerText = village;
    document.getElementById("pinCode").innerText = pin;
}

// डायरेक्टरी रेंडर और लाइव मैप लिंक्स जनरेट करने का फंक्शन
function loadDirectory() {
    const listContainer = document.getElementById('directoryList');
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    listContainer.innerHTML = '';

    if (userLat) {
        document.getElementById("nearestHub").innerHTML = `<span style="color:#2ecc71;"><i class="fa-solid fa-bolt"></i> आपका लाइव लोकेशन ट्रैकर सक्रिय है। नीचे दिए गए लाइव बटनों का उपयोग करें।</span>`;
    }

    const filtered = nationalHelplines.filter(item => {
        const matchesCategory = currentCategory === "all" || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchText);
        return matchesCategory && matchesSearch;
    });

    // भारत सरकार के टोल-फ्री नंबर दिखाना
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="contact-info">
                <h4>${item.name} <span class="distance-tag" style="background:#e2e8f0; color:#475569;">टोल-फ्री</span></h4>
                <p><i class="fa-solid fa-layer-group"></i> श्रेणी: ${item.category}</p>
                <p style="margin-top:3px;"><i class="fa-solid fa-phone-flip"></i> <strong>${item.number}</strong></p>
            </div>
            <a href="tel:${item.number}" class="call-btn">
                <i class="fa-solid fa-phone"></i>
            </a>
        `;
        listContainer.appendChild(card);
    });

    // 🚀 लाइव डायनेमिक गूगल मैप्स कार्ड्स (यही वो फीचर है जो दुनिया के किसी भी शहर में लाइव काम करेगा)
    if (userLat) {
        const dynamicMapCards = document.createElement('div');
        dynamicMapCards.innerHTML = `
            <h3 style="font-size:14px; margin: 20px 0 10px 0; color:#e74c3c;"><i class="fa-solid fa-location-arrow"></i> आपके वर्तमान स्थान के अनुसार लाइव सुविधाएं:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <a href="https://google.com{userLat},${userLon},14z" target="_blank" class="call-btn" style="background:#3498db; width:100%; border-radius:10px; font-size:13px; gap:6px; height:48px; text-decoration:none;">
                    <i class="fa-solid fa-hospital"></i> नजदीकी अस्पताल खोजें
                </a>
                <a href="https://google.com{userLat},${userLon},14z" target="_blank" class="call-btn" style="background:#2c3e50; width:100%; border-radius:10px; font-size:13px; gap:6px; height:48px; text-decoration:none;">
                    <i class="fa-solid fa-building-shield"></i> नजदीकी थाना खोजें
                </a>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:10px;">
                <a href="https://google.com{userLat},${userLon},14z" target="_blank" class="call-btn" style="background:#cc1111; width:100%; border-radius:10px; font-size:13px; gap:6px; height:48px; text-decoration:none;">
                    <i class="fa-solid fa-droplet"></i> नजदीकी ब्लड बैंक
                </a>
                <a href="https://google.com{userLat},${userLon},14z" target="_blank" class="call-btn" style="background:#e67e22; width:100%; border-radius:10px; font-size:13px; gap:6px; height:48px; text-decoration:none;">
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
    alert("SOS एक्टिवेटेड! राष्ट्रीय आपातकालीन सेवा 112 डायल की जा रही है।");
    window.location.href = "tel:112";
}

window.onload = () => {
    trackLiveLocation();
};
